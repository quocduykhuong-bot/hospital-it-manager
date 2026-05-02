import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');

// To manually trigger a reset, create a file named '.reset_db' in the root
try {
  const resetFile = path.resolve(process.cwd(), '.reset_db');
  if (fs.existsSync(resetFile)) {
    console.log('Resetting database...');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('Database file deleted.');
    }
    fs.unlinkSync(resetFile);
    console.log('Reset signal file removed.');
  }
} catch (e) {
  console.error('Error during database reset check:', e);
}

export const db = new Database(dbPath);

export const initializeDb = () => {
  // 1. Bảng Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('User', 'Administrator')) NOT NULL,
      full_name TEXT
    )
  `);

  // 2. Bảng Departments
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // 3. Bảng Equipment_Master
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipment_master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, 
      status TEXT CHECK(status IN ('Đang sử dụng', 'Đang sửa', 'Đã thanh lý', 'Trong kho')) NOT NULL,
      department_id INTEGER REFERENCES departments(id),
      entry_date DATE,
      supplier TEXT,
      mainboard TEXT,
      specs TEXT 
    )
  `);

  // 4. Bảng Equipment_Transactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipment_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER REFERENCES equipment_master(id),
      department_id INTEGER REFERENCES departments(id),
      user_id INTEGER REFERENCES users(id),
      action_type TEXT CHECK(action_type IN ('Cấp mới', 'Mang về sửa', 'Trả lại')) NOT NULL,
      action_date DATE NOT NULL,
      fault_description TEXT
    )
  `);

  // 5. Bảng Liquidations
  db.exec(`
    CREATE TABLE IF NOT EXISTS liquidations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER REFERENCES equipment_master(id),
      liquidator_id INTEGER REFERENCES users(id),
      liquidation_date DATE NOT NULL,
      reported_to_manager BOOLEAN DEFAULT 0,
      document_ref TEXT,
      reason TEXT,
      attachment_path TEXT
    )
  `);

  // Ensure new columns exist for existing databases
  try {
    const columns = db.prepare("PRAGMA table_info(liquidations)").all() as any[];
    const hasReason = columns.some(c => c.name === 'reason');
    const hasAttachment = columns.some(c => c.name === 'attachment_path');
    
    if (!hasReason) {
      db.exec("ALTER TABLE liquidations ADD COLUMN reason TEXT");
    }
    if (!hasAttachment) {
      db.exec("ALTER TABLE liquidations ADD COLUMN attachment_path TEXT");
    }
  } catch (err) {
    console.error("Migration error:", err);
  }

  // Insert default admin if not exists
  const admin = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
  if (!admin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    db.prepare("INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)").run(
      'admin', hash, 'Administrator', 'Quản trị viên hệ thống'
    );
  }

  // Insert 43 default departments if table is empty
  const countRow = db.prepare("SELECT count(*) as count FROM departments").get() as { count: number };
  if (countRow.count === 0) {
    const depts = [
      'Khoa Khám bệnh', 'Khoa Hồi sức cấp cứu', 'Khoa Nội tổng hợp', 'Khoa Nội tim mạch', 
      'Khoa Nội tiêu hóa', 'Khoa Nội thận - Tiết niệu', 'Khoa Nội nội tiết', 'Khoa Nội cơ xương khớp',
      'Khoa Truyền nhiễm', 'Khoa Lao - Bệnh phổi', 'Khoa Ngoại tổng hợp', 'Khoa Ngoại chấn thương chỉnh hình',
      'Khoa Ngoại thần kinh', 'Khoa Phẫu thuật - Gây mê hồi sức', 'Khoa Phụ sản', 'Khoa Nhi',
      'Khoa Tai Mũi Họng', 'Khoa Răng Hàm Mặt', 'Khoa Mắt', 'Khoa Da liễu',
      'Khoa Phục hồi chức năng', 'Khoa Y học cổ truyền', 'Khoa Ung bướu', 'Khoa Huyết học truyền máu',
      'Khoa Hóa sinh', 'Khoa Vi sinh', 'Khoa Giải phẫu bệnh', 'Khoa Kiểm soát nhiễm khuẩn',
      'Khoa Dược', 'Khoa Dinh dưỡng', 'Khoa Chẩn đoán hình ảnh', 'Khoa Thăm dò chức năng',
      'Phòng Tổ chức cán bộ', 'Phòng Kế hoạch tổng hợp', 'Phòng Điều dưỡng', 'Phòng Tài chính kế toán',
      'Phòng Hành chính quản trị', 'Phòng Vật tư - Trang thiết bị y tế', 'Phòng Công nghệ thông tin',
      'Phòng Quản lý chất lượng', 'Phòng Công tác xã hội', 'Đơn vị Thận nhân tạo', 'Đơn vị Nội soi'
    ];
    
    const insert = db.prepare("INSERT INTO departments (name) VALUES (?)");
    const transaction = db.transaction((names: string[]) => {
      for (const name of names) insert.run(name);
    });
    transaction(depts);
  }
};

