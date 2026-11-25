const createApiError = (statusCode, message, errors = []) => {
  const error = new Error(message);

  error.name = "ApiError";
  error.statusCode = statusCode;
  error.errors = errors;
  error.isOperational = true;

  return error;
};

export default createApiError;