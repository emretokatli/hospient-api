const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { WellnessSpa, Hotel, Organization } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const wellnessSpaValidation = [
  body('hotel_id').isInt().withMessage('Hotel ID must be an integer'),
  body('name').notEmpty().trim().isLength({ max: 255 }).withMessage('Name is required and must be less than 255 characters'),
  body('description').optional().trim(),
  body('type').notEmpty().trim().isLength({ max: 100 }).withMessage('Type is required and must be less than 100 characters'),
  body('features').optional().trim(),
  body('working_hours').optional().isObject().withMessage('Working hours must be an object'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  body('sort_order').optional().isInt().withMessage('sort_order must be an integer')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     WellnessSpa:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         hotel_id:
 *           type: integer
 *         name:
 *           type: string
 *           maxLength: 255
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           maxLength: 100
 *         features:
 *           type: string
 *         working_hours:
 *           type: object
 *           properties:
 *             monday:
 *               type: object
 *               properties:
 *                 open:
 *                   type: string
 *                   format: date-time
 *                 close:
 *                   type: string
 *                   format: date-time
 *             tuesday:
 *               type: object
 *               properties:
 *                 open:
 *                   type: string
 *                   format: date-time
 *                 close:
 *                   type: string
 *                   format: date-time
 *             wednesday:
 *               type: object
 *               properties:
 *                 open:
 *                   type: string
 *                   format: date-time
 *                 close:
 *                   type: string
 *                   format: date-time
 *             thursday:
 *               type: object
 *               properties:
 *                 open:
 *                   type: string
 *                   format: date-time
 *                 close:
 *                   type: string
 *                   format: date-time
 *             friday:
 *               type: object
 *               properties:
 *                 open:
 *                   type: string
 *                   format: date-time
 *                 close:
 *                   type: string
 *                   format: date-time
 *             saturday:
 *               type: object
 *               properties:
 *                 open:
 *                   type: string
 *                   format: date-time
 *                 close:
 *                   type: string
 *                   format: date-time
 *             sunday:
 *               type: object
 *               properties:
 *                 open:
 *                   type: string
 *                   format: date-time
 *                 close:
 *                   type: string
 *                   format: date-time
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               index:
 *                 type: string
 *         is_active:
 *           type: boolean
 *         sort_order:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/wellness-spa:
 *   get:
 *     summary: Get all wellness & spa services for the organization
 *     tags: [Wellness & Spa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: integer
 *         description: Filter by hotel ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by service type
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of wellness & spa services retrieved successfully
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
 *                     $ref: '#/components/schemas/WellnessSpa'
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const { hotel_id, type, is_active, page = 1, limit = 20 } = req.query;
    const whereClause = {};

    // Build where clause based on filters
    if (hotel_id) {
      whereClause.hotel_id = hotel_id;
    }
    if (type) {
      whereClause.type = type;
    }
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: wellnessSpaServices } = await WellnessSpa.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    const response = {
      status: 'success',
      data: wellnessSpaServices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: totalPages
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wellness spa services' });
  }
});

/**
 * @swagger
 * /api/wellness-spa/{id}:
 *   get:
 *     summary: Get wellness & spa service by ID
 *     tags: [Wellness & Spa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wellness & Spa service ID
 *     responses:
 *       200:
 *         description: Wellness & spa service details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WellnessSpa'
 *       404:
 *         description: Wellness & spa service not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const wellnessSpaService = await WellnessSpa.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!wellnessSpaService) {
      return res.status(404).json({ message: 'Wellness & spa service not found' });
    }

    res.json(wellnessSpaService);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wellness spa service' });
  }
});

/**
 * @swagger
 * /api/wellness-spa:
 *   post:
 *     summary: Create a new wellness & spa service
 *     tags: [Wellness & Spa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WellnessSpa'
 *     responses:
 *       201:
 *         description: Wellness & spa service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WellnessSpa'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, wellnessSpaValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Verify hotel belongs to organization
    const hotel = await Hotel.findOne({
      where: { 
        id: req.body.hotel_id,
        organization_id: organization.id 
      }
    });

    if (!hotel) {
      return res.status(400).json({ message: 'Hotel not found or does not belong to your organization' });
    }

    const wellnessSpaService = await WellnessSpa.create(req.body);
    
    const createdService = await WellnessSpa.findByPk(wellnessSpaService.id, {
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json(createdService);
  } catch (error) {
    res.status(500).json({ message: 'Error creating wellness spa service' });
  }
});

/**
 * @swagger
 * /api/wellness-spa/{id}:
 *   put:
 *     summary: Update a wellness & spa service
 *     tags: [Wellness & Spa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wellness & Spa service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WellnessSpa'
 *     responses:
 *       200:
 *         description: Wellness & spa service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WellnessSpa'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Wellness & spa service not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, wellnessSpaValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const wellnessSpaService = await WellnessSpa.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id }
        }
      ]
    });

    if (!wellnessSpaService) {
      return res.status(404).json({ message: 'Wellness & spa service not found' });
    }

    // If hotel_id is being updated, verify the new hotel belongs to organization
    if (req.body.hotel_id && req.body.hotel_id !== wellnessSpaService.hotel_id) {
      const hotel = await Hotel.findOne({
        where: { 
          id: req.body.hotel_id,
          organization_id: organization.id 
        }
      });

      if (!hotel) {
        return res.status(400).json({ message: 'Hotel not found or does not belong to your organization' });
      }
    }

    await wellnessSpaService.update(req.body);
    
    const updatedService = await WellnessSpa.findByPk(req.params.id, {
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name']
        }
      ]
    });

    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ message: 'Error updating wellness spa service' });
  }
});

/**
 * @swagger
 * /api/wellness-spa/{id}:
 *   delete:
 *     summary: Delete a wellness & spa service
 *     tags: [Wellness & Spa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wellness & Spa service ID
 *     responses:
 *       200:
 *         description: Wellness & spa service deleted successfully
 *       404:
 *         description: Wellness & spa service not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const wellnessSpaService = await WellnessSpa.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id }
        }
      ]
    });

    if (!wellnessSpaService) {
      return res.status(404).json({ message: 'Wellness & spa service not found' });
    }

    await wellnessSpaService.destroy();
    res.json({ message: 'Wellness & spa service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting wellness spa service' });
  }
});

/**
 * @swagger
 * /api/wellness-spa/types:
 *   get:
 *     summary: Get available wellness & spa service types
 *     tags: [Wellness & Spa]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available service types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/types', authMiddleware, async (req, res) => {
  try {
    const types = [
      'spa',
      'wellness_center',
      'fitness_center',
      'massage_therapy',
      'package',
      'beauty_treatment',
      'meditation_room',
      'yoga_studio',
      'sauna',
      'steam_room',
      'jacuzzi',
      'swimming_pool',
      'gym',
      'personal_training',
      'nutrition_consultation'
    ];

    res.json(types);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wellness spa types' });
  }
});

module.exports = router;
