import { getRabbitChannel, isRabbitReady } from '../config/rabbitmq';
import { EXCHANGE, ROUTING_KEYS } from './notification.types';
import logger from '../config/logger';

export interface EmailVerificationEvent {
  event:     'auth.email.verification';
  userId:    string;
  email:     string;
  verifyUrl: string;
  name:      string;
}

export interface OtpSendEvent {
  event:  'auth.otp.send';
  userId: string | null; 
  email:  string;
  otp:    string;
}

export interface PasswordResetEvent {
  event:    'auth.password.reset';
  userId:   string;
  email:    string;
  resetUrl: string;
}

export interface LoginEvent {
  event:   'auth.session.login';
  userId:  string;
  email:   string;
  ip:      string;
  device:  string;
}

export interface AccountLockedEvent {
  event:   'auth.account.locked';
  email:   string;
  minutes: number;
}

export interface PasswordChangedEvent {
  event:  'auth.password.changed';
  userId: string;
  email:  string;
}

export type AuthEvent =
  | EmailVerificationEvent
  | OtpSendEvent
  | PasswordResetEvent
  | LoginEvent
  | AccountLockedEvent
  | PasswordChangedEvent;

function publishAuthEvent(routingKey: string, payload: AuthEvent): void {
  if (!isRabbitReady()) {
    logger.warn(`RabbitMQ unavailable — auth event not queued: ${routingKey}`);
    return;
  }

  getRabbitChannel().publish(
    EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true, contentType: 'application/json', timestamp: Date.now() }
  );

  logger.info(`Auth event published: ${routingKey}`);
}

export const AuthEventPublisher = {
  emailVerification(data: Omit<EmailVerificationEvent, 'event'>): void {
    publishAuthEvent(ROUTING_KEYS.AUTH_EMAIL_VERIFY, { event: 'auth.email.verification', ...data });
  },

  otpSend(data: Omit<OtpSendEvent, 'event'>): void {
    publishAuthEvent(ROUTING_KEYS.AUTH_OTP_SEND, { event: 'auth.otp.send', ...data });
  },

  passwordReset(data: Omit<PasswordResetEvent, 'event'>): void {
    publishAuthEvent(ROUTING_KEYS.AUTH_PASSWORD_RESET, { event: 'auth.password.reset', ...data });
  },

  login(data: Omit<LoginEvent, 'event'>): void {
    publishAuthEvent(ROUTING_KEYS.AUTH_LOGIN, { event: 'auth.session.login', ...data });
  },

  accountLocked(data: Omit<AccountLockedEvent, 'event'>): void {
    publishAuthEvent(ROUTING_KEYS.AUTH_ACCOUNT_LOCKED, { event: 'auth.account.locked', ...data });
  },

  passwordChanged(data: Omit<PasswordChangedEvent, 'event'>): void {
    publishAuthEvent('auth.password.changed', { event: 'auth.password.changed', ...data });
  },
};
