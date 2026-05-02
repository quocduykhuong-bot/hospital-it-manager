import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hospital-it-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: 'User' | 'Administrator';
  };
}

// Middleware xác thực Token chung
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Bạn chưa đăng nhập hoặc token không hợp lệ' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Phiên làm việc hết hạn, vui lòng đăng nhập lại' });
    req.user = user;
    next();
  });
};

// Middleware phân quyền Admin chung
export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'Administrator') {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối: Chỉ dành cho Quản trị viên' });
  }
  next();
};

// Middleware phân quyền Xóa (Chỉ Admin mới được xóa)
export const authorizeDelete = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'Administrator') {
    return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác xóa dữ liệu' });
  }
  next();
};
