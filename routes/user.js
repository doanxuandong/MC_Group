const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // <-- Sử dụng pool từ db.js

// Lấy danh sách user (có phân trang, lọc)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    // Lọc
    let where = [];
    let params = [];
    let idx = 1;
    if (req.query.full_name) {
      where.push(`LOWER(full_name) LIKE $${idx++}`);
      params.push(`%${req.query.full_name.toLowerCase()}%`);
    }
    if (req.query.department) {
      where.push(`department = $${idx++}`);
      params.push(req.query.department);
    }
    if (req.query.email) {
      where.push(`LOWER(email) LIKE $${idx++}`);
      params.push(`%${req.query.email.toLowerCase()}%`);
    }
    if (req.query.role) {
      where.push(`role = $${idx++}`);
      params.push(req.query.role);
    }
    let whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    // Đếm tổng
    const total = await pool.query(`SELECT COUNT(*) FROM users ${whereStr}`, params);
    // Lấy dữ liệu
    params.push(pageSize, offset);
    const result = await pool.query(
      `SELECT id, full_name, department, email, birth_day, role, created_at FROM users ${whereStr} ORDER BY id DESC LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );
    res.json({
      success: true,
      users: result.rows,
      total: parseInt(total.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Thêm user
router.post('/', async (req, res) => {
  try {
    const { full_name, department, email, password_user, birth_day, role } = req.body;
    const result = await pool.query(
      `INSERT INTO users (full_name, department, email, password_user, birth_day, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, department, email, birth_day, role, created_at`,
      [full_name, department, email, password_user, birth_day, role || 'user']
    );
    res.json({ success: true, user: result.rows[0], message: 'Thêm tài khoản thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sửa user
router.put('/:id', async (req, res) => {
  try {
    const { full_name, department, email, password_user, birth_day, role } = req.body;
    let query, params;
    if (password_user) {
      query = `UPDATE users SET full_name=$1, department=$2, email=$3, password_user=$4, birth_day=$5, role=$6 WHERE id=$7 RETURNING id, full_name, department, email, birth_day, role, created_at`;
      params = [full_name, department, email, password_user, birth_day, role, req.params.id];
    } else {
      query = `UPDATE users SET full_name=$1, department=$2, email=$3, birth_day=$4, role=$5 WHERE id=$6 RETURNING id, full_name, department, email, birth_day, role, created_at`;
      params = [full_name, department, email, birth_day, role, req.params.id];
    }
    const result = await pool.query(query, params);
    res.json({ success: true, user: result.rows[0], message: 'Cập nhật tài khoản thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Xóa user
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Xóa tài khoản thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Lấy user có email và role là admin
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2 LIMIT 1',
      [email, 'admin']
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ success: false, message: 'Sai email hoặc không phải admin!' });

    // Nếu mật khẩu lưu dạng hash:
    // const match = await bcrypt.compare(password, user.password_user);
    // Nếu mật khẩu lưu plain text:
    const match = password === user.password_user;

    if (!match) return res.status(401).json({ success: false, message: 'Sai mật khẩu!' });

    // Đăng nhập thành công
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
});

module.exports = router;

module.exports = router;