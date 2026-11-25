
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Authentication middleware must run first.
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get roles from the verified JWT.
    const userRoles = req.auth.roles || [];

    // Check whether the user has at least one allowed role.
    const hasPermission = allowedRoles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
};

export default authorize;
