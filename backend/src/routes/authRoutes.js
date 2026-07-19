const express = require('express');
const { body } = require('express-validator');
const {
  register,
  registerValidators,
  verifyOtp,
  verifyOtpValidators,
  login,
  loginValidators,
  resendOtp,
  me,
  updateProfile,
  updateProfileValidators,
  registerFcmToken,
  forgotPassword,
  forgotPasswordValidators,
  resetPassword,
  resetPasswordValidators,
} = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerValidators, validate, register);
router.post('/verify-otp', verifyOtpValidators, validate, verifyOtp);
router.post('/resend-otp', body('email').isEmail(), validate, resendOtp);
router.post('/login', loginValidators, validate, login);
router.post('/forgot-password', forgotPasswordValidators, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidators, validate, resetPassword);
router.get('/me', authRequired, me);
router.patch('/me', authRequired, updateProfileValidators, validate, updateProfile);
router.post('/fcm-token', authRequired, body('token').notEmpty(), validate, registerFcmToken);

module.exports = router;
