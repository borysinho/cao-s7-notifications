import type { Api, Log } from './lib/api.ts';
import type { createSmtp } from './lib/smtp.ts';
import { ApiError } from './lib/api.ts';
import { env } from './lib/config.ts';

interface SmtpFailure {
  responseCode?: number;
  originalCode?: string;
  code?: string;
  errno?: string;
}

export function mount(api: Api, { smtp, log }: { smtp: ReturnType<typeof createSmtp>; log: Log }) {
  api.route<{ recipientEmail: string; eventName: string }>('sendConfirmation', { token: 'NOTIFICATIONS_ORDERS_TOKEN' }, async (req, res) => {
    const { orderId } = req.params;
    const { recipientEmail, eventName } = req.body;
    const link = new URL('/mis-entradas', env('WEB_BASE_URL'));
    link.searchParams.set('orderId', orderId);
    try {
      await smtp.sendMail({
        from: env('SMTP_FROM'),
        to: { address: recipientEmail, name: '' },
        subject: 'Confirmación de EntradasYa',
        text: `Tu compra para ${eventName} está confirmada. Descarga tus entradas con la sesión del titular: ${link}`,
      });
    } catch (error) {
      log('warn', 'Falló la solicitud SMTP.', { orderId });
      const failure = error as SmtpFailure;
      const refused = [failure.code, failure.originalCode, failure.errno].includes('ECONNREFUSED');
      const confirmed = (failure.responseCode ?? 0) >= 400 || refused;
      throw new ApiError(503, confirmed ? 'SMTP_FAILED' : 'SMTP_OUTCOME_UNKNOWN', 'Correo temporalmente indisponible.');
    }
    log('info', 'Mailpit aceptó el correo.', { orderId });
    res.sendStatus(204);
  });
}
