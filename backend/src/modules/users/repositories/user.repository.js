
import { Op } from "sequelize";

import User from "../models/User.js";
import Role from "../models/Role.js";
import UserRole from "../models/UserRole.js";
import Permission from "../models/Permission.js";

// Register Sequelize associations before running relationship queries.
import "../models/associations.js";

const findByEmail = async (email, transaction = null) => {
  return User.findOne({
    where: { email },
    transaction,
  });
};

const createUser = async (userData, transaction) => {
  return User.create(userData, { transaction });
};

const findRoleByName = async (roleName, transaction = null) => {
  return Role.findOne({
    where: { name: roleName },
    transaction,
  });
};

const assignRole = async (userId, roleId, transaction) => {
  return UserRole.create(
    { userId, roleId },
    { transaction }
  );
};

const findById = async (userId) => {
  return User.findByPk(userId);
};

// Shared include structure for roles and their permissions.
const roleInclude = {
  model: Role,
  as: "roles",
  attributes: ["id", "name"],
  through: {
    attributes: [],
  },
  include: [
    {
      model: Permission,
      as: "permissions",
      attributes: ["id", "name"],
      through: {
        attributes: [],
      },
    },
  ],
};

const findByEmailWithRoles = async (email) => {
  return User.findOne({
    where: { email },
    attributes: ["id", "name", "email", "passwordHash", "isActive"],
    include: [roleInclude],
  });
};

const findByIdWithRolesAndPermissions = async (userId) => {
  return User.findByPk(userId, {
    attributes: ["id", "name", "email", "isActive"],
    include: [roleInclude],
  });
};

const findCustomersForAdmin = async ({
  limit,
  cursor,
  search,
  isActive,
}) => {
  const conditions = [];

  if (search) {
    conditions.push({
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ],
    });
  }

  if (isActive !== undefined) {
    conditions.push({ isActive });
  }

  if (cursor) {
    conditions.push({
      [Op.or]: [
        { createdAt: { [Op.lt]: cursor.createdAt } },
        {
          createdAt: cursor.createdAt,
          id: { [Op.lt]: cursor.id },
        },
      ],
    });
  }

  return User.findAll({
    where: conditions.length ? { [Op.and]: conditions } : {},
    attributes: [
      "id",
      "name",
      "email",
      "isActive",
      "emailVerifiedAt",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: Role,
        as: "roles",
        attributes: ["name"],
        through: { attributes: [] },
        where: { name: "CUSTOMER" },
        required: true,
      },
    ],
    order: [["createdAt", "DESC"], ["id", "DESC"]],
    limit: limit + 1,
  });
};

const findCustomerByIdForAdmin = async (customerId) => {
  return User.findByPk(customerId, {
    attributes: [
      "id",
      "name",
      "email",
      "isActive",
      "emailVerifiedAt",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: Role,
        as: "roles",
        attributes: ["name"],
        through: { attributes: [] },
      },
    ],
  });
};

const updateCustomerStatus = async (customer, isActive) => {
  return customer.update({ isActive });
};

export default {
  findByEmail,
  createUser,
  findRoleByName,
  assignRole,
  findById,
  findByEmailWithRoles,
  findByIdWithRolesAndPermissions,
  findCustomersForAdmin,
  findCustomerByIdForAdmin,
  updateCustomerStatus,
};
