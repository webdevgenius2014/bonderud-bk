export class ApiResponse {
  constructor(
    statusCode,
    data = null,
    message = 'Success',
    success = true
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = success;
  }

  static success(data, message = 'Success', statusCode = 200) {
    return new ApiResponse(statusCode, data, message, true);
  }

  static error(message, statusCode = 500, data = null) {
    return new ApiResponse(statusCode, data, message, false);
  }

  static created(data, message = 'Resource created successfully') {
    return new ApiResponse(201, data, message, true);
  }

  static updated(data, message = 'Resource updated successfully') {
    return new ApiResponse(200, data, message, true);
  }

  static deleted(message = 'Resource deleted successfully') {
    return new ApiResponse(200, null, message, true);
  }

  static notFound(message = 'Resource not found') {
    return new ApiResponse(404, null, message, false);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiResponse(401, null, message, false);
  }

  static forbidden(message = 'Access forbidden') {
    return new ApiResponse(403, null, message, false);
  }

  static badRequest(message = 'Bad request', errors = null) {
    return new ApiResponse(400, errors, message, false);
  }

  static conflict(message = 'Resource conflict') {
    return new ApiResponse(409, null, message, false);
  }
}