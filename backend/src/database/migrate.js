
import { Umzug, SequelizeStorage } from "umzug";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sequelize from "../config/database.js";

const currentDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);

const migrationGlob = path.resolve(
  currentDirectory,
  "../modules/*/migrations/*.js"
);

const migrator = new Umzug({
  migrations: {
    glob: migrationGlob,
  },

  context: sequelize.getQueryInterface(),

  storage: new SequelizeStorage({
    sequelize,
    tableName: "sequelize_meta",
  }),

  logger: console,
});

const runMigrations = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database connected.");

    const migrations = await migrator.up();

    if (migrations.length === 0) {
      console.log("Database is already up to date.");
    } else {
      console.log(
        "Migrations completed:",
        migrations.map((migration) => migration.name)
      );
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

runMigrations();
