import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { config } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";

// Routes
import authRoutes from "./routes/auth.routes";
import projektRoutes from "./routes/projekt.routes";
import protokollRoutes from "./routes/protokoll.routes";
import komponenteRoutes from "./routes/komponente.routes";
import chatRoutes from "./routes/chat.routes";
import checklisteRoutes from "./routes/checkliste.routes";
import aufgabeRoutes from "./routes/aufgabe.routes";
import userRoutes from "./routes/user.routes";
import webhookRoutes from "./routes/webhook.routes";
import uploadRoutes from "./routes/upload.routes";

const app: Express = express();

// Middleware
// CORS: Unterstützt mehrere Origins (kommagetrennt oder Array)
const allowedOrigins = config.cors.origin.includes(',')
  ? config.cors.origin.split(',').map(origin => origin.trim())
  : [config.cors.origin];

app.use(cors({
  origin: (origin, callback) => {
    // Erlaube Requests ohne Origin (z.B. Postman, mobile Apps)
    if (!origin) return callback(null, true);
    
    // Prüfe ob Origin in der erlaubten Liste ist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Erlaube auch IP-Adressen mit Port 7000 (für lokale Netzwerk-Zugriffe)
      const originUrl = new URL(origin);
      const isLocalNetwork = originUrl.port === '7000' && (
        originUrl.hostname === 'localhost' ||
        originUrl.hostname === '127.0.0.1' ||
        /^192\.168\.\d+\.\d+$/.test(originUrl.hostname) || // 192.168.x.x
        /^10\.\d+\.\d+\.\d+$/.test(originUrl.hostname) ||  // 10.x.x.x
        /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(originUrl.hostname) // 172.16-31.x.x
      );
      
      if (isLocalNetwork) {
        callback(null, true);
      } else {
        callback(new Error('Nicht erlaubt durch CORS'));
      }
    }
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Dateien für Uploads servieren
app.use("/api/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projekte", projektRoutes);
app.use("/api/protokolle", protokollRoutes);
app.use("/api/komponenten", komponenteRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/checklisten", checklisteRoutes);
app.use("/api/aufgaben", aufgabeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/upload", uploadRoutes);

// Error Handling
app.use(errorMiddleware);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route nicht gefunden" });
});

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
  console.log(`📡 API verfügbar unter http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
});

export default app;

