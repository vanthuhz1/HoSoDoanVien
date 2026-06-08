const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
};

const srcDir = path.join(__dirname, 'sourcecode/frontend/src');
const files = walk(srcDir);

console.log(`Tìm thấy ${files.length} file JS/JSX để kiểm tra...`);

let updateCount = 0;
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  if (content.includes('http://localhost:5000/api')) {
    // Thay thế các đường dẫn API có subpath dạng 'http://localhost:5000/api/abc'
    content = content.replace(/'http:\/\/localhost:5000\/api\/([^']+)'/g, "(import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/$1'");
    content = content.replace(/"http:\/\/localhost:5000\/api\/([^"]+)"/g, "(import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/$1'");
    
    // Thay thế các đường dẫn API chính xác dạng 'http://localhost:5000/api'
    content = content.replace(/'http:\/\/localhost:5000\/api'/g, "import.meta.env.VITE_API_URL || 'http://localhost:5000/api'");
    content = content.replace(/"http:\/\/localhost:5000\/api"/g, "import.meta.env.VITE_API_URL || 'http://localhost:5000/api'");
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✓ Đã cập nhật: ${path.relative(__dirname, file)}`);
      updateCount++;
    }
  }
});

console.log(`🎉 Hoàn thành! Đã cập nhật ${updateCount} file.`);
