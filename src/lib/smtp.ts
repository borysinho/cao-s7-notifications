import nodemailer from 'nodemailer';
import { env, positiveInteger } from './config.ts';

export function createSmtp() {
  const timeout = positiveInteger('SMTP_TIMEOUT_MS');
  return nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port: positiveInteger('SMTP_PORT'),
    secure: false,
    ignoreTLS: true,
    connectionTimeout: timeout,
    greetingTimeout: timeout,
    socketTimeout: timeout,
  });
}
