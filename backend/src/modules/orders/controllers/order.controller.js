import orderService from "../services/order.service.js";

const listMine = async (req, res) => {
  const orders = await orderService.listOrdersForUser(
    req.auth.userId,
    req.query
  );

  return res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    ...orders,
  });
};

const getMine = async (req, res) => {
  const order = await orderService.getOrderForUser(
    req.params.orderId,
    req.auth.userId
  );

  return res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: order,
  });
};

export default {
  listMine,
  getMine,
};
