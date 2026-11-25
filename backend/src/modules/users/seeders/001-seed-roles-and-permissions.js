
import sequelize from "../../../config/database.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
import RolePermission from "../models/RolePermission.js";

const rolesData = [
  {
    name: "ADMIN",
    description: "Full administrative access",
  },
  {
    name: "CUSTOMER",
    description: "Standard customer access",
  },
  {
    name: "INVENTORY_MANAGER",
    description: "Manages products and inventory",
  },
  {
    name: "SUPPORT_AGENT",
    description: "Handles customer support and orders",
  },
];

const permissionsData = [
  // Products
  ["PRODUCT_VIEW", "View products"],
  ["PRODUCT_CREATE", "Create products"],
  ["PRODUCT_UPDATE", "Update products"],
  ["PRODUCT_DELETE", "Delete products"],

  // Categories
  ["CATEGORY_VIEW", "View categories"],
  ["CATEGORY_CREATE", "Create categories"],
  ["CATEGORY_UPDATE", "Update categories"],
  ["CATEGORY_DELETE", "Delete categories"],

  // Inventory
  ["INVENTORY_VIEW", "View inventory"],
  ["INVENTORY_UPDATE", "Update stock"],

  // Orders
  ["ORDER_VIEW_ALL", "View all customer orders"],
  ["ORDER_VIEW_OWN", "View own orders"],
  ["ORDER_UPDATE", "Update order status"],
  ["ORDER_CANCEL_OWN", "Cancel own orders"],

  // Users
  ["USER_VIEW", "View customer accounts"],
  ["USER_UPDATE", "Update customer accounts"],
  ["USER_DELETE", "Delete customer accounts"],

  // Cart
  ["CART_VIEW_OWN", "View own cart"],
  ["CART_UPDATE_OWN", "Update own cart"],
];

const rolePermissionMap = {
  ADMIN: permissionsData.map(([name]) => name),

  CUSTOMER: [
    "PRODUCT_VIEW",
    "CATEGORY_VIEW",
    "ORDER_VIEW_OWN",
    "ORDER_CANCEL_OWN",
    "CART_VIEW_OWN",
    "CART_UPDATE_OWN",
  ],

  INVENTORY_MANAGER: [
    "PRODUCT_VIEW",
    "PRODUCT_CREATE",
    "PRODUCT_UPDATE",
    "CATEGORY_VIEW",
    "INVENTORY_VIEW",
    "INVENTORY_UPDATE",
  ],

  SUPPORT_AGENT: [
    "PRODUCT_VIEW",
    "CATEGORY_VIEW",
    "ORDER_VIEW_ALL",
    "ORDER_UPDATE",
    "USER_VIEW",
    "USER_UPDATE",
  ],
};

const seedRolesAndPermissions = async () => {
  const transaction = await sequelize.transaction();

  try {
    // 1. Create roles
    const roles = {};

    for (const roleData of rolesData) {
      const [role] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData,
        transaction,
      });

      roles[role.name] = role;
    }

    // 2. Create permissions
    const permissions = {};

    for (const [name, description] of permissionsData) {
      const [permission] = await Permission.findOrCreate({
        where: { name },
        defaults: { name, description },
        transaction,
      });

      permissions[permission.name] = permission;
    }

    // 3. Assign permissions to roles
    for (const [roleName, permissionNames] of Object.entries(
      rolePermissionMap
    )) {
      const role = roles[roleName];

      for (const permissionName of permissionNames) {
        const permission = permissions[permissionName];

        await RolePermission.findOrCreate({
          where: {
            roleId: role.id,
            permissionId: permission.id,
          },
          defaults: {
            roleId: role.id,
            permissionId: permission.id,
          },
          transaction,
        });
      }
    }

    await transaction.commit();

    console.log("Roles and permissions seeded successfully!");
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export default seedRolesAndPermissions;
