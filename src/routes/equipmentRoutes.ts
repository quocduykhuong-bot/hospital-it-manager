import { Router } from 'express';
import * as equipmentController from '../controllers/equipmentController.ts';
import { authenticateToken, authorizeAdmin, authorizeDelete } from '../middleware/auth.ts';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', authenticateToken, equipmentController.getAllEquipment);
router.get('/repairing', authenticateToken, equipmentController.getRepairingEquipment);
router.get('/available', authenticateToken, equipmentController.getAvailableEquipment);
router.get('/types', authenticateToken, equipmentController.getEquipmentTypes);
router.post('/seed', authenticateToken, authorizeAdmin, equipmentController.seedEquipment);
router.get('/generate-code', authenticateToken, authorizeAdmin, equipmentController.generateEquipmentCode);
router.get('/check-name', authenticateToken, equipmentController.checkName);
router.get('/check-ip', authenticateToken, equipmentController.checkIP);
router.post('/import', authenticateToken, authorizeAdmin, upload.single('file'), equipmentController.importEquipment);
router.get('/department/:departmentId', authenticateToken, equipmentController.getEquipmentByDepartment);
router.get('/:id', authenticateToken, equipmentController.getEquipmentById);
router.post('/', authenticateToken, equipmentController.createEquipment);
router.put('/:id', authenticateToken, equipmentController.updateEquipment);
router.delete('/:id', authenticateToken, authorizeDelete, equipmentController.deleteEquipment);

export default router;
