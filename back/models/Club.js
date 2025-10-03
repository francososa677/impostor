import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Club = sequelize.define(
  "Club",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "Clubs",
    timestamps: false,
  }
);

export default Club;
