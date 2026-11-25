
import checkoutService from "../services/checkout.service.js";

// Buy Now checkout.
const checkoutNow = async (req, res, next) => {
  try {
    const result = await checkoutService.checkoutNow({
      userId: req.auth.userId,
      items: req.body.items,
      paymentPassword: req.body.paymentPassword,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        paymentStatus: result.paymentStatus,
        paymentReference: result.paymentReference,
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Cart checkout.
const checkoutCart = async (req, res, next) => {
  try {
    const result = await checkoutService.checkoutCart({
      userId: req.auth.userId,
      cartItemIds: req.body.cartItemIds,
      paymentPassword: req.body.paymentPassword,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        paymentStatus: result.paymentStatus,
        paymentReference: result.paymentReference,
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  checkoutNow,
  checkoutCart,
};
