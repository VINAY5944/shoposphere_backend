
import sequelize from "../config/database.js";
import seedAdmin from "../modules/users/seeders/002-seed-admin.js";

const createAdmin = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database connected.");

    await seedAdmin();

  } catch (error) {
    console.error("Admin seeding failed:", error);
    process.exitCode = 1;

  } finally {
    await sequelize.close();
  }
};

createAdmin();
