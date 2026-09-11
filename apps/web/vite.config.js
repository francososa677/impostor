import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@impostor/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
        },
    },
    server: {
        port: 5173,
        host: "0.0.0.0",
        proxy: {
            "/api": {
                target: "http://127.0.0.1:3001",
                changeOrigin: true,
            },
            "/health": {
                target: "http://127.0.0.1:3001",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://127.0.0.1:3001",
                ws: true,
            },
        },
    },
});
//# sourceMappingURL=vite.config.js.map