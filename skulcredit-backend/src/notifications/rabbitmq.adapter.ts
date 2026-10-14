import { EXCHANGE, QUEUES } from './notification.types';
import logger from '../config/logger';

type AmqpChannel = Awaited<ReturnType<Awaited<ReturnType<typeof import('amqplib').connect>>['createChannel']>>;

const DLX = `${EXCHANGE}.dlx`;

const QUEUE_BINDINGS: Array<{ queue: string; patterns: string[] }> = [
  {
    queue:    QUEUES.AUTH,
    patterns: ['auth.#'],
  },
  {
    queue:    QUEUES.PARENT,
    patterns: ['parent.#'],
  },
  {
    queue:    QUEUES.SCHOOL,
    patterns: ['school.#'],
  },
  {
    queue:    QUEUES.LOAN,
    patterns: ['loan.#'],
  },
  {
    queue:    QUEUES.PAYMENT,
    patterns: ['payment.#'],
  },
  {
    queue:    QUEUES.DISBURSEMENT,
    patterns: ['disbursement.#'],
  },
  {
    queue:    QUEUES.ADMIN,
    patterns: ['admin.#'],
  },
  {
    queue:    QUEUES.NOTIFICATION,
    patterns: [
      'loan.application.*',
      'loan.offer.*',
      'payment.repayment.*',
      'disbursement.transfer.*',
      'school.verification.*',
      'auth.account.*',
      'notification.#',
    ],
  },
];

export async function setupRabbitMQTopology(channel: AmqpChannel): Promise<void> {
  await channel.assertExchange(DLX, 'fanout', { durable: true });
  await channel.assertQueue(`${EXCHANGE}.dead_letter`, {
    durable: true,
    arguments: { 'x-message-ttl': 7 * 24 * 60 * 60 * 1000 },
  });
  await channel.bindQueue(`${EXCHANGE}.dead_letter`, DLX, '');
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  for (const { queue, patterns } of QUEUE_BINDINGS) {
    await channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': DLX,
        'x-message-ttl':          3 * 24 * 60 * 60 * 1000, 
      },
    });

    for (const pattern of patterns) {
      await channel.bindQueue(queue, EXCHANGE, pattern);
      logger.info(`RabbitMQ bind: ${queue} ← [${pattern}]`);
    }
  }

  logger.info(`RabbitMQ topology ready — exchange: ${EXCHANGE}, queues: ${Object.values(QUEUES).join(', ')}`);
}
