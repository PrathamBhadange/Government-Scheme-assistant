import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import schemeRoutes from './routes/schemeRoutes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '32kb' }));
app.use('/api/schemes', schemeRoutes);
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found', errors: [] }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  return res.status(500).json({ success: false, message: 'Internal server error', errors: [] });
});

const port = Number(process.env.PORT) || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Scheme API listening on http://localhost:${port}`));
}

export default app;
