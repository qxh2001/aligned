// This file is overwritten during build by the vercel-build script.
// It is committed as a placeholder so Vercel validates the functions config.
export default function handler(_req, res) {
  res.status(503).json({ message: "Build in progress" });
}
