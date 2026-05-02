import { Router } from 'express';
import * as authController from '../controllers/authController.ts';

const router = Router();

// Endpoint: POST /api/auth/login
router.post('/login', authController.login);

export default router;
