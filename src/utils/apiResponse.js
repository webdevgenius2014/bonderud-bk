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

// Helper function to send API responses
export const apiResponse = {
  success: (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      data,
      message
    });
  },

  error: (res, message, statusCode = 500, errorCode = null, errors = null) => {
    const response = {
      success: false,
      error: {
        message,
        statusCode
      }
    };

    if (errorCode) {
      response.error.code = errorCode;
    }

    if (errors) {
      response.error.details = errors;
    }

    res.status(statusCode).json(response);
  },

  created: (res, data, message = 'Resource created successfully') => {
    res.status(201).json({
      success: true,
      data,
      message
    });
  },

  updated: (res, data, message = 'Resource updated successfully') => {
    res.status(200).json({
      success: true,
      data,
      message
    });
  },

  deleted: (res, message = 'Resource deleted successfully') => {
    res.status(200).json({
      success: true,
      data: null,
      message
    });
  },

  notFound: (res, message = 'Resource not found') => {
    res.status(404).json({
      success: false,
      error: {
        message,
        statusCode: 404,
        code: 'NOT_FOUND'
      }
    });
  },

  unauthorized: (res, message = 'Unauthorized access') => {
    res.status(401).json({
      success: false,
      error: {
        message,
        statusCode: 401,
        code: 'UNAUTHORIZED'
      }
    });
  },

  forbidden: (res, message = 'Access forbidden') => {
    res.status(403).json({
      success: false,
      error: {
        message,
        statusCode: 403,
        code: 'FORBIDDEN'
      }
    });
  },

  badRequest: (res, message = 'Bad request', errors = null) => {
    const response = {
      success: false,
      error: {
        message,
        statusCode: 400,
        code: 'BAD_REQUEST'
      }
    };

    if (errors) {
      response.error.details = errors;
    }

    res.status(400).json(response);
  }
};