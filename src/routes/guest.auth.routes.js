const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Guest } = require('../models');

const router = express.Router();

// Guest registration validation middleware
const guestRegisterValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('first_name').notEmpty().trim(),
  body('last_name').notEmpty().trim(),
  body('phone').optional().isMobilePhone(),
  body('date_of_birth').optional().isISO8601(),
  body('nationality').optional().trim(),
  body('passport_number').optional().trim()
];

// Guest login validation middleware
const guestLoginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Guest profile update validation middleware
const guestProfileUpdateValidation = [
  body('first_name').optional().notEmpty().trim(),
  body('last_name').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('date_of_birth').optional().isISO8601(),
  body('nationality').optional().trim(),
  body('passport_number').optional().trim(),
  body('password').optional().isLength({ min: 6 })
];

/**
 * @swagger
 * /api/guest/auth/register:
 *   post:
 *     summary: Register a new guest
 *     tags: [Guest Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Guest's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Guest's password
 *               first_name:
 *                 type: string
 *                 description: Guest's first name
 *               last_name:
 *                 type: string
 *                 description: Guest's last name
 *               phone:
 *                 type: string
 *                 description: Guest's phone number
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 description: Guest's date of birth
 *               nationality:
 *                 type: string
 *                 description: Guest's nationality
 *               passport_number:
 *                 type: string
 *                 description: Guest's passport number
 *               preferences:
 *                 type: object
 *                 description: Guest preferences
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     guest:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *       400:
 *         description: Invalid input or email already registered
 *       500:
 *         description: Server error
 */
router.post('/register', guestRegisterValidation, async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      phone, 
      date_of_birth, 
      nationality, 
      passport_number,
      preferences 
    } = req.body;

    // Check if guest already exists
    const existingGuest = await Guest.findOne({ where: { email } });
    if (existingGuest) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Create guest
    const guest = await Guest.create({
      email,
      password_hash: password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      nationality,
      passport_number,
      preferences
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: guest.id, 
        email: guest.email,
        type: 'guest'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Update last login
    await guest.update({ last_login: new Date() });

    // Send success response
    return res.status(201).json({
      status: 'success',
      message: 'Guest registration successful',
      data: {
        token,
        guest: {
          id: guest.id,
          email: guest.email,
          first_name: guest.first_name,
          last_name: guest.last_name,
          phone: guest.phone,
          date_of_birth: guest.date_of_birth,
          nationality: guest.nationality,
          passport_number: guest.passport_number,
          preferences: guest.preferences
        }
      }
    });
  } catch (error) {
    console.error('Guest registration error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error during guest registration'
    });
  }
});

/**
 * @swagger
 * /api/guest/auth/login:
 *   post:
 *     summary: Login a guest
 *     tags: [Guest Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Guest's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Guest's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     guest:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', guestLoginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find guest
    const guest = await Guest.findOne({ where: { email, is_active: true } });
    if (!guest) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid credentials' 
      });
    }

    // Validate password
    const isValidPassword = await guest.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: guest.id, 
        email: guest.email,
        type: 'guest'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Update last login
    await guest.update({ last_login: new Date() });

    res.json({
      status: 'success',
      message: 'Guest login successful',
      data: {
        token,
        guest: {
          id: guest.id,
          email: guest.email,
          first_name: guest.first_name,
          last_name: guest.last_name,
          phone: guest.phone,
          date_of_birth: guest.date_of_birth,
          nationality: guest.nationality,
          passport_number: guest.passport_number,
          preferences: guest.preferences
        }
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error during guest login' 
    });
  }
});

/**
 * @swagger
 * /api/guest/auth/profile:
 *   put:
 *     summary: Update guest profile
 *     tags: [Guest Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 description: Guest's first name
 *               last_name:
 *                 type: string
 *                 description: Guest's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Guest's email address
 *               phone:
 *                 type: string
 *                 description: Guest's phone number
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 description: Guest's date of birth
 *               nationality:
 *                 type: string
 *                 description: Guest's nationality
 *               passport_number:
 *                 type: string
 *                 description: Guest's passport number
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: New password (optional)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     guest:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Guest not found
 *       500:
 *         description: Server error
 */
router.put('/profile', guestProfileUpdateValidation, async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'guest') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token type'
      });
    }

    // Find guest
    const guest = await Guest.findByPk(decoded.id);
    if (!guest) {
      return res.status(404).json({
        status: 'error',
        message: 'Guest not found'
      });
    }

    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      date_of_birth, 
      nationality, 
      passport_number,
      password 
    } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== guest.email) {
      const existingGuest = await Guest.findOne({ where: { email } });
      if (existingGuest) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already registered'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (passport_number !== undefined) updateData.passport_number = passport_number;
    
    // Handle password update if provided
    if (password) {
      updateData.password_hash = password; // The model hook will hash it
    }

    // Update guest
    await guest.update(updateData);

    // Send success response
    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        guest: {
          id: guest.id,
          email: guest.email,
          first_name: guest.first_name,
          last_name: guest.last_name,
          phone: guest.phone,
          date_of_birth: guest.date_of_birth,
          nationality: guest.nationality,
          passport_number: guest.passport_number,
          preferences: guest.preferences,
          last_login: guest.last_login
        }
      }
    });
  } catch (error) {
    console.error('Update guest profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error updating guest profile'
    });
  }
});

/**
 * @swagger
 * /api/guest/auth/profile:
 *   get:
 *     summary: Get guest profile
 *     tags: [Guest Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guest profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     guest:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'guest') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token type'
      });
    }

    const guest = await Guest.findByPk(decoded.id);
    if (!guest) {
      return res.status(404).json({
        status: 'error',
        message: 'Guest not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        guest: {
          id: guest.id,
          email: guest.email,
          first_name: guest.first_name,
          last_name: guest.last_name,
          phone: guest.phone,
          date_of_birth: guest.date_of_birth,
          nationality: guest.nationality,
          passport_number: guest.passport_number,
          preferences: guest.preferences,
          last_login: guest.last_login
        }
      }
    });
  } catch (error) {
    console.error('Get guest profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving guest profile'
    });
  }
});

module.exports = router; 