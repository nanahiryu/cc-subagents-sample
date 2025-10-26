import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import todosRouter from './routes/todos';

const app = new Hono();

// CORS middleware
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Routes
app.route('/api/todos', todosRouter);

// Error handling
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '8787', 10);

console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
