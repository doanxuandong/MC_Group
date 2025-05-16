const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');

// Cấu hình multer để lưu file vào public/avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/avatars'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Lấy danh sách bảng xếp hạng
router.get('/', async (req, res) => {
  try {
    const { department, category, month, year } = req.query;
    let query = 'SELECT * FROM rankings WHERE 1=1';
    const params = [];
    if (department) { params.push(department); query += ` AND department = $${params.length}`; }
    if (category)   { params.push(category);   query += ` AND category = $${params.length}`; }
    if (month)      { params.push(month);      query += ` AND month = $${params.length}`; }
    if (year)       { params.push(year);       query += ` AND year = $${params.length}`; }
    query += ' ORDER BY year DESC, month DESC, id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy thành viên trong BXH (KHÔNG JOIN với users)
router.get('/:id/members', async (req, res) => {
  try {
    const rankingId = req.params.id;
    const result = await pool.query(
      `SELECT * FROM ranking_members WHERE ranking_id = $1 ORDER BY position ASC`,
      [rankingId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Thêm bảng xếp hạng mới
router.post('/', async (req, res) => {
  try {
    const { category, month, year } = req.body;
    const result = await pool.query(
      `INSERT INTO rankings (category, month, year) VALUES ($1, $2, $3) RETURNING *`,
      [category, month, year]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Thêm thành viên vào BXH (có hỗ trợ upload avatar)
router.post('/:id/members', upload.single('avatar'), async (req, res) => {
  try {
    const rankingId = req.params.id;
    const { full_name, department, position, description, votes } = req.body;
    let avatar = '';
    if (req.file) {
      avatar = '/avatars/' + req.file.filename; // Đường dẫn public
    }
    const result = await pool.query(
      `INSERT INTO ranking_members (ranking_id, full_name, department, position, description, votes, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [rankingId, full_name, department, position, description, votes || 0, avatar]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Xóa BXH (xóa cả thành viên liên quan)
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM ranking_members WHERE ranking_id = $1', [req.params.id]);
    await client.query('DELETE FROM rankings WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'Đã xóa BXH!' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// Xóa thành viên BXH
router.delete('/members/:memberId', async (req, res) => {
  try {
    await pool.query('DELETE FROM ranking_members WHERE id = $1', [req.params.memberId]);
    res.json({ success: true, message: 'Đã xóa thành viên BXH!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sửa BXH
router.put('/:id', async (req, res) => {
  try {
    const { category, month, year } = req.body;
    const result = await pool.query(
      `UPDATE rankings SET category=$1, month=$2, year=$3 WHERE id=$4 RETURNING *`,
      [category, month, year, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sửa thành viên BXH (hỗ trợ upload avatar)
router.put('/members/:memberId', upload.single('avatar'), async (req, res) => {
  try {
    const { full_name, department, position, description, votes } = req.body;
    let avatar = req.body.avatar || '';
    if (req.file) {
      avatar = '/avatars/' + req.file.filename;
    }
    const result = await pool.query(
      `UPDATE ranking_members SET full_name=$1, department=$2, position=$3, description=$4, votes=$5, avatar=$6 WHERE id=$7 RETURNING *`,
      [full_name, department, position, description, votes || 0, avatar, req.params.memberId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alias endpoint cho PUT /api/ranking-members/:id
router.put('/../ranking-members/:memberId', async (req, res) => {
  try {
    const { user_id, position, description, votes, avatar } = req.body;
    const result = await pool.query(
      `UPDATE ranking_members SET user_id=$1, position=$2, description=$3, votes=$4, avatar=$5 WHERE id=$6 RETURNING *`,
      [user_id, position, description, votes, avatar, req.params.memberId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Tăng vote cho thành viên BXH (like)
router.post('/members/:memberId/like', async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const result = await pool.query(
      'UPDATE ranking_members SET votes = votes + 1 WHERE id = $1 RETURNING *',
      [memberId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy thành viên' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 