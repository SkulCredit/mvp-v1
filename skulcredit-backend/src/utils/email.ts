import nodemailer from 'nodemailer';
import env from '../config/env';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  let transporter: nodemailer.Transporter;

  if (env.smtp.host && env.smtp.user) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.warn('SMTP credentials not found in env. Using Ethereal mock email.');
  }

  const info = await transporter.sendMail({
    from: '"SkulCredit Team" <noreply@skulcredit.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html ?? `<p>${options.message}</p>`,
  });

  if (!env.smtp.host) {
    console.log('Mock email sent. Preview URL:', nodemailer.getTestMessageUrl(info));
  }
};

export default sendEmail;
