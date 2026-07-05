const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

async function sendOtpEmail(email, code) {
  const from = process.env.SMTP_FROM || 'noreply@village.local';
  const t = getTransporter();
  if (t) {
    await t.sendMail({
      from,
      to: email,
      subject: 'Your MY VILLAGE verification code',
      text: `Your OTP is ${code}. It expires in 10 minutes.`,
    });
    return { sent: true };
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV OTP] ${email} -> ${code}`);
  }
  return { sent: false, dev: process.env.NODE_ENV !== 'production' ? code : undefined };
}

async function createAndSendOtp(email, purpose = 'register') {
  await Otp.deleteMany({ email, purpose });
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await Otp.create({ email, code, purpose, expiresAt });
  const mail = await sendOtpEmail(email, code);
  return { code, mail };
}

async function verifyOtpCode(email, code, purpose = 'register') {
  const doc = await Otp.findOne({ email, purpose, code });
  if (!doc || doc.expiresAt < new Date()) {
    return false;
  }
  await Otp.deleteMany({ email, purpose });
  return true;
}

module.exports = {
  generateCode,
  createAndSendOtp,
  verifyOtpCode,
  sendOtpEmail,
};
