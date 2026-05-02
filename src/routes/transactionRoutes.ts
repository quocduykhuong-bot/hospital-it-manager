import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as transactionController from '../controllers/transactionController.ts';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.ts';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/move', authenticateToken, transactionController.handleMovement);
router.post('/liquidate', authenticateToken, upload.single('attachment'), transactionController.handleLiquidation);
router.get('/liquidation/:equipmentId', authenticateToken, transactionController.getLiquidationByEquipmentId);

export default router;
