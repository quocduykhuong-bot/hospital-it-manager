import { Response } from 'express';
import { db } from '../../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

export const getAllEquipment = (req: AuthRequest, res: Response) => {
  const { department_id, type, status, page = 1, limit = 30 } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  let baseQuery = `
    FROM equipment_master e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (department_id) {
    baseQuery += " AND e.department_id = ?";
    params.push(department_id);
  }
  if (type) {
    baseQuery += " AND e.type = ?";
    params.push(type);
  }
  if (status) {
    if (status === 'Đã cấp') {
      baseQuery += " AND e.status IN ('Đang sử dụng', 'Đang sửa')";
    } else {
      baseQuery += " AND e.status = ?";
      params.push(status);
    }
  }
  if (req.query.search) {
    baseQuery += " AND (e.code LIKE ? OR e.name LIKE ?)";
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }

  const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
  const dataQuery = `
    SELECT 
      e.*, 
      d.name as current_department,
      (SELECT MIN(action_date) FROM equipment_transactions WHERE equipment_id = e.id AND action_type = 'Cấp mới') as first_issue_date
    ${baseQuery}
    ORDER BY 
      d.name ASC, 
      CASE e.status
        WHEN 'Đang sử dụng' THEN 1
        WHEN 'Đang sửa' THEN 2
        WHEN 'Đã thanh lý' THEN 3
        WHEN 'Trong kho' THEN 4
        ELSE 5
      END ASC,
      e.code ASC
    LIMIT ? OFFSET ?
  `;

  try {
    const totalRow = db.prepare(countQuery).get(...params) as { total: number };
    const rows = db.prepare(dataQuery).all(...params, limitNum, offset);
    
    res.json({
      data: rows,
      total: totalRow.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalRow.total / limitNum)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getRepairingEquipment = (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const query = `
    SELECT 
      e.*, 
      t.user_id as transaction_user_id, 
      u.full_name as repairer_name,
      t.action_date as repair_date,
      t.fault_description as repair_fault,
      t.department_id as original_department_id,
      d.name as original_department_name
    FROM equipment_master e
    JOIN equipment_transactions t ON e.id = t.equipment_id
    LEFT JOIN departments d ON t.department_id = d.id
    JOIN users u ON t.user_id = u.id
    WHERE e.status = 'Đang sửa' 
    AND t.action_type = 'Mang về sửa'
    AND t.id = (
      SELECT MAX(id) 
      FROM equipment_transactions 
      WHERE equipment_id = e.id 
      AND action_type = 'Mang về sửa'
    )
  `;
  
  try {
    const rows = db.prepare(query).all();
    const results = rows.map((row: any) => ({
      ...row,
      is_mine: row.transaction_user_id === userId
    }));
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createEquipment = (req: AuthRequest, res: Response) => {
  const { code, name, type, status, department_id, entry_date, supplier, mainboard, specs } = req.body;
  const query = `INSERT INTO equipment_master (code, name, type, status, department_id, entry_date, supplier, mainboard, specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  try {
    const info = db.prepare(query).run(code, name, type, status, department_id || null, entry_date || null, supplier || null, mainboard || null, JSON.stringify(specs));
    res.json({ id: info.lastInsertRowid, message: "Thêm thiết bị thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEquipment = (req: AuthRequest, res: Response) => {
  const { name, type, status, department_id, entry_date, supplier, mainboard, specs } = req.body;
  const query = `UPDATE equipment_master SET name = ?, type = ?, status = ?, department_id = ?, entry_date = ?, supplier = ?, mainboard = ?, specs = ? WHERE id = ?`;
  
  try {
    db.prepare(query).run(name, type, status, department_id || null, entry_date || null, supplier || null, mainboard || null, JSON.stringify(specs), req.params.id);
    res.json({ message: "Cập nhật thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteEquipment = (req: AuthRequest, res: Response) => {
  try {
    db.prepare("DELETE FROM equipment_master WHERE id = ?").run(req.params.id);
    res.json({ message: "Xóa thiết bị thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getEquipmentByDepartment = (req: AuthRequest, res: Response) => {
  const { departmentId } = req.params;
  const query = `
    SELECT * FROM equipment_master 
    WHERE department_id = ?
    AND status = 'Đang sử dụng'
  `;
  try {
    const rows = db.prepare(query).all(departmentId);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAvailableEquipment = (req: AuthRequest, res: Response) => {
  // Thiết bị đang ở trạng thái 'Trong kho'
  const query = "SELECT * FROM equipment_master WHERE status = 'Trong kho'";
  try {
    const rows = db.prepare(query).all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const generateEquipmentCode = (req: AuthRequest, res: Response) => {
  const { type } = req.query;
  if (!type) return res.status(400).json({ error: 'Type is required' });

  const typePrefixes: { [key: string]: string } = {
    'Desktop': 'PC0',
    'Laptop': 'LAP',
    'Máy in': 'PRN',
    'Màn hình': 'MON',
    'Máy scan': 'SCN',
    'Máy quét vân tay': 'FPR',
    'Máy quét barcode': 'BAR'
  };

  const prefix = typePrefixes[type as string] || 'OTH';
  
  try {
    // Count existing equipment with this prefix
    const row = db.prepare("SELECT COUNT(*) as count FROM equipment_master WHERE code LIKE ?").get(prefix + '%') as { count: number };
    const nextNumber = row.count + 1;
    
    // Pad with zeros to fit remaining length (8 - prefix.length)
    const paddingLength = 8 - prefix.length;
    const paddedNumber = nextNumber.toString().padStart(paddingLength, '0');
    
    const code = prefix + paddedNumber;
    res.json({ code });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const seedEquipment = (req: AuthRequest, res: Response) => {
  const { type, quantity, note, cpu, mainboard: reqMainboard, ram, storage, supplier: reqSupplier } = req.body;
  if (!type || !quantity) return res.status(400).json({ error: "Thiếu loại hoặc số lượng" });

  const typePrefixes: { [key: string]: string } = {
    'Desktop': 'PC0',
    'Laptop': 'LAP',
    'Máy in': 'PRN',
    'Màn hình': 'MON',
    'Máy scan': 'SCN',
    'Máy quét vân tay': 'FPR',
    'Máy quét barcode': 'BAR'
  };

  const prefix = typePrefixes[type] || 'OTH';
  const isComputer = ['Desktop', 'Laptop'].includes(type);

  try {
    const currentCountRow = db.prepare("SELECT COUNT(*) as count FROM equipment_master WHERE code LIKE ?").get(prefix + '%') as { count: number };
    let currentCount = currentCountRow.count;

    const insert = db.prepare(`
      INSERT INTO equipment_master (code, name, type, status, department_id, mainboard, supplier, specs) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    const cpuOptions = ['Core i3-12100', 'Core i5-12400', 'Core i7-12700', 'Core i9-12900'];
    const ramOptions = ['8GB DDR4', '16GB DDR4', '32GB DDR4'];
    const storageOptions = ['SSD 128GB', 'SSD 256GB', 'SSD 512GB', 'HDD 1TB'];
    const mbOptions = ['ASUS B660', 'MSI H610', 'Gigabyte B760', 'ASRock H670'];
    const supplierOptions = ['Phong Vũ Computer', 'FPT Shop', 'TGDD', 'Hanoicomputer'];

    db.transaction(() => {
      for (let i = 1; i <= parseInt(quantity); i++) {
        currentCount++;
        const paddingLength = 8 - prefix.length;
        const code = prefix + currentCount.toString().padStart(paddingLength, '0');
        
        let mainboard = reqMainboard || null;
        let supplier = reqSupplier || null;
        let specs: any = {};
        let name = `${type} - ${note || 'Dữ liệu mẫu'}`;

        if (isComputer) {
          mainboard = reqMainboard || getRandom(mbOptions);
          supplier = reqSupplier || getRandom(supplierOptions);
          specs = {
            cpu: cpu || getRandom(cpuOptions),
            ram: ram || getRandom(ramOptions),
            hdd: storage || getRandom(storageOptions),
            hostname: `GEN-${code}`,
            ip: `192.168.1.${(currentCount % 254) + 1}`,
            mainboard: mainboard,
            note: note || ''
          };
        } else {
          specs = { note: note || '' };
        }

        insert.run(code, name, type, 'Trong kho', null, mainboard, supplier, JSON.stringify(specs));
      }
    })();

    res.json({ message: `Đã nạp ${quantity} thiết bị loại ${type} thành công!` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getEquipmentTypes = (req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare("SELECT DISTINCT type FROM equipment_master ORDER BY type ASC").all();
    res.json(rows.map((r: any) => r.type));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getEquipmentById = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const query = `
    SELECT 
      e.*,
      d.name as department_name,
      u.full_name as issuer_name,
      t.action_date as issue_date
    FROM equipment_master e
    LEFT JOIN (
      SELECT * FROM equipment_transactions 
      WHERE action_type = 'Cấp mới'
      AND equipment_id = ?
      ORDER BY id DESC
      LIMIT 1
    ) t ON e.id = t.equipment_id
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE e.id = ?
  `;
  try {
    const row = db.prepare(query).get(id, id);
    if (!row) return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const checkName = (req: AuthRequest, res: Response) => {
  const { name } = req.query;
  if (!name) return res.json({ exists: false });
  try {
    const row = db.prepare("SELECT id FROM equipment_master WHERE name = ? LIMIT 1").get(name);
    res.json({ exists: !!row });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const checkIP = (req: AuthRequest, res: Response) => {
  const { ip } = req.query;
  if (!ip) return res.json({ exists: false });
  try {
    // Search within the JSON specs string for the IP
    // Using json_extract if available, otherwise a simple LIKE check inside the JSON string
    // Here we use json_extract for accuracy
    const query = `
      SELECT id FROM equipment_master 
      WHERE json_extract(specs, '$.ip') = ? 
      OR json_extract(specs, '$.ip_address') = ?
      LIMIT 1
    `;
    const row = db.prepare(query).get(ip, ip);
    res.json({ exists: !!row });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

import ExcelJS from "exceljs";

export const importEquipment = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "Vui lòng chọn file Excel" });
  }

  const workbook = new ExcelJS.Workbook();
  
  try {
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];
    
    const codesInFile: string[] = [];
    const internalDuplicates: string[] = [];
    const rowsToProcess: any[] = [];

    // Step 1 & 2: Scan for codes and internal duplicates
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const code = row.getCell(4).text?.trim();
      if (!code) continue;

      if (codesInFile.includes(code)) {
        if (!internalDuplicates.includes(code)) {
          internalDuplicates.push(code);
        }
      }
      codesInFile.push(code);
      rowsToProcess.push({ i, row, code });
    }

    if (internalDuplicates.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Tiến trình bị hủy! Phát hiện mã thiết bị bị trùng lặp trong chính file Excel: ${internalDuplicates.join(', ')}` 
      });
    }

    // Step 3: Check duplicates with Database
    if (codesInFile.length > 0) {
      const placeholders = codesInFile.map(() => '?').join(',');
      const dbDuplicates = db.prepare(`SELECT code FROM equipment_master WHERE code IN (${placeholders})`).all(...codesInFile) as { code: string }[];
      
      if (dbDuplicates.length > 0) {
        const duplicateCodes = dbDuplicates.map(d => d.code);
        return res.status(409).json({ 
          success: false, 
          message: `Tiến trình bị hủy! Phát hiện mã thiết bị đã tồn tại trong hệ thống: ${duplicateCodes.join(', ')}` 
        });
      }
    }

    // If we reach here, no duplicates found. Proceed with import.
    const results = { success: 0, failed: 0, errors: [] as string[] };
    const departments = db.prepare("SELECT id, name FROM departments").all() as { id: number, name: string }[];
    const userId = req.user?.id;

    for (const { i, row, code } of rowsToProcess) {
      try {
        const deptName = row.getCell(1).text?.trim();
        const type = row.getCell(2).text?.trim();
        const name = row.getCell(3).text?.trim();
        const status = row.getCell(5).text?.trim();
        const issueDateRaw = row.getCell(6).value;
        
        const cpu = row.getCell(7).text?.trim();
        const ram = row.getCell(8).text?.trim();
        const mainboardValue = row.getCell(9).text?.trim();
        const storage = row.getCell(10).text?.trim();
        const ip = row.getCell(11).text?.trim();

        // 1. Map Department
        let deptId: number | null = null;
        if (deptName && deptName.toLowerCase() !== 'trong kho') {
          const found = departments.find(d => d.name.toLowerCase() === deptName.toLowerCase());
          if (found) {
            deptId = found.id;
          } else {
            const insertDept = db.prepare("INSERT INTO departments (name) VALUES (?)").run(deptName);
            deptId = insertDept.lastInsertRowid as number;
            departments.push({ id: deptId, name: deptName });
          }
        }

        // 2. Build Specs JSON
        const specsObj: any = {};
        if (cpu && cpu !== '-') specsObj.cpu = cpu;
        if (ram && ram !== '-') specsObj.ram = ram;
        if (mainboardValue && mainboardValue !== '-') specsObj.mainboard = mainboardValue;
        if (storage && storage !== '-') specsObj.storage = storage;
        if (ip && ip !== '-') specsObj.ip = ip;
        const specsJson = JSON.stringify(specsObj);

        // 3. Create new explicitly (no update allowed per latest instructions if any exist)
        const insertStmt = db.prepare(`
          INSERT INTO equipment_master (type, name, code, department_id, status, specs, mainboard)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = insertStmt.run(type, name, code, deptId, status, specsJson, mainboardValue || null);
        const equipmentId = result.lastInsertRowid as number;

        // 4. Handle Issue Transaction
        if (issueDateRaw && status === 'Đang sử dụng' && deptId) {
          let issueDateStr = '';
          if (issueDateRaw instanceof Date) {
            issueDateStr = issueDateRaw.toISOString();
          } else {
            const parts = row.getCell(6).text.split('/');
            if (parts.length === 3) {
              issueDateStr = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
            }
          }

          if (issueDateStr) {
            db.prepare(`
              INSERT INTO equipment_transactions (equipment_id, department_id, user_id, action_type, action_date, fault_description)
              VALUES (?, ?, ?, 'Cấp mới', ?, 'Import từ Excel')
            `).run(equipmentId, deptId, userId, issueDateStr);
          }
        }
        results.success++;
      } catch (rowErr: any) {
        results.failed++;
        results.errors.push(`Dòng ${i}: ${rowErr.message}`);
      }
    }
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi xử lý file Excel: " + err.message });
  }
};
