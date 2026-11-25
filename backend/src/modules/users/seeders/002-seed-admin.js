
import bcrypt from "bcryptjs";

import sequelize from "../../../config/database.js";

import User from "../models/User.js";
import Role from "../models/Role.js";
import UserRole from "../models/UserRole.js";

const seedAdmin = async () => {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  // Validate environment variables.
  if (!name || !email || !password) {
    throw new Error("Admin environment variables are missing");
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Admin password cannot exceed 72 bytes");
  }

  const transaction = await sequelize.transaction();

  try {
    // 1. Find ADMIN role.
    const adminRole = await Role.findOne({
      where: { name: "ADMIN" },
      transaction,
    });

    if (!adminRole) {
      throw new Error("ADMIN role not found. Run db:seed first.");
    }

    // 2. Check whether admin account already exists.
    let admin = await User.findOne({
      where: { email },
      transaction,
    });

    if (admin) {
      // Never automatically promote an existing customer.
      const existingAssignment = await UserRole.findOne({
        where: {
          userId: admin.id,
          roleId: adminRole.id,
        },
        transaction,
      });

      if (!existingAssignment) {
        throw new Error(
          "This email already belongs to a non-admin account. Use a different email."
        );
      }

      console.log("Admin account already exists. No changes made.");

      await transaction.commit();
      return;
    }

    // 3. Hash password.
    const passwordHash = await bcrypt.hash(
      password,
      Number(process.env.SALT_ROUNDS || 12)
    );

    // 4. Create admin user.
    admin = await User.create(
      {
        name,
        email,
        passwordHash,
      },
      { transaction }
    );

    // 5. Assign ADMIN role.
    await UserRole.create(
      {
        userId: admin.id,
        roleId: adminRole.id,
      },
      { transaction }
    );

    await transaction.commit();

    console.log("Admin account created successfully.");
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export default seedAdmin;
