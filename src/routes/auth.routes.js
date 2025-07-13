const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Member, Organization } = require('../models');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Function to generate a random alphanumeric slug
const generateRandomSlug = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Function to get a unique slug
const getUniqueSlug = async () => {
  let slug;
  let isUnique = false;
  
  while (!isUnique) {
    slug = generateRandomSlug();
    // Check if slug exists
    const existingOrg = await Organization.findOne({
      where: { org_slug: slug }
    });
    if (!existingOrg) {
      isUnique = true;
    }
  }
  
  return slug;
};

// Register validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('first_name').notEmpty().trim(),
  body('last_name').notEmpty().trim(),
  body('organization_name').notEmpty().trim()
];

// Login validation middleware
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new member
 *     tags: [Authentication]
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
 *               - organization_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Member's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Member's password
 *               first_name:
 *                 type: string
 *                 description: Member's first name
 *               last_name:
 *                 type: string
 *                 description: Member's last name
 *               organization_name:
 *                 type: string
 *                 description: Name of the organization to create
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
 *                     member:
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
 *                     organization:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         org_slug:
 *                           type: string
 *       400:
 *         description: Invalid input or email already registered
 *       500:
 *         description: Server error
 */
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { email, password, first_name, last_name, organization_name, isMultiProperty } = req.body;

    // Check if member already exists
    const existingMember = await Member.findOne({ where: { email } });
    if (existingMember) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Create member
    const member = await Member.create({
      email,
      password_hash: password,
      first_name,
      last_name
    });

    // Generate a unique slug for the organization
    const org_slug = await getUniqueSlug();

    // Create organization
    const organization = await Organization.create({
      name: organization_name,
      org_slug: org_slug,
      isMultiProperty: isMultiProperty || false,
      member_id: member.id
    });

    // Associate member with organization
    await member.setOrganization(organization);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: member.id, 
        email: member.email,
        organizationId: organization.id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Send success response
    return res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        token,
        member: {
          id: member.id,
          email: member.email,
          first_name: member.first_name,
          last_name: member.last_name
        },
        organization: {
          id: organization.id,
          name: organization.name,
          org_slug: organization.org_slug
        }
      }
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a member
 *     tags: [Authentication]
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
 *                 description: Member's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Member's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 member:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                 organization:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find member
    const member = await Member.findOne({ where: { email } });
    if (!member) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isValidPassword = await member.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get organization
    const organization = await member.getOrganization();

    // Generate JWT token
    const token = jwt.sign(
      { id: member.id, email: member.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      member: {
        id: member.id,
        email: member.email,
        first_name: member.first_name,
        last_name: member.last_name
      },
      organization: organization ? {
        id: organization.id,
        name: organization.name
      } : null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 organization:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Get organization
    const organization = await req.member.getOrganization();
    
    res.json({
      id: req.member.id,
      email: req.member.email,
      first_name: req.member.first_name,
      last_name: req.member.last_name,
      organization: organization ? {
        id: organization.id,
        name: organization.name
      } : null
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ message: 'Error retrieving user information' });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout the current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // In a JWT-based authentication system, the client is responsible for removing the token
    // This endpoint is just for server-side logging or any cleanup if needed
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
});

module.exports = router; 