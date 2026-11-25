import adminService from "../services/admin.service.js";

const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await adminService.getDashboard();

    return res.status(200).json({
      success: true,
      message: "Admin dashboard fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

const listCustomers = async (req, res, next) => {
  try {
    const customers = await adminService.listCustomers(req.query);

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      ...customers,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const customer = await adminService.getCustomerForAdmin(
      req.params.customerId
    );

    return res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomerStatus = async (req, res, next) => {
  try {
    const customer = await adminService.updateCustomerStatus(
      req.params.customerId,
      req.body.isActive
    );

    return res.status(200).json({
      success: true,
      message: "Customer status updated successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboard,
  listCustomers,
  getCustomer,
  updateCustomerStatus,
};