const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendResetEmail = async (to, resetToken) => {
  const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Khôi phục mật khẩu',
    html: `
      <h3>Yêu cầu đặt lại mật khẩu</h3>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu. Click vào link bên dưới để tiếp tục:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Gửi email thành công đến:', to);
  } catch (error) {
    console.error('❌ Gửi email thất bại:', error);
  }
};

module.exports = { sendResetEmail };
