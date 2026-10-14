import emailService from '../emails/email.service';
import logger from '../config/logger';
import type {
  AuthEvent,
} from './auth.event.publisher';

export async function handleAuthEvent(payload: AuthEvent): Promise<void> {
  switch (payload.event) {
    case 'auth.email.verification':
      await emailService.sendEmailVerification({
        email:     payload.email,
        name:      payload.name,
        verifyUrl: payload.verifyUrl,
      });
      break;

    case 'auth.otp.send':
      await emailService.sendOtp({
        email: payload.email,
        otp:   payload.otp,
      });
      break;

    case 'auth.password.reset':
      await emailService.sendPasswordReset({
        email:    payload.email,
        resetUrl: payload.resetUrl,
      });
      break;

    case 'auth.session.login':
      await emailService.sendLoginAlert({
        email:  payload.email,
        ip:     payload.ip,
        device: payload.device,
      });
      break;

    case 'auth.account.locked':
      await emailService.sendAccountLocked({
        email:   payload.email,
        minutes: payload.minutes,
      });
      break;

    case 'auth.password.changed':
      await emailService.sendPasswordChanged({
        email: payload.email,
      });
      break;

    default:
      logger.warn(`[AuthNotificationHandler] Unknown event type received`);
  }
}
