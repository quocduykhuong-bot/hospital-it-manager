import { Response } from 'express';
import { db } from '../../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import bcrypt from 'bcryptjs';

// --- User Management ---
export const getUsers = (req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare("SELECT id, username, role, full_name FROM users").all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  const { username, password, role, full_name } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const info = db.prepare("INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)").run(username, hash, role, full_name);
    res.json({ id: info.lastInsertRowid, message: "Thêm người dùng thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const { role, full_name, password } = req.body;
  let query = "UPDATE users SET role = ?, full_name = ?";
  const params: any[] = [role, full_name];

  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query += ", password_hash = ?";
      params.push(hash);
    }

    query += " WHERE id = ?";
    params.push(req.params.id);

    db.prepare(query).run(...params);
    res.json({ message: "Cập nhật người dùng thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = (req: AuthRequest, res: Response) => {
  try {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ message: "Xóa người dùng thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// --- Department Management ---
export const getDepartments = (req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare("SELECT * FROM departments ORDER BY name").all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createDepartment = (req: AuthRequest, res: Response) => {
  try {
    const info = db.prepare("INSERT INTO departments (name) VALUES (?)").run(req.body.name);
    res.json({ id: info.lastInsertRowid, message: "Thêm khoa phòng thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDepartment = (req: AuthRequest, res: Response) => {
  try {
    db.prepare("UPDATE departments SET name = ? WHERE id = ?").run(req.body.name, req.params.id);
    res.json({ message: "Cập nhật khoa phòng thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDepartment = (req: AuthRequest, res: Response) => {
  try {
    // Kiểm tra xem có thiết bị nào đang ở khoa phòng này không (dựa trên giao dịch gần nhất)
    const check = db.prepare(`
      SELECT COUNT(*) as count 
      FROM equipment_transactions t
      WHERE t.department_id = ?
      AND t.id IN (SELECT MAX(id) FROM equipment_transactions GROUP BY equipment_id)
    `).get(req.params.id) as { count: number };

    if (check.count > 0) {
      return res.status(400).json({ error: "Không thể xóa Khoa/Phòng này vì đang có thiết bị được phân bổ tại đây." });
    }

    db.prepare("DELETE FROM departments WHERE id = ?").run(req.params.id);
    res.json({ message: "Xóa khoa phòng thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
