const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '../sqldoanphanmemscrip.sql');
let sql = fs.readFileSync(sqlPath, 'utf8');

// Xem các dòng đầu
console.log('--- 20 dòng đầu gốc ---');
console.log(sql.split('\n').slice(0, 20).join('\n'));

// Clean
sql = sql
  .replace(/DROP DATABASE IF EXISTS QUAN_LY_DOAN_VIEN;/gi, '')
  .replace(/CREATE DATABASE QUAN_LY_DOAN_VIEN[\s\S]*?;/gi, '')
  .replace(/USE QUAN_LY_DOAN_VIEN;/gi, '');

console.log('\n--- 20 dòng đầu sau khi clean ---');
console.log(sql.split('\n').slice(0, 20).join('\n'));
