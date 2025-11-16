import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProvider } from '../services/provider';
import { V2Service } from '../services/v2Service';
import { V3Service } from '../services/v3Service';
import { DEFAULT_CHAIN } from '../config/chains';
import { UNISWAP_V2_FORK1, UNISWAP_V3_FORK1 } from '../config/dexes';

// Initialize provider and services
const provider = createProvider(DEFAULT_CHAIN);
const v2Service = new V2Service(provider, UNISWAP_V2_FORK1);
const v3Service = new V3Service(provider, UNISWAP_V3_FORK1);

// Create Express app
const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handler type
interface ApiError extends Error {
  statusCode?: number;
}

// Error handling middleware
app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    success: false,
  });
});

export { app, v2Service, v3Service, provider };
