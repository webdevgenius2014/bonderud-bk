import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import logger from '../config/logger.js';

// Email templates
const emailTemplates = {
  welcome: {
    subject: {
      en: 'Welcome to Bonderud Law Firm',
      es: 'Bienvenido a Bonderud Law Firm'
    },
    html: {
      en: (data) => `
        <h2>Welcome ${data.name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Login credentials:</p>
        <ul>
          <li>Email: ${data.email}</li>
          <li>Temporary Password: ${data.tempPassword}</li>
        </ul>
        <p>Please change your password after first login.</p>
        <a href="${env.FRONTEND_URL}/login">Login Now</a>
      `,
      es: (data) => `
        <h2>¡Bienvenido ${data.name}!</h2>
        <p>Su cuenta ha sido creada exitosamente.</p>
        <p>Credenciales de acceso:</p>
        <ul>
          <li>Email: ${data.email}</li>
          <li>Contraseña temporal: ${data.tempPassword}</li>
        </ul>
        <p>Por favor cambie su contraseña después del primer inicio de sesión.</p>
        <a href="${env.FRONTEND_URL}/login">Iniciar Sesión</a>
      `
    }
  },
  passwordReset: {
    subject: {
      en: 'Password Reset Request',
      es: 'Solicitud de Restablecimiento de Contraseña'
    },
    html: {
      en: (data) => `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${data.resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      es: (data) => `
        <h2>Solicitud de Restablecimiento de Contraseña</h2>
        <p>Solicitó restablecer su contraseña.</p>
        <p>Haga clic en el enlace a continuación para restablecer su contraseña:</p>
        <a href="${data.resetUrl}">Restablecer Contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitó esto, ignore este correo.</p>
      `
    }
  },
  contactConfirmation: {
    subject: {
      en: 'We received your message',
      es: 'Recibimos su mensaje'
    },
    html: {
      en: (data) => `
        <h2>Thank you for contacting us</h2>
        <p>Dear ${data.name},</p>
        <p>We have received your message and will get back to you within 24-48 hours.</p>
        <p><strong>Your message:</strong></p>
        <blockquote>${data.message}</blockquote>
        <p>Best regards,<br>Bonderud Law Firm</p>
      `,
      es: (data) => `
        <h2>Gracias por contactarnos</h2>
        <p>Estimado/a ${data.name},</p>
        <p>Hemos recibido su mensaje y le responderemos dentro de 24-48 horas.</p>
        <p><strong>Su mensaje:</strong></p>
        <blockquote>${data.message}</blockquote>
        <p>Saludos cordiales,<br>Bonderud Law Firm</p>
      `
    }
  },
  reviewApproved: {
    subject: {
      en: 'Your review has been published',
      es: 'Su reseña ha sido publicada'
    },
    html: {
      en: (data) => `
        <h2>Thank you for your review!</h2>
        <p>Dear ${data.name},</p>
        <p>Your review has been approved and is now visible on our website.</p>
        <p>We appreciate your feedback!</p>
        <a href="${env.FRONTEND_URL}/reviews">View Your Review</a>
      `,
      es: (data) => `
        <h2>¡Gracias por su reseña!</h2>
        <p>Estimado/a ${data.name},</p>
        <p>Su reseña ha sido aprobada y ahora es visible en nuestro sitio web.</p>
        <p>¡Apreciamos sus comentarios!</p>
        <a href="${env.FRONTEND_URL}/reviews">Ver Su Reseña</a>
      `
    }
  }
};

// Create transporter
const createTransporter = () => {
  if (env.NODE_ENV === 'development') {
    // Use Ethereal for development
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  // Production transporter
  return nodemailer.createTransporter({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
};

// Send email function
export const sendEmail = async ({
  to,
  template,
  data,
  language = 'en',
  attachments = []
}) => {
  try {
    const transporter = createTransporter();
    const emailTemplate = emailTemplates[template];

    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    const mailOptions = {
      from: `Bonderud Law Firm <${env.SMTP_FROM || 'noreply@bonderudlaw.com'}>`,
      to,
      subject: emailTemplate.subject[language],
      html: emailTemplate.html[language](data),
      attachments
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info('Email sent', {
      to,
      template,
      messageId: info.messageId
    });

    // Get preview URL in development
    if (env.NODE_ENV === 'development') {
      logger.info('Preview URL', {
        url: nodemailer.getTestMessageUrl(info)
      });
    }

    return info;
  } catch (error) {
    logger.error('Email sending failed', {
      error: error.message,
      to,
      template
    });
    throw error;
  }
};

// Batch email sender
export const sendBatchEmails = async (recipients, template, language = 'en') => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendEmail({
        to: recipient.email,
        template,
        data: recipient.data,
        language
      });
      results.push({ success: true, email: recipient.email, messageId: result.messageId });
    } catch (error) {
      results.push({ success: false, email: recipient.email, error: error.message });
    }
  }

  return results;
};

// Email queue (for future implementation with Bull/Redis)
export const queueEmail = async (emailData) => 
  // For now, send immediately
   sendEmail(emailData)
  
  // Future: Add to queue
  // await emailQueue.add('send-email', emailData);
;