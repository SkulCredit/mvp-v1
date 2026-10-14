import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import env from "./env";
import logger from "./logger";

type IoSocketServer = any;
type IoSocket = any;

let io: IoSocketServer = null;

interface JwtPayload {
  id: string;
}

export function initSocketIO(httpServer: HttpServer): IoSocketServer {
  const origins =
    env.socketio.corsOrigin === "*"
      ? "*"
      : env.socketio.corsOrigin.split(",").map((o) => o.trim());

  io = new SocketServer(httpServer, {
    cors: {
      origin: origins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use((socket: IoSocket, next: (err?: Error) => void) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization ?? "").replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: IoSocket) => {
    const userId = socket.userId as string;

    socket.join(`user:${userId}`);
    logger.info(`Socket connected — userId=${userId} socketId=${socket.id}`);

    socket.on("disconnect", (reason: string) => {
      logger.info(`Socket disconnected — userId=${userId} reason=${reason}`);
    });

    socket.on("notification:read", async (notificationId: string) => {
      logger.info(
        `notification:read — userId=${userId} notificationId=${notificationId}`,
      );
      try {
        const { default: notificationService } =
          await import("../notifications/notification.service");
        await notificationService.markRead(userId, notificationId);
      } catch (err) {
        logger.warn(`notification:read failed — ${(err as Error).message}`);
      }
    });
  });

  logger.info("Socket.IO server initialised");
  return io;
}

export function getSocketIO(): IoSocketServer {
  if (!io)
    throw new Error("Socket.IO not initialised — call initSocketIO first");
  return io;
}

export function isSocketReady(): boolean {
  return io !== null;
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}
