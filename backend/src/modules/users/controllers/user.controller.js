
import userService from "../services/user.service.js";

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await userService.registerUser({
      name,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
const getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(
      req.auth.userId
    );

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
export default {
  register,getMe
};
