const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const testImport = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
  });

  const sqlPath = path.join(__dirname, '../sqldoanphanmemscrip.sql');
  let sql = fs.readFileSync(sqlPath, 'utf8');

  // Clean
  sql = sql
    .replace(/DROP DATABASE IF EXISTS QUAN_LY_DOAN_VIEN;/gi, '')
    .replace(/CREATE DATABASE QUAN_LY_DOAN_VIEN[\s\S]*?;/gi, '')
    .replace(/USE QUAN_LY_DOAN_VIEN;/gi, '');

  // Split queries by semicolon (but handle potential issues with semicolons inside strings)
  // A simple split by semicolon will work fine for this script since there are no complex procedures or triggers
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  console.log(`Tổng số câu lệnh: ${statements.length}`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    // Bỏ qua các dòng comment ở đầu câu lệnh
    const cleanedStmt = stmt.replace(/--.*$/gm, '').trim();
    if (!cleanedStmt) continue;

    try {
      await connection.query(stmt);
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('Duplicate entry')) {
        // Bỏ qua các lỗi đã tồn tại dữ liệu
        continue;
      }
      console.error(`\n❌ Lỗi ở câu lệnh thứ ${i + 1}:`);
      console.error('Nội dung câu lệnh:', cleanedStmt.substring(0, 200) + '...');
      console.error('Lỗi:', error.message);
    }
  }

  await connection.end();
};

testImport();
