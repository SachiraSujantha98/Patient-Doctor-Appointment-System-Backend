import { Router, RequestHandler } from 'express';
import {
  register,
  login,
  refreshToken,
  googleAuth,
  googleAuthCallback,
} from '../controllers/auth.controller';

const router = Router();

// Authentication routes
router.post('/register', register as RequestHandler);
router.post('/login', login as RequestHandler);
router.post('/refresh', refreshToken as RequestHandler);

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback as RequestHandler);

export const authRoutes = router; 