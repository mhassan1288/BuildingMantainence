import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import auth from './routes/auth';
import data from './routes/data';

export const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'healthy' }));
app.use('/api/auth', auth);
app.use('/api', data);
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof Error && error.name === 'ZodError') {
    return res.status(400).json({ success: false, error: 'Invalid request data' });
  }
  if ((error as { code?: string })?.code === '23505') {
    return res.status(409).json({ success: false, error: 'A maintenance record already exists for this apartment and month' });
  }
  if ((error as { code?: string })?.code === '23503') {
    return res.status(400).json({ success: false, error: 'Referenced apartment does not exist' });
  }
  console.error(error);
  return res.status(500).json({ success: false, error: 'Internal server error' });
});
