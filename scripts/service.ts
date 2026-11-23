import { resolve } from 'node:path';
import { env, positiveInteger } from '../src/lib/config.ts';
import { createApi, logger } from '../src/lib/api.ts';
import { createSmtp } from '../src/lib/smtp.ts';
import { mount } from '../src/index.ts';
try { process.loadEnvFile(resolve(import.meta.dirname, '../.env')); }
catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
const log = logger('notifications', env('LOG_LEVEL'));
const smtp = createSmtp();
const api = createApi(log);
api.route('getHealth', {}, async (_req, res) => {
  try { await smtp.verify(); res.json({ status: 'ok' }); }
  catch { log('warn', 'SMTP indisponible.'); res.status(503).json({ status: 'unavailable' }); }
});
mount(api, { smtp, log });
const server = api.finish().listen(positiveInteger('PORT'), env('HOST'), () => log('info', 'Servidor iniciado.'));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => smtp.close()));
