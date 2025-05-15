const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../config/db');
const path = require('path');

// Cấu hình upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/news_images/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Lấy danh sách tin tức (dùng cho bảng quản lý và trang user)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, summary, image_url, author, department, created_at FROM news ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách tin tức' });
  }
});

// Lấy chi tiết tin tức
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy tin tức' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết tin tức' });
  }
});

// Thêm tin tức mới (admin)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, summary, content, author, department } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Thiếu tiêu đề hoặc nội dung' });
    }
    const image_url = req.file ? '/news_images/' + req.file.filename : null;
    const result = await pool.query(
      `INSERT INTO news (title, summary, content, image_url, author, department)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, summary, content, image_url, author, department]
    );
    res.json({ success: true, news: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi khi thêm tin tức' });
  }
});

// Sửa tin tức (admin)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, summary, content, author, department } = req.body;
    let image_url;
    if (req.file) {
      image_url = '/news_images/' + req.file.filename;
    } else {
      // Nếu không upload ảnh mới, giữ nguyên ảnh cũ
      const old = await pool.query('SELECT image_url FROM news WHERE id=$1', [req.params.id]);
      image_url = old.rows[0]?.image_url || null;
    }
    const result = await pool.query(
      `UPDATE news SET title=$1, summary=$2, content=$3, image_url=$4, author=$5, department=$6 WHERE id=$7 RETURNING *`,
      [title, summary, content, image_url, author, department, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy tin tức' });
    res.json({ success: true, news: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi khi sửa tin tức' });
  }
});

// Xóa tin tức (admin)
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM news WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy tin tức' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi khi xóa tin tức' });
  }
});

module.exports = router;