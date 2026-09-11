import amqplib from 'amqplib';
import env from './env';
import logger from './logger';

type AmqpConnection = Awaited<ReturnType<typeof amqplib.connect>>;
type AmqpChannel   = Awaited<ReturnType<AmqpConnection['createChannel']>>;

let connection: AmqpConnection | null = null;
let channel: AmqpChannel | null = null;
let reconnectTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY_MS = 30_000;

async function connect(): Promise<void> {
  try {
    connection = await amqplib.connect(env.rabbitmq.url);
    channel    = await connection.createChannel();
    reconnectAttempts = 0;

    logger.info('RabbitMQ connected');

    connection.on('error', (err: Error) => {
      logger.error(`RabbitMQ connection error: ${err.message}`);
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed — scheduling reconnect');
      channel    = null;
      connection = null;
      scheduleReconnect();
    });
  } catch (err) {
    logger.error(`RabbitMQ connect failed: ${(err as Error).message}`);
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectAttempts += 1;
  const delay = Math.min(1000 * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY_MS);
  logger.warn(`RabbitMQ reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
  reconnectTimer = globalThis.setTimeout(async () => {
    reconnectTimer = null;
    await connect();
  }, delay);
}

export async function connectRabbitMQ(): Promise<void> {
  await connect();
}

export function getRabbitChannel(): AmqpChannel {
  if (!channel) throw new Error('RabbitMQ channel not available');
  return channel;
}

export function isRabbitReady(): boolean {
  return channel !== null && connection !== null;
}

export async function closeRabbitMQ(): Promise<void> {
  if (reconnectTimer) {
    globalThis.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  try {
    await channel?.close();
    await connection?.close();
  } catch {
  }
  channel    = null;
  connection = null;
}
