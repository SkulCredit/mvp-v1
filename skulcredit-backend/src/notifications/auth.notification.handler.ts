import emailService from '../emails/email.service';
import logger from '../config/logger';
import type {
  AuthEvent,
} from './auth.event.publisher';

export async function handleAuthEvent(payload: AuthEvent): Promise<void> {
  const tag = '[AuthNotificationHandler]';

  switch (payload.event) {
    case 'auth.email.verification':
      logger.info(`${tag} Sending email verification → ${payload.email}`);
      await emailService.sendEmailVerification({
        email:     payload.email,
        name:      payload.name,
        verifyUrl: payload.verifyUrl,
      });
      break;

    case 'auth.otp.send':
      logger.info(`${tag} Sending OTP → ${payload.email} otp=${payload.otp}`);
      await emailService.sendOtp({
        email: payload.email,
        otp:   payload.otp,
      });
      break;

    case 'auth.password.reset':
      logger.info(`${tag} Sending password reset → ${payload.email}`);
      await emailService.sendPasswordReset({
        email:    payload.email,
        resetUrl: payload.resetUrl,
      });
      break;

    case 'auth.session.login':
      logger.info(`${tag} Sending login alert → ${payload.email} ip=${payload.ip}`);
      await emailService.sendLoginAlert({
        email:  payload.email,
        ip:     payload.ip,
        device: payload.device,
      });
      break;

    case 'auth.account.locked':
      logger.info(`${tag} Sending account locked → ${payload.email} minutes=${payload.minutes}`);
      await emailService.sendAccountLocked({
        email:   payload.email,
        minutes: payload.minutes,
      });
      break;

    case 'auth.password.changed':
      logger.info(`${tag} Sending password changed → ${payload.email}`);
      await emailService.sendPasswordChanged({
        email: payload.email,
      });
      break;

    default:
      logger.warn(`${tag} Unknown event type received`);
  }
}
