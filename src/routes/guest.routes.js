const express = require('express');
const router = express.Router();
const { Guest } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Guest:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated unique identifier
 *         email:
 *           type: string
 *           format: email
 *           description: Guest's email address
 *         first_name:
 *           type: string
 *           description: Guest's first name
 *         last_name:
 *           type: string
 *           description: Guest's last name
 *         phone:
 *           type: string
 *           description: Guest's phone number
 *         date_of_birth:
 *           type: string
 *           format: date
 *           description: Guest's date of birth
 *         nationality:
 *           type: string
 *           description: Guest's nationality
 *         passport_number:
 *           type: string
 *           description: Guest's passport number
 *         preferences:
 *           type: object
 *           description: Guest preferences
 *         is_active:
 *           type: boolean
 *           description: Whether the guest account is active
 *         last_login:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/guests:
 *   get:
 *     summary: Get all guests with optional filtering
 *     tags: [Guests]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of guests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Guest'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', async (req, res) => {
  try {
    const {
      search,
      is_active,
      page = 1,
      limit = 20
    } = req.query;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const offset = (page - 1) * limit;
    
    const { count, rows } = await Guest.findAndCountAll({
      where,
      attributes: [
        'id', 
        'email', 
        'first_name', 
        'last_name', 
        'phone', 
        'date_of_birth', 
        'nationality', 
        'passport_number', 
        'preferences', 
        'is_active', 
        'last_login', 
        'created_at', 
        'updated_at'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      status: 'success',
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch guests'
    });
  }
});

/**
 * @swagger
 * /api/guests/{id}:
 *   get:
 *     summary: Get a specific guest by ID
 *     tags: [Guests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Guest ID
 *     responses:
 *       200:
 *         description: Guest details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Guest'
 *       404:
 *         description: Guest not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const guest = await Guest.findByPk(id, {
      attributes: [
        'id', 
        'email', 
        'first_name', 
        'last_name', 
        'phone', 
        'date_of_birth', 
        'nationality', 
        'passport_number', 
        'preferences', 
        'is_active', 
        'last_login', 
        'created_at', 
        'updated_at'
      ]
    });

    if (!guest) {
      return res.status(404).json({
        status: 'error',
        message: 'Guest not found'
      });
    }

    res.json({
      status: 'success',
      data: guest
    });
  } catch (error) {
    console.error('Error fetching guest:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch guest'
    });
  }
});

module.exports = router; 