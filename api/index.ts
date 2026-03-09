import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();

app.use(
  express.json({
    verify: (req: any, _res: any, buf: any) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);

const initPromise = (async () => {
  await registerRoutes(httpServer, app);
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });
})();

export default async function handler(req: any, res: any) {
  await initPromise;
  app(req, res);
}
