import orderService from "../services/order.service.js";

const list = async (req, res, next) => {
  try {
    const orders = await orderService.listOrdersForAdmin(req.query);

    return res.status(200).json({
      success: true,
      message: "Admin orders fetched successfully",
      ...orders,
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const order = await orderService.getOrderForAdmin(
      req.params.orderId
    );

    return res.status(200).json({
      success: true,
      message: "Admin order fetched successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  list,
  getOne,
};
