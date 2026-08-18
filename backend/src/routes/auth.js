const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Institution = require('../models/Institution');
const { protect } = require('../middleware/auth');
const { logAction } = require('../services/auditService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'credora_jwt_super_secret_production_key_2026_hv_cyb_03', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Institution, Student, Verifier, Admin)
 * @access  Public
 */
router.post('/register', async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      institutionName,
      institutionCode,
      organizationName,
      department,
      studentIdNumber,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let assignedInstitutionId = null;
    let finalInstitutionName = institutionName;

    // If registering as an institution, ensure Institution record exists
    if (role === 'institution') {
      const code = (institutionCode || name.substring(0, 4) + '-' + Math.floor(100 + Math.random() * 900)).toUpperCase();
      let institution = await Institution.findOne({ code });
      if (!institution) {
        institution = new Institution({
          name: institutionName || name,
          code,
          email: email.toLowerCase(),
          contactPerson: name,
        });
        await institution.save();
      }
      assignedInstitutionId = institution._id;
      finalInstitutionName = institution.name;
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      institutionId: assignedInstitutionId,
      institutionName: finalInstitutionName,
      organizationName: role === 'verifier' ? organizationName || name : null,
      department,
      studentIdNumber,
    });

    await user.save();

    await logAction({
      action: 'USER_REGISTER',
      actorEmail: user.email,
      actorRole: user.role,
      ipAddress: req.ip,
      details: { role: user.role, organizationName: user.organizationName },
      success: true,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
        institutionName: user.institutionName,
        organizationName: user.organizationName,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      await logAction({
        action: 'USER_LOGIN',
        actorEmail: email,
        actorRole: 'unauthenticated',
        ipAddress: req.ip,
        details: { reason: 'User not found' },
        success: false,
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAction({
        action: 'USER_LOGIN',
        actorEmail: email,
        actorRole: user.role,
        ipAddress: req.ip,
        details: { reason: 'Incorrect password' },
        success: false,
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    await logAction({
      action: 'USER_LOGIN',
      actorEmail: user.email,
      actorRole: user.role,
      ipAddress: req.ip,
      details: { role: user.role },
      success: true,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
        institutionName: user.institutionName,
        organizationName: user.organizationName,
        studentIdNumber: user.studentIdNumber,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
