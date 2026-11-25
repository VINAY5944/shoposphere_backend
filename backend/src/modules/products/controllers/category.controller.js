
import categoryService from "../services/category.service.js";

// CREATE CATEGORY
const create = async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  return res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
};
const list = async (req, res) => {
  const result = await categoryService.listCategories(req.query);

  return res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    ...result,
  });
};

// GET CATEGORY BY ID
const getOne = async (req, res) => {
  const category = await categoryService.getCategoryById(
    req.params.categoryId
  );

  return res.status(200).json({
    success: true,
    message: "Category fetched successfully",
    data: category,
  });
};

// UPDATE CATEGORY
const update = async (req, res) => {
  const { categoryId } = req.params;

  const category = await categoryService.updateCategory(
    categoryId,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
};

export default {
  create,
  list,
  getOne,
  update,
};
