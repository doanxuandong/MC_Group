const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../config/db');
const path = require('path');

// Cấu hình lưu file đính kèm
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/feedback_files/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Lấy tất cả góp ý
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inside ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách góp ý' });
  }
});

// Thêm góp ý mới
router.post('/', upload.single('fileUpload'), async (req, res) => {
  try {
    const {
      fullname, email, phone, department,
      feedbackType, subFeedbackType, feedback
    } = req.body;
    const attachment = req.file ? req.file.filename : null;
    const result = await pool.query(
      `INSERT INTO inside
      (full_name, email, phone, department, feedback_type, sub_feedback_type, content, attachment)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [fullname, email, phone, department, feedbackType, subFeedbackType, feedback, attachment]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi gửi ý kiến' });
  }
});

// Lấy chi tiết góp ý (cho nút mắt)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inside WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết góp ý' });
  }
});

// Xóa góp ý
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM inside WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy góp ý' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Lỗi khi xóa góp ý' });
  }
});

module.exports = router;