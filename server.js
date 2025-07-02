const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { sendResetEmail } = require('./emailService');
const User = require('./models/User');
const authenticateToken = require('./middleware/auth'); // 👈 Thêm dòng này

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Đã kết nối MongoDB'))
  .catch((err) => console.error('❌ MongoDB lỗi:', err));

// Route test server
app.get('/', (req, res) => {
  res.send('Server đang chạy!');
});

// ROUTE ĐĂNG KÝ TÀI KHOẢN
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: 'Đăng ký thành công!' });
  } catch (err) {
    console.error('❌ Lỗi khi đăng ký:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau.' });
  }
});

// ROUTE ĐĂNG NHẬP
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Đăng nhập thành công', token });
  } catch (err) {
    console.error('❌ Lỗi khi đăng nhập:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ROUTE GỬI EMAIL QUÊN MẬT KHẨU
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const fakeToken = 'abc123'; // sẽ thay bằng token thật sau

  try {
    await sendResetEmail(email, fakeToken);
    res.json({ message: '✅ Đã gửi email đặt lại mật khẩu!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Không thể gửi email' });
  }
});

// ROUTE ĐÃ ĐĂNG NHẬP MỚI XEM ĐƯỢC
app.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy ở cổng ${PORT}`);
});
