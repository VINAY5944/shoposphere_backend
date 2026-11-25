import { DataTypes } from "sequelize";
export const up = async ({ context: queryInterface }) => {
  await queryInterface.createTable("permissions", {
    id: {
      type:    DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal("NOW()"),
    },

    updated_at: {
      type:    DataTypes.DATE,  
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal("NOW()"),
    },
  });
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("permissions");
};
