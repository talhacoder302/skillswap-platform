exports.success = (res, data = null, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

exports.created = (res, data = null, message = "Created Successfully") => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

exports.validationError = (res, message = "Validation Error") => {
  return res.status(400).json({
    success: false,
    message,
  });
};

exports.unauthorized = (res, message = "Unauthorized") => {
  return res.status(401).json({
    success: false,
    message,
  });
};

exports.notFound = (res, message = "Not Found") => {
  return res.status(404).json({
    success: false,
    message,
  });
};

exports.error = (res, error) => {
  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};
