import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();

// Trust Vercel's reverse proxy so req.secure === true (needed for Secure cookies)
app.set("trust proxy", 1);

app.use(
  express.json({
    verify: (req: any, _res: any, buf: any) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);

let initError: any = null;

const initPromise = (async () => {
  await registerRoutes(httpServer, app);
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });
})().catch((err) => {
  initError = err;
  console.error("Initialization failed:", err?.message, err?.stack);
});

export default async function handler(req: any, res: any) {
  await initPromise;
  if (initError) {
    res.status(500).json({ message: initError.message || "Initialization failed" });
    return;
  }
  app(req, res);
}
