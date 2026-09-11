import { ConsumeMessage } from 'amqplib';
import { getRabbitChannel, isRabbitReady } from '../config/rabbitmq';
import { setupRabbitMQTopology } from './rabbitmq.adapter';
import notificationService from './notification.service';
import { handleAuthEvent } from './auth.notification.handler';
import type { AuthEvent } from './auth.event.publisher';
import { AnyNotificationPayload, QUEUES, QueueName } from './notification.types';
import logger from '../config/logger';

const PREFETCH = 10;

async function handleAuthMessage(msg: ConsumeMessage | null): Promise<void> {
  if (!msg) return;
  const channel = getRabbitChannel();

  try {
    const payload = JSON.parse(msg.content.toString()) as AuthEvent;
    logger.info(`RabbitMQ consume: ${QUEUES.AUTH} event=${payload.event}`);
    await handleAuthEvent(payload);
    channel.ack(msg);
  } catch (err) {
    logger.error(`Auth queue handler error: ${(err as Error).message}`);
    channel.nack(msg, false, false);
  }
}

async function handleNotificationMessage(msg: ConsumeMessage | null): Promise<void> {
  if (!msg) return;
  const channel = getRabbitChannel();

  try {
    const payload = JSON.parse(msg.content.toString()) as AnyNotificationPayload;
    logger.info(`RabbitMQ consume: ${QUEUES.NOTIFICATION} type=${payload.type} userId=${payload.userId}`);
    await notificationService.dispatch(payload);
    channel.ack(msg);
  } catch (err) {
    logger.error(`Notification queue handler error: ${(err as Error).message}`);
    channel.nack(msg, false, false);
  }
}

async function handleDomainMessage(msg: ConsumeMessage | null, queue: QueueName): Promise<void> {
  if (!msg) return;
  const channel = getRabbitChannel();

  try {
    const payload = JSON.parse(msg.content.toString());
    logger.info(`RabbitMQ consume: ${queue} routing=${msg.fields.routingKey}`);

    channel.ack(msg);
  } catch (err) {
    logger.error(`Domain queue handler error on ${queue}: ${(err as Error).message}`);
    channel.nack(msg, false, false);
  }
}

export async function startRabbitMQListener(): Promise<void> {
  if (!isRabbitReady()) {
    logger.warn('RabbitMQ not ready — listener not started');
    return;
  }

  const channel = getRabbitChannel();

  await setupRabbitMQTopology(channel);
  await channel.prefetch(PREFETCH);

  await channel.consume(QUEUES.AUTH, handleAuthMessage, { noAck: false });
  logger.info(`RabbitMQ consumer started: ${QUEUES.AUTH}`);

  await channel.consume(QUEUES.NOTIFICATION, handleNotificationMessage, { noAck: false });
  logger.info(`RabbitMQ consumer started: ${QUEUES.NOTIFICATION}`);

  const domainQueues: QueueName[] = [
    QUEUES.PARENT,
    QUEUES.SCHOOL,
    QUEUES.LOAN,
    QUEUES.PAYMENT,
    QUEUES.DISBURSEMENT,
    QUEUES.ADMIN,
  ];

  for (const queue of domainQueues) {
    await channel.consume(queue, (msg) => handleDomainMessage(msg, queue), { noAck: false });
    logger.info(`RabbitMQ consumer started: ${queue}`);
  }

  logger.info('RabbitMQ listener ready — all queues consuming');
}
