
import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
  // 1. Get Authorization header
  const authHeader = req.headers.authorization;

  // 2. Check whether token exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  // 3. Extract token
  const token = authHeader.split(" ")[1];

  try {
    // 4. Verify JWT signature, expiry, issuer and audience
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        issuer: "shopsphere-api",
        audience: "shopsphere-client",
      }
    );

    // 5. Attach authenticated user information
    req.auth = {
      userId: decoded.sub,
      roles: decoded.roles || [],
    };

    // 6. Continue to controller
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

export default authenticate;
