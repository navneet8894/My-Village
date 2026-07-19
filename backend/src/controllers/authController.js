const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { signToken } = require('../middleware/auth');
const { createAndSendOtp } = require('../services/otpService');

const registerValidators = [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').optional().isString(),
];

async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: 'register' });
    const { code, mail } = await createAndSendOtp(email.toLowerCase(), 'register');
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase(), purpose: 'register', code },
      {
        $set: {
          registerMeta: { name, phone: phone || '', passwordHash },
        },
      }
    );

    res.status(201).json({
      message: 'Verification code sent to your email',
      devOtp: mail.dev,
    });
  } catch (e) {
    next(e);
  }
}

const verifyOtpValidators = [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 4, max: 8 }),
];

async function verifyOtp(req, res, next) {
  try {
    const { email, code } = req.body;
    const otpDoc = await Otp.findOne({
      email: email.toLowerCase(),
      purpose: 'register',
      code,
    });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }
    const meta = otpDoc.registerMeta;
    if (!meta?.passwordHash) {
      return res.status(400).json({ message: 'Registration session expired' });
    }
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: 'register' });

    const user = await User.create({
      name: meta.name,
      email: email.toLowerCase(),
      phone: meta.phone || '',
      password: meta.passwordHash,
      isEmailVerified: true,
    });

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (e) {
    next(e);
  }
}

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +tokenVersion');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.isBanned) {
      return res.status(403).json({
        message: 'Account suspended',
        reason: user.banReason,
      });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }
    const token = signToken(user._id, user.tokenVersion);
    user.password = undefined;
    res.json({ token, user });
  } catch (e) {
    next(e);
  }
}

async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }
    const pending = await Otp.findOne({
      email: email.toLowerCase(),
      purpose: 'register',
    });
    if (!pending?.registerMeta?.passwordHash) {
      return res.status(400).json({ message: 'No pending registration for this email' });
    }
    const meta = pending.registerMeta;
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: 'register' });
    const { code, mail } = await createAndSendOtp(email.toLowerCase(), 'register');
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase(), purpose: 'register', code },
      { $set: { registerMeta: meta } }
    );
    res.json({ message: 'Code resent', devOtp: mail.dev });
  } catch (e) {
    next(e);
  }
}

const forgotPasswordValidators = [body('email').isEmail().normalizeEmail()];

async function forgotPassword(req, res, next) {
  try {
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email }).select('_id');
    let devOtp;
    if (user) {
      const result = await createAndSendOtp(email, 'reset');
      devOtp = result.mail.dev;
    }
    res.json({
      message: 'If an account exists for this email, a reset code has been sent.',
      ...(devOtp ? { devOtp } : {}),
    });
  } catch (e) {
    next(e);
  }
}

const resetPasswordValidators = [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
  body('password')
    .isLength({ min: 8 })
    .matches(/[a-z]/)
    .matches(/[A-Z]/)
    .matches(/[0-9]/)
    .withMessage('Password must be 8+ characters with uppercase, lowercase and a number'),
];

async function resetPassword(req, res, next) {
  try {
    const email = req.body.email.toLowerCase();
    const otp = await Otp.findOne({ email, purpose: 'reset', code: req.body.code });
    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }
    const user = await User.findOne({ email }).select('+password +tokenVersion');
    if (!user) {
      await Otp.deleteMany({ email, purpose: 'reset' });
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }
    user.password = await bcrypt.hash(req.body.password, 10);
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();
    await Otp.deleteMany({ email, purpose: 'reset' });
    res.json({ message: 'Password reset successful. Please sign in.' });
  } catch (e) {
    next(e);
  }
}

async function me(req, res) {
  res.json(req.user);
}

const updateProfileValidators = [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().isString(),
  body('bio').optional().isString(),
  body('address').optional().isString(),
  body('avatar').optional().isString(),
  body('villageLocation').optional().isObject(),
];

async function updateProfile(req, res, next) {
  try {
    const { name, phone, bio, address, avatar, villageLocation } = req.body;
    const u = await User.findById(req.user._id);
    if (name !== undefined) u.name = name;
    if (phone !== undefined) u.phone = phone;
    if (bio !== undefined) u.bio = bio;
    if (address !== undefined) u.address = address;
    if (avatar !== undefined) u.avatar = avatar;
    if (villageLocation !== undefined) {
      u.villageLocation = {
        ...u.villageLocation,
        ...villageLocation,
      };
    }
    await u.save();
    res.json(u);
  } catch (e) {
    next(e);
  }
}

async function registerFcmToken(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token required' });
    const u = await User.findById(req.user._id);
    const set = new Set(u.fcmTokens || []);
    set.add(token);
    u.fcmTokens = [...set].slice(-10);
    await u.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = {
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
};
