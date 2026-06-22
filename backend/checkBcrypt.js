const bcrypt = require('bcryptjs');

const checkHash = async () => {
  const hash = '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu';
  const match = await bcrypt.compare('123456', hash);
  console.log('Mật khẩu 123456 khớp với hash:', match);
};

checkHash();
