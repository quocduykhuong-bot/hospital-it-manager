import { Response } from "express";
import { AuthRequest } from "../middleware/auth.ts";
import { db } from "../../db.ts";
import ExcelJS from "exceljs";

export const getSummaryReport = async (req: AuthRequest, res: Response) => {
  try {
    const departments = db.prepare("SELECT id, name FROM departments ORDER BY name").all() as { id: number, name: string }[];
    const equipmentTypes = db.prepare("SELECT DISTINCT type FROM equipment_master ORDER BY type").all() as { type: string }[];
    
    // Get all counts grouped by dept and type
    const counts = db.prepare(`
      SELECT department_id, type, count(*) as count
      FROM equipment_master
      WHERE department_id IS NOT NULL
      GROUP BY department_id, type
    `).all() as { department_id: number, type: string, count: number }[];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo tổng hợp');

    // Header: Departments | Type 1 | Type 2 | ... | Total
    const types = equipmentTypes.map(t => t.type);
    const headers = ['Khoa/Phòng', ...types, 'TỔNG CỘNG'];
    
    worksheet.mergeCells(1, 1, 1, headers.length);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = 'BÁO CÁO TỔNG HỢP THIẾT BỊ THEO KHOA PHÒNG';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    const headerRow = worksheet.getRow(2);
    headerRow.values = headers;
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const typeTotals: { [key: string]: number } = {};
    types.forEach(t => typeTotals[t] = 0);
    let grandTotal = 0;

    departments.forEach((dept) => {
      const rowData: any[] = [dept.name];
      let rowSum = 0;
      
      types.forEach(type => {
        const item = counts.find(c => c.department_id === dept.id && c.type === type);
        const count = item ? item.count : 0;
        rowData.push(count);
        rowSum += count;
        typeTotals[type] += count;
      });
      
      rowData.push(rowSum);
      grandTotal += rowSum;
      
      const row = worksheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Total row
    const summaryRowData = ['TỔNG CỘNG', ...types.map(t => typeTotals[t]), grandTotal];
    const summaryRow = worksheet.addRow(summaryRowData);
    summaryRow.font = { bold: true };
    summaryRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Adjust column widths
    worksheet.columns.forEach((column, i) => {
      if (i === 0) column.width = 40;
      else column.width = 15;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Bao-cao-tong-hop.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (err: any) {
    console.error("Summary Report Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getDetailedReport = async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT e.*, d.name as department_name,
      (SELECT MIN(action_date) FROM equipment_transactions WHERE equipment_id = e.id AND action_type = 'Cấp mới') as first_issue_date
      FROM equipment_master e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY d.name, e.type
    `;
    const rows = db.prepare(query).all() as any[];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo chi tiết');

    const headers = [
      'Khoa/Phòng', 'Loại thiết bị', 'Tên thiết bị', 'Mã thiết bị', 
      'Trạng thái', 'Ngày cấp', 'CPU', 'RAM', 'Mainboard', 'Ổ cứng (HDD/SSD)', 'Địa chỉ IP'
    ];
    
    worksheet.getRow(1).values = headers;
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    rows.forEach(item => {
      let specs: any = {};
      try {
        if (item.specs) {
          specs = JSON.parse(item.specs);
        }
      } catch (e) {}

      const isComputer = ['Desktop', 'Laptop'].includes(item.type);

      const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN');
      };

      const row = worksheet.addRow([
        item.department_name || 'Trong kho',
        item.type,
        item.name,
        item.code,
        item.status,
        formatDate(item.first_issue_date),
        isComputer ? (specs.cpu || '-') : '-',
        isComputer ? (specs.ram || '-') : '-',
        isComputer ? (item.mainboard || specs.mainboard || '-') : '-',
        isComputer ? (specs.hdd || specs.storage || '-') : '-',
        specs.ip || specs.ip_address || '-'
      ]);

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Adjust column widths
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Bao-cao-chi-tiet.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (err: any) {
    console.error("Detailed Report Error:", err);
    res.status(500).json({ error: err.message });
  }
};
