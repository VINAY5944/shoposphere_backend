
import bcrypt from "bcryptjs";
import sequelize from "../../../config/database.js";
import userRepository from "../repositories/user.repository.js";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 12);

const registerUser = async ({ name, email, password }) => {
  // 1. Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // 2. Check duplicate email
  const existingUser = await userRepository.findByEmail(normalizedEmail);

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 4. Start transaction
  const transaction = await sequelize.transaction();

  try {
    // 5. Create user
    const user = await userRepository.createUser(
      {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
      transaction
    );

    // 6. Find CUSTOMER role
    const customerRole = await userRepository.findRoleByName(
      "CUSTOMER",
      transaction
    );

    if (!customerRole) {
      throw new Error("CUSTOMER role not found");
    }

    // 7. Assign CUSTOMER role
    await userRepository.assignRole(
      user.id,
      customerRole.id,
      transaction
    );

    // 8. Commit transaction
    await transaction.commit();

    // Never return passwordHash to the controller
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getUserProfile = async (userId) => {
  const user =
    await userRepository.findByIdWithRolesAndPermissions(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const roles = user.roles.map((role) => role.name);

  const permissions = [
    ...new Set(
      user.roles.flatMap((role) =>
        role.permissions.map((permission) => permission.name)
      )
    ),
  ];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    roles,
    permissions,
  };
};

export default {
  registerUser,getUserProfile
};
