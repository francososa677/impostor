import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./impostor.db",
  logging: false,
});

export default sequelize;
