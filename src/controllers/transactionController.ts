import { Response } from 'express';
import { db } from '../../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

export const handleMovement = (req: AuthRequest, res: Response) => {
  const { equipment_id, department_id, action_type, action_date, fault_description } = req.body;
  const userId = req.user?.id;

  try {
    const transaction = db.transaction(() => {
      // Thêm giao dịch
      const insertTrans = `
        INSERT INTO equipment_transactions (equipment_id, department_id, user_id, action_type, action_date, fault_description)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.prepare(insertTrans).run(equipment_id, department_id, userId, action_type, action_date, fault_description);

      // Cập nhật trạng thái Master
      let newStatus = 'Đang sử dụng';
      let targetDeptId: number | null = department_id;

      if (action_type === 'Mang về sửa') {
        newStatus = 'Đang sửa';
        targetDeptId = null; // Removed from department when taken for repair
      } else if (action_type === 'Hoàn trả sửa chữa') {
        newStatus = 'Đang sử dụng';
        targetDeptId = department_id; // Set to the receiving department
      } else if (action_type === 'Trả lại') {
        newStatus = 'Trong kho';
        targetDeptId = null; // Returned to stock
      }
      
      db.prepare("UPDATE equipment_master SET status = ?, department_id = ? WHERE id = ?").run(newStatus, targetDeptId, equipment_id);
    });

    transaction();
    res.json({ message: `Thực hiện ${action_type} thành công` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const handleLiquidation = (req: AuthRequest, res: Response) => {
  const { equipment_id, liquidation_date, reported_to_manager, document_ref, reason } = req.body;
  const userId = req.user?.id;
  const attachment_path = req.file ? `/uploads/${req.file.filename}` : null;

  if (!reported_to_manager || String(reported_to_manager) === 'false') {
    return res.status(400).json({ message: "Bắt buộc phải báo cáo lãnh đạo trước khi thanh lý" });
  }

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ message: "Bắt buộc phải nhập lý do thanh lý" });
  }

  try {
    const transaction = db.transaction(() => {
      db.prepare(
        `INSERT INTO liquidations 
         (equipment_id, liquidator_id, liquidation_date, reported_to_manager, document_ref, reason, attachment_path) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(equipment_id, userId, liquidation_date, 1, document_ref, reason, attachment_path);

      db.prepare("UPDATE equipment_master SET status = 'Đã thanh lý' WHERE id = ?").run(equipment_id);
    });

    transaction();
    res.json({ message: "Thanh lý thiết bị thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getLiquidationByEquipmentId = (req: AuthRequest, res: Response) => {
  const { equipmentId } = req.params;
  try {
    const query = `
      SELECT 
        l.*,
        u.full_name as liquidator_name,
        e.code as equipment_code,
        e.name as equipment_name
      FROM liquidations l
      JOIN users u ON l.liquidator_id = u.id
      JOIN equipment_master e ON l.equipment_id = e.id
      WHERE l.equipment_id = ?
      ORDER BY l.id DESC
      LIMIT 1
    `;
    const row = db.prepare(query).get(equipmentId);
    if (!row) return res.status(404).json({ message: "Không tìm thấy hồ sơ thanh lý" });
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
