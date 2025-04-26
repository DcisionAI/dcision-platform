import express, { Router } from 'express';
import { updateSessionStatus } from './routes/session';

const router: Router = express.Router();

// Session routes
router.put('/agent/session/status', updateSessionStatus as express.RequestHandler);

export default router; 