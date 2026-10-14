/**
 * auth.templates.ts
 *
 * HTML templates for all auth-related emails:
 *   - Email verification
 *   - OTP send
 *   - Password reset
 *   - Login alert
 *   - Account locked
 *   - Password changed
 */

import { emailLayout, ctaButton, noticeBox, infoCard } from './base.template';


export function emailVerificationTemplate(opts: {
  name: string;
  verifyUrl: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">Welcome, ${opts.name}!</p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      Thanks for creating your SkulCredit account. Click the button below to verify your
      email address and activate your account. This link expires in <strong>24 hours</strong>.
    </p>
    ${ctaButton('Verify Email Address', opts.verifyUrl)}
    <p style="margin:16px 0 0;font-size:12px;color:#aaa;text-align:center">
      If you didn't create a SkulCredit account, you can safely ignore this email.
    </p>`;

  return emailLayout({
    headerTitle: 'Verify your SkulCredit email address',
    headerSubtitle: 'Account Verification',
    content,
  });
}

export function otpEmailTemplate(opts: {
  email: string;
  otp: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a;text-align:center">
      Verification Code
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;text-align:center;line-height:1.6">
      Use the code below to complete your verification. It expires in <strong>30 minutes</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr><td align="center">
        <div style="display:inline-block;background:#fdf4f7;border:2px dashed #7A0E42;
                    border-radius:8px;padding:20px 40px">
          <span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#7A0E42">
            ${opts.otp}
          </span>
        </div>
      </td></tr>
    </table>
    ${noticeBox('<strong>Never share this code with anyone.</strong> SkulCredit staff will never ask for your OTP.')}`;

  return emailLayout({
    headerTitle: 'Your SkulCredit verification code',
    headerSubtitle: 'One-Time Password',
    content,
  });
}

export function passwordResetTemplate(opts: {
  resetUrl: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">Reset your password</p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      We received a request to reset the password for your SkulCredit account.
      Click the button below — this link expires in <strong>15 minutes</strong>.
    </p>
    ${ctaButton('Reset Password', opts.resetUrl)}
    <p style="margin:16px 0 0;font-size:12px;color:#aaa;text-align:center">
      If you didn't request a password reset, you can safely ignore this email.
      Your password will not change.
    </p>`;

  return emailLayout({
    headerTitle: 'Reset your SkulCredit password',
    headerSubtitle: 'Password Reset',
    content,
  });
}

export function loginAlertTemplate(opts: {
  ip: string;
  device: string;
  time: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">New login detected</p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      A new login was detected on your SkulCredit account.
    </p>
    ${infoCard([
      { label: 'IP Address', value: opts.ip },
      { label: 'Device',     value: opts.device },
      { label: 'Time',       value: opts.time },
    ])}
    <p style="margin:0 0 0;font-size:13px;color:#555;line-height:1.6">
      If this was you, no action is needed. If you don't recognise this login,
      please <strong>reset your password immediately</strong>.
    </p>`;

  return emailLayout({
    headerTitle: 'New login to your SkulCredit account',
    headerSubtitle: 'Security Alert',
    content,
  });
}

export function accountLockedTemplate(opts: {
  minutes: number;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#c0392b">
      Account temporarily locked
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      Your SkulCredit account has been temporarily locked for
      <strong>${opts.minutes} minutes</strong> due to too many failed login attempts.
    </p>
    ${noticeBox(
      'You can try again after the lockout period. If you didn\'t initiate these attempts, please reset your password as soon as the account is unlocked.',
      '#c0392b',
    )}
    <p style="margin:0;font-size:12px;color:#aaa;text-align:center">
      This is an automated security notification from SkulCredit.
    </p>`;

  return emailLayout({
    headerTitle: 'Your SkulCredit account has been temporarily locked',
    headerSubtitle: 'Security Notice',
    headerColor: '#c0392b',
    content,
  });
}

export function passwordChangedTemplate(opts: {
  time: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">Password changed</p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      Your SkulCredit account password was successfully changed on
      <strong>${opts.time}</strong>.
    </p>
    ${noticeBox(
      'If you made this change, no action is needed. If you did <strong>not</strong> change your password, please contact our support team immediately.',
    )}
    <p style="margin:0;font-size:12px;color:#aaa;text-align:center">
      For your security, we notify you of every password change.
    </p>`;

  return emailLayout({
    headerTitle: 'Your SkulCredit password has been changed',
    headerSubtitle: 'Security Notification',
    content,
  });
}
