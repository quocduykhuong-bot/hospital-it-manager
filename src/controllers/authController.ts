import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'hospital-it-secret-key';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' });
  }

  try {
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại' });
    }

    // Kiểm tra mật khẩu đã mã hóa
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Mật khẩu không chính xác' });
    }

    // Tạo JWT Token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      }, 
      JWT_SECRET,
      { expiresIn: '8h' } // Token có hiệu lực 8 tiếng
    );

    // Trả về thông tin
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi xử lý đăng nhập' });
  }
};
