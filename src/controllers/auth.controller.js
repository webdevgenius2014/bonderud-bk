import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import logger from '../config/logger.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req, res) => {
  const { email, password, profile } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  // Create new user
  const user = new User({
    email: email.toLowerCase(),
    password,
    profile: {
      name: profile.name,
      phone: profile.phone || '',
      preferredLanguage: profile.preferredLanguage || 'en'
    },
    role: 'viewer', // Default role for new registrations
    auth:{
      isEmailVerified: false,
     }, // Require email verification
    isActive: true
  });

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  user.emailVerificationToken = hashedToken;
  
  await user.save();

  // TODO: Send verification email
  // const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  // await sendEmail({
  //   to: user.email,
  //   subject: 'Verify Your Email',
  //   template: 'email-verification',
  //   data: { verificationUrl, name: user.profile.name }
  // });

  logger.info('New user registered', { userId: user._id, email: user.email });

  // Generate tokens (allow login but remind to verify email)
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Store refresh token
  user.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date(),
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip
  });

  await user.save();

  // Prepare user data (exclude sensitive fields)
  const userData = user.toObject();
  delete userData.password;
  delete userData.refreshTokens;
  delete userData.emailVerificationToken;
  delete userData.resetPasswordToken;
  delete userData.resetPasswordExpires;
  delete userData.loginAttempts;
  delete userData.lockUntil;

  apiResponse.success(res, {
    user: userData,
    accessToken,
    refreshToken,
    message: 'Registration successful. Please verify your email.'
  }, 'Registration successful', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError('Email and password are required', 400, 'MISSING_CREDENTIALS');
  }

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password +loginAttempts +lockUntil');

  if (!user) {
    throw new ApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new ApiError(
      `Account locked. Try again in ${minutesLeft} minutes`,
      423,
      'ACCOUNT_LOCKED'
    );
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    // Increment login attempts
    user.loginAttempts += 1;

    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      await user.save();
      throw new ApiError('Account locked due to multiple failed attempts', 423, 'ACCOUNT_LOCKED');
    }

    await user.save();
    throw new ApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check if email is verified
  if (!user.auth.isEmailVerified) {
    throw new ApiError('Please verify your email first', 401, 'EMAIL_NOT_VERIFIED');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
  }

  // Reset login attempts
  user.auth.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Store refresh token
  user.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date(),
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip
  });

  // Keep only last 5 refresh tokens
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  await user.save();

  // Log successful login
  logger.info('User logged in', { userId: user._id, email: user.email });

  // Prepare user data (exclude sensitive fields)
  const userData = user.toObject();
  delete userData.password;
  delete userData.refreshTokens;
  delete userData.resetPasswordToken;
  delete userData.resetPasswordExpires;
  delete userData.loginAttempts;
  delete userData.lockUntil;

  apiResponse.success(res, {
    user: userData,
    accessToken,
    refreshToken
  }, 'Login successful');
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError('Refresh token required', 400, 'MISSING_TOKEN');
  }

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        tokenData => tokenData.token !== refreshToken
      );
      await user.save();
    }

    logger.info('User logged out', { userId: decoded.userId });
  } catch (error) {
    // Even if token is invalid, we'll return success
    logger.warn('Logout with invalid token attempted', { error: error.message });
  }

  apiResponse.success(res, null, 'Logout successful');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError('Refresh token required', 400, 'MISSING_TOKEN');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new ApiError('User not found', 401, 'USER_NOT_FOUND');
  }

  // Check if refresh token exists in user's tokens
  const tokenExists = user.refreshTokens.some(
    tokenData => tokenData.token === refreshToken
  );

  if (!tokenExists) {
    throw new ApiError('Refresh token not found', 401, 'TOKEN_NOT_FOUND');
  }

  if (!user.isActive) {
    throw new ApiError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

  // Replace old refresh token with new one
  user.refreshTokens = user.refreshTokens.map(tokenData =>
    tokenData.token === refreshToken
      ? {
          token: newRefreshToken,
          createdAt: new Date(),
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      : tokenData
  );

  await user.save();

  apiResponse.success(res, {
    accessToken,
    refreshToken: newRefreshToken
  }, 'Token refreshed successfully');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError('Email is required', 400, 'MISSING_EMAIL');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if user exists
    apiResponse.success(res, null, 'If the email exists, a reset link has been sent');
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // TODO: Send email with reset link
  // const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  // await sendEmail({
  //   to: user.email,
  //   subject: 'Password Reset Request',
  //   template: 'reset-password',
  //   data: { resetUrl, name: user.profile.name }
  // });

  logger.info('Password reset requested', { userId: user._id, email: user.email });

  apiResponse.success(res, null, 'If the email exists, a reset link has been sent');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new ApiError('Token and password are required', 400, 'MISSING_FIELDS');
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
  }

  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.refreshTokens = []; // Invalidate all refresh tokens

  await user.save();

  // TODO: Send confirmation email
  // await sendEmail({
  //   to: user.email,
  //   subject: 'Password Reset Successful',
  //   template: 'password-reset-success',
  //   data: { name: user.profile.name }
  // });

  logger.info('Password reset successful', { userId: user._id });

  apiResponse.success(res, null, 'Password reset successful');
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError('Verification token required', 400, 'MISSING_TOKEN');
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken
  });

  if (!user) {
    throw new ApiError('Invalid verification token', 400, 'INVALID_TOKEN');
  }

  user.auth.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  logger.info('Email verified', { userId: user._id, email: user.email });

  apiResponse.success(res, null, 'Email verified successfully');
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires');

  if (!user) {
    throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
  }

  apiResponse.success(res, { user }, 'Profile retrieved successfully');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = ['profile.name', 'profile.phone', 'profile.preferredLanguage'];
  const updates = Object.keys(req.body);
  
  const isValidUpdate = updates.every(update => 
    allowedUpdates.includes(update) || update.startsWith('profile.')
  );

  if (!isValidUpdate) {
    throw new ApiError('Invalid updates', 400, 'INVALID_UPDATES');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Update allowed fields
  if (req.body.profile) {
    Object.assign(user.profile, req.body.profile);
  }

  user.updatedAt = new Date();
  await user.save();

  const updatedUser = user.toObject();
  delete updatedUser.password;
  delete updatedUser.refreshTokens;
  delete updatedUser.resetPasswordToken;
  delete updatedUser.resetPasswordExpires;

  apiResponse.success(res, { user: updatedUser }, 'Profile updated successfully');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError('Current and new passwords are required', 400, 'MISSING_PASSWORDS');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
  }

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError('Current password is incorrect', 401, 'INVALID_PASSWORD');
  }

  user.password = newPassword;
  user.refreshTokens = []; // Invalidate all refresh tokens
  await user.save();

  logger.info('Password changed', { userId: user._id });

  apiResponse.success(res, null, 'Password changed successfully');
});