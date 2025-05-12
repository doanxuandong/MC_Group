const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../config/db');
const path = require('path');

// Cấu hình nơi lưu file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/image/'); // Lưu vào thư mục public/image/
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Kiểm tra file upload
const fileFilter = (req, file, cb) => {
  // Chỉ chấp nhận file ảnh
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

// Lấy tất cả banner
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM banners ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách banner' });
  }
});

// Thêm banner (với upload file)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn ảnh banner' });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập tiêu đề banner' });
    }

    const image_url = '/image/' + req.file.filename;
    const result = await pool.query(
      'INSERT INTO banners (title, image_url) VALUES ($1, $2) RETURNING *',
      [title, image_url]
    );
    res.json({ success: true, banner: result.rows[0] });
  } catch (error) {
    console.error('Error adding banner:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi thêm banner' });
  }
});

// Sửa banner (cho phép sửa cả tiêu đề và ảnh)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    let title, image_url;
    if (req.file) {
      // Nếu có file upload (FormData)
      title = req.body.title;
      image_url = '/image/' + req.file.filename;
    } else {
      // Nếu không có file upload (JSON)
      title = req.body.title;
      image_url = req.body.image_url;
    }
    if (!title) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập tiêu đề banner' });
    }
    const result = await pool.query(
      'UPDATE banners SET title=$1, image_url=$2 WHERE id=$3 RETURNING *',
      [title, image_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy banner' });
    }
    res.json({ success: true, banner: result.rows[0] });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi cập nhật banner' });
  }
});

// Xóa banner
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM banners WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy banner' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Lỗi khi xóa banner' });
  }
});

module.exports = router;