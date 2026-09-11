import sendEmail from '../utils/email';
import logger from '../config/logger';
import type {
  AuthEvent,
  EmailVerificationEvent,
  OtpSendEvent,
  PasswordResetEvent,
  LoginEvent,
  AccountLockedEvent,
  PasswordChangedEvent,
} from './auth.event.publisher';

async function sendEmailVerification(payload: EmailVerificationEvent): Promise<void> {
  await sendEmail({
    email:   payload.email,
    subject: 'Verify your SkulCredit email address',
    message: `Click the link to verify your email: ${payload.verifyUrl}`,
    html: `
      <div style="font-family:sans-serif;padding:32px;max-width:520px;margin:auto;border:1px solid #f0f0f0;border-radius:8px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#7A0E42;margin:0;">SkulCredit</h1>
        </div>
        <h2 style="color:#1a1a1a;">Welcome, ${payload.name}!</h2>
        <p style="color:#555;line-height:1.6;">
          Thanks for creating your SkulCredit account. Click the button below to verify your
          email address and activate your account. This link expires in <strong>24 hours</strong>.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${payload.verifyUrl}"
             style="background:#7A0E42;color:#fff;padding:14px 32px;border-radius:6px;
                    text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color:#999;font-size:12px;text-align:center;">
          If you didn't create a SkulCredit account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

async function sendOtpEmail(payload: OtpSendEvent): Promise<void> {
  await sendEmail({
    email:   payload.email,
    subject: 'Your SkulCredit verification code',
    message: `Your SkulCredit verification code is: ${payload.otp}. It expires in 30 minutes.`,
    html: `
      <div style="font-family:sans-serif;padding:32px;max-width:520px;margin:auto;border:1px solid #f0f0f0;border-radius:8px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#7A0E42;margin:0;">SkulCredit</h1>
        </div>
        <h2 style="color:#1a1a1a;text-align:center;">Verification Code</h2>
        <p style="color:#555;text-align:center;line-height:1.6;">
          Use the code below to complete your verification.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <div style="display:inline-block;background:#f8f0f3;border:2px dashed #7A0E42;
                      border-radius:8px;padding:20px 40px;">
            <span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#7A0E42;">
              ${payload.otp}
            </span>
          </div>
        </div>
        <p style="color:#555;text-align:center;">
          This code expires in <strong>30 minutes</strong>.
        </p>
        <p style="color:#999;font-size:12px;text-align:center;">
          Never share this code with anyone. SkulCredit staff will never ask for your OTP.
        </p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(payload: PasswordResetEvent): Promise<void> {
  await sendEmail({
    email:   payload.email,
    subject: 'Reset your SkulCredit password',
    message: `Use this link to reset your password (valid 15 minutes): ${payload.resetUrl}`,
    html: `
      <div style="font-family:sans-serif;padding:32px;max-width:520px;margin:auto;border:1px solid #f0f0f0;border-radius:8px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#7A0E42;margin:0;">SkulCredit</h1>
        </div>
        <h2 style="color:#1a1a1a;">Reset your password</h2>
        <p style="color:#555;line-height:1.6;">
          We received a request to reset the password for your SkulCredit account.
          Click the button below — this link expires in <strong>15 minutes</strong>.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${payload.resetUrl}"
             style="background:#7A0E42;color:#fff;padding:14px 32px;border-radius:6px;
                    text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color:#999;font-size:12px;text-align:center;">
          If you didn't request a password reset, you can safely ignore this email.
          Your password will not change.
        </p>
      </div>
    `,
  });
}

async function sendLoginAlertEmail(payload: LoginEvent): Promise<void> {
  await sendEmail({
    email:   payload.email,
    subject: 'New login to your SkulCredit account',
    message: `A new login was detected on your SkulCredit account from ${payload.ip}.`,
    html: `
      <div style="font-family:sans-serif;padding:32px;max-width:520px;margin:auto;border:1px solid #f0f0f0;border-radius:8px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#7A0E42;margin:0;">SkulCredit</h1>
        </div>
        <h2 style="color:#1a1a1a;">New login detected</h2>
        <p style="color:#555;line-height:1.6;">
          A new login was detected on your SkulCredit account.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f9f9f9;">
            <td style="padding:10px;color:#777;width:40%;">IP Address</td>
            <td style="padding:10px;color:#1a1a1a;">${payload.ip}</td>
          </tr>
          <tr>
            <td style="padding:10px;color:#777;">Device</td>
            <td style="padding:10px;color:#1a1a1a;">${payload.device}</td>
          </tr>
          <tr style="background:#f9f9f9;">
            <td style="padding:10px;color:#777;">Time</td>
            <td style="padding:10px;color:#1a1a1a;">${new Date().toUTCString()}</td>
          </tr>
        </table>
        <p style="color:#555;line-height:1.6;">
          If this was you, no action is needed. If you don't recognise this login,
          please reset your password immediately.
        </p>
        <p style="color:#999;font-size:12px;text-align:center;">
          For your security, we notify you of every new login.
        </p>
      </div>
    `,
  });
}

async function sendAccountLockedEmail(payload: AccountLockedEvent): Promise<void> {
  await sendEmail({
    email:   payload.email,
    subject: 'Your SkulCredit account has been temporarily locked',
    message: `Your account has been locked for ${payload.minutes} minutes due to too many failed login attempts.`,
    html: `
      <div style="font-family:sans-serif;padding:32px;max-width:520px;margin:auto;border:1px solid #f0f0f0;border-radius:8px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#7A0E42;margin:0;">SkulCredit</h1>
        </div>
        <h2 style="color:#c0392b;">Account temporarily locked</h2>
        <p style="color:#555;line-height:1.6;">
          Your SkulCredit account has been temporarily locked for
          <strong>${payload.minutes} minutes</strong> due to too many failed login attempts.
        </p>
        <p style="color:#555;line-height:1.6;">
          You can try again after the lockout period. If you didn't initiate these attempts,
          please reset your password as soon as the account is unlocked.
        </p>
        <p style="color:#999;font-size:12px;text-align:center;">
          This is an automated security notification from SkulCredit.
        </p>
      </div>
    `,
  });
}

async function sendPasswordChangedEmail(payload: PasswordChangedEvent): Promise<void> {
  await sendEmail({
    email:   payload.email,
    subject: 'Your SkulCredit password has been changed',
    message: 'Your SkulCredit account password was recently changed.',
    html: `
      <div style="font-family:sans-serif;padding:32px;max-width:520px;margin:auto;border:1px solid #f0f0f0;border-radius:8px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#7A0E42;margin:0;">SkulCredit</h1>
        </div>
        <h2 style="color:#1a1a1a;">Password changed</h2>
        <p style="color:#555;line-height:1.6;">
          Your SkulCredit account password was successfully changed on
          <strong>${new Date().toUTCString()}</strong>.
        </p>
        <p style="color:#555;line-height:1.6;">
          If you made this change, no action is needed. If you did not change your password,
          please contact our support team immediately.
        </p>
        <p style="color:#999;font-size:12px;text-align:center;">
          For your security, we notify you of every password change.
        </p>
      </div>
    `,
  });
}

export async function handleAuthEvent(payload: AuthEvent): Promise<void> {
  switch (payload.event) {
    case 'auth.email.verification':
      await sendEmailVerification(payload);
      break;
    case 'auth.otp.send':
      await sendOtpEmail(payload);
      break;
    case 'auth.password.reset':
      await sendPasswordResetEmail(payload);
      break;
    case 'auth.session.login':
      await sendLoginAlertEmail(payload);
      break;
    case 'auth.account.locked':
      await sendAccountLockedEmail(payload);
      break;
    case 'auth.password.changed':
      await sendPasswordChangedEmail(payload);
      break;
    default:
      logger.warn(`AuthNotificationHandler: unknown event type received`);
  }
}
