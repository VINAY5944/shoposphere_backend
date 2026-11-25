
import sequelize from "../config/database.js";
import seedRolesAndPermissions from "../modules/users/seeders/001-seed-roles-and-permissions.js";

const runSeeders = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database connected.");

    await seedRolesAndPermissions();

    console.log("Seeding completed.");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

runSeeders();
