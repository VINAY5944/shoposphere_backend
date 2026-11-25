
import productService from "../services/product.service.js";

const getAbsoluteImageUrl = (imageUrl, req) => {
  if (!imageUrl) return null;

  const apiOrigin =
    process.env.API_PUBLIC_URL ||
    `${req.protocol}://${req.get("host")}`;

  return new URL(imageUrl, apiOrigin).toString();
};

// CREATE PRODUCT - ADMIN ONLY.
const create = async (req, res) => {
  const product = await productService.createProduct({
    ...req.body,
    imageFile: req.file,
  });

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
};

// UPDATE PRODUCT - ADMIN ONLY.
const update = async (req, res) => {
  const { productId } = req.params;

  const product = await productService.updateProduct(
    productId,
    req.body,
    req.file
  );

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
};

// DELETE PRODUCT - ADMIN ONLY.
const remove = async (req, res) => {
  const { productId } = req.params;

  const result = await productService.deleteProduct(productId);

  return res.status(200).json({
    success: true,
    ...result,
  });
};

// GET ONE PRODUCT - ADMIN AND CUSTOMER.
const getOne = async (req, res) => {
  const { productId } = req.params;

  const product = await productService.getProductDetailsById(productId);

  return res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    data: {
      ...product,
      imageUrl: getAbsoluteImageUrl(product.imageUrl, req),
    },
  });
};

// GET ALL PRODUCTS - ADMIN AND CUSTOMER.
const list = async (req, res) => {
  const result = await productService.listProducts(req.query);

  return res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    ...result,
  });
};

export default {
  create,
  update,
  remove,
  getOne,
  list,
};
