import express from 'express';
import { trackRoute } from './routes/track';
import { statsRoute } from './routes/stats';  
import { widgetRoute } from './routes/widget';
import { corsMiddleware } from './middleware/cors';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(corsMiddleware);
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'here-now-api' });
  });

  // API routes
  app.use('/api/track', trackRoute);
  app.use('/api/stats', statsRoute);
  app.use('/widget.js', widgetRoute);

  // Root endpoint info
  app.get('/', (req, res) => {
    res.json({
      name: 'here/now analytics API',
      version: '1.0.0',
      endpoints: {
        track: 'POST /api/track',
        stats: 'GET /api/stats',
        widget: 'GET /widget.js',
        health: 'GET /health'
      },
      docs: 'https://github.com/your-username/here-now'
    });
  });

  return app;
};
