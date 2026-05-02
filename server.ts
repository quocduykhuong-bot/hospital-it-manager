import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import bcrypt from "bcryptjs";
import { db, initializeDb } from "./db.ts";
import authRoutes from "./src/routes/authRoutes.ts";
import equipmentRoutes from "./src/routes/equipmentRoutes.ts";
import transactionRoutes from "./src/routes/transactionRoutes.ts";
import adminRoutes from "./src/routes/adminRoutes.ts";
import reportRoutes from "./src/routes/reportRoutes.ts";
import { authenticateToken, authorizeAdmin } from "./src/middleware/auth.ts";

async function startServer() {
  try {
    console.log("Initializing database...");
    await initializeDb();
    console.log("Database initialized.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
  
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Static uploads directory
  const uploadsPath = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
  }
  app.use("/uploads", express.static(uploadsPath));

  // Log all requests for debugging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // --- MVC Routes ---
  app.use("/api/auth", authRoutes);
  app.use("/api/equipment", equipmentRoutes);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/reports", reportRoutes);

  // Helper Routes
  app.post("/api/init-users", async (req, res) => {
    try {
      const adminHash = await bcrypt.hash("admin123", 10);
      const userHash = await bcrypt.hash("user123", 10);
      db.prepare("INSERT OR IGNORE INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)")
        .run("admin", adminHash, "Administrator", "Administrator System");
      db.prepare("INSERT OR IGNORE INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)")
        .run("it_staff", userHash, "User", "Nhân viên IT");
      res.json({ message: "Users initialized successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/defaults/departments", authenticateToken, (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM departments ORDER BY name").all();
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Catch-all for API 404s
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  // Global error handler for API
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("API Error:", err);
    if (req.path.startsWith("/api/")) {
      return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
    next(err);
  });

  // --- Vite setup for Frontend ---
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: process.cwd(),
    });
    app.use(vite.middlewares);
    console.log("Vite middleware integrated.");
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
