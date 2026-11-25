
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import userRepository from "../../users/repositories/user.repository.js";

const getUserRolesAndPermissions = (user) => {
  const roles = user.roles.map((role) => role.name);

  // Collect permissions from every role and remove duplicates.
  const permissions = [
    ...new Set(
      user.roles.flatMap((role) =>
        role.permissions.map((permission) => permission.name)
      )
    ),
  ];

  return { roles, permissions };
};

const loginUser = async ({ email, password, expectedRole }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await userRepository.findByEmailWithRoles(
    normalizedEmail
  );

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Your account is inactive");
    error.statusCode = 403;
    throw error;
  }

  const { roles, permissions } =
    getUserRolesAndPermissions(user);

  if (!roles.includes(expectedRole)) {
    const error = new Error(
      "You are not authorized to use this login"
    );
    error.statusCode = 403;
    throw error;
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const accessToken = jwt.sign(
    {
      sub: user.id,
      roles,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
      issuer: "shopsphere-api",
      audience: "shopsphere-client",
    }
  );

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles,
      permissions,
    },
  };
};

export default {
  loginUser,
};
