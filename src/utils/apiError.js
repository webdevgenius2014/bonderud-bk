export class ApiError extends Error {
  constructor(
    statusCode,
    message,
    isOperational = true,
    errors,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Bad request', errors) {
    return new ApiError(400, message, true, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  static unprocessableEntity(message = 'Unprocessable entity', errors) {
    return new ApiError(422, message, true, errors);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message);
  }

  static internalServer(message = 'Internal server error') {
    return new ApiError(500, message);
  }

  static serviceUnavailable(message = 'Service unavailable') {
    return new ApiError(503, message);
  }
}