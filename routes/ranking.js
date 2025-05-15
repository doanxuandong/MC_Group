const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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

// Lấy thành viên trong BXH
router.get('/:id/members', async (req, res) => {
  try {
    const rankingId = req.params.id;
    const result = await pool.query(
      `SELECT rm.*, u.full_name, u.department, u.email, u.birth_day, u.role
       FROM ranking_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.ranking_id = $1
       ORDER BY rm.position ASC`,
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
    const { name, department, category, month, year, created_by } = req.body;
    const result = await pool.query(
      `INSERT INTO rankings (name, department, category, month, year, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, department, category, month, year, created_by]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Thêm thành viên vào BXH
router.post('/:id/members', async (req, res) => {
  try {
    const rankingId = req.params.id;
    const { user_id, position, description, votes, avatar } = req.body;
    const result = await pool.query(
      `INSERT INTO ranking_members (ranking_id, user_id, position, description, votes, avatar)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [rankingId, user_id, position, description, votes || 0, avatar]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Xóa BXH
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rankings WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa BXH!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    const { name, department, category, month, year, created_by } = req.body;
    const result = await pool.query(
      `UPDATE rankings SET name=$1, department=$2, category=$3, month=$4, year=$5, created_by=$6 WHERE id=$7 RETURNING *`,
      [name, department, category, month, year, created_by, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sửa thành viên BXH
router.put('/members/:memberId', async (req, res) => {
  try {
    const { user_id, position, description, votes, avatar } = req.body;
    const result = await pool.query(
      `UPDATE ranking_members SET user_id=$1, position=$2, description=$3, votes=$4, avatar=$5 WHERE id=$6 RETURNING *`,
      [user_id, position, description, votes, avatar, req.params.memberId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 