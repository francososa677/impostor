import sequelize from "./config/db.js";
import Player from "./models/Player.js";
import Club from "./models/Club.js";

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexión a la DB exitosa");

    // Sincroniza modelos (crea tablas si no existen)
    await sequelize.sync({ alter: true });
    console.log("Tablas sincronizadas correctamente");
  } catch (error) {
    console.error("Error sincronizando DB:", error);
  }
};

syncDatabase();
