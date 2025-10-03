import express from "express";
import cors from "cors";
import roomRoutes from "./routes/roomRoutes.js";
import sequelize from "./config/db.js";

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 🚀 Función para iniciar servidor y sincronizar DB
const startServer = async () => {
  try {
    // Conectar y autenticar DB
    await sequelize.authenticate();
    console.log("✅ Conexión a la DB exitosa");

    // Sincronizar modelos (crea o actualiza tablas)
    await sequelize.sync({ alter: true });
    console.log("✅ Tablas creadas o actualizadas");

    // Levantar servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Error conectando o sincronizando DB:", err);
  }
};

// Iniciar
startServer();

// Rutas
app.use("/rooms", roomRoutes);
