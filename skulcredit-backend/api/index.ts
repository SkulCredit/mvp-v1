import type { IncomingMessage, ServerResponse } from "http";
import app from "../src/app";
import { connectDB } from "../src/config/db";
import "../src/models/index";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection error in Vercel handler:", err);
  }
  return app(req, res);
}
