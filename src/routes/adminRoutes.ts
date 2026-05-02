import { Router } from 'express';
import * as adminController from '../controllers/adminController.ts';
import { authenticateToken, authorizeAdmin, authorizeDelete } from '../middleware/auth.ts';

const router = Router();

// Route quản lý Users: Chỉ dành cho Admin
router.get('/users', authenticateToken, authorizeAdmin, adminController.getUsers);
router.post('/users', authenticateToken, authorizeAdmin, adminController.createUser);
router.put('/users/:id', authenticateToken, authorizeAdmin, adminController.updateUser);
router.delete('/users/:id', authenticateToken, authorizeAdmin, adminController.deleteUser);

// Route quản lý Departments: User có thể Xem, Thêm, Sửa
router.get('/departments', authenticateToken, adminController.getDepartments);
router.post('/departments', authenticateToken, adminController.createDepartment);
router.put('/departments/:id', authenticateToken, adminController.updateDepartment);
router.delete('/departments/:id', authenticateToken, authorizeDelete, adminController.deleteDepartment);

export default router;
