
import authService from "../services/auth.service.js";

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser({
      email,
      password,
      expectedRole: "ADMIN",
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser({
      email,
      password,
      expectedRole: "CUSTOMER",
    });

    return res.status(200).json({
      success: true,
      message: "User login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  adminLogin,
  userLogin,
};
