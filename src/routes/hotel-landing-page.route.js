const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { HotelLandingPage, Hotel } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const hotelLandingPageValidation = [
  body('hotel_id').isInt().withMessage('Hotel ID must be an integer'),
  body('name').notEmpty().trim().isLength({ max: 255 }).withMessage('Name is required and must be less than 255 characters'),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
  body('images').optional().isArray().withMessage('Images must be an array')
];

// Helper function to parse images JSON
const parseImages = (landingPage) => {
  if (landingPage && landingPage.images) {
    try {
      landingPage.images = JSON.parse(landingPage.images);
    } catch (error) {
      landingPage.images = [];
    }
  }
  return landingPage;
};

// Helper function to parse images for multiple records
const parseImagesForMultiple = (landingPages) => {
  if (Array.isArray(landingPages)) {
    return landingPages.map(parseImages);
  }
  return landingPages;
};

/**
 * @swagger
 * components:
 *   schemas:
 *     HotelLandingPage:
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
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               index:
 *                 type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/hotel-landing-pages:
 *   get:
 *     summary: Get all hotel landing pages for the organization
 *     tags: [Hotel Landing Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: integer
 *         description: Filter by hotel ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of hotel landing pages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HotelLandingPage'
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

    const { hotel_id, status } = req.query;
    const whereClause = {};

    // Add filters
    if (hotel_id) {
      whereClause.hotel_id = hotel_id;
    }
    if (status) {
      whereClause.status = status;
    }

    const landingPages = await HotelLandingPage.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(parseImagesForMultiple(landingPages));
  } catch (error) {
    console.error('Get hotel landing pages error:', error);
    res.status(500).json({ message: 'Error fetching hotel landing pages' });
  }
});

/**
 * @swagger
 * /api/hotel-landing-pages/{id}:
 *   get:
 *     summary: Get hotel landing page by ID
 *     tags: [Hotel Landing Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel landing page ID
 *     responses:
 *       200:
 *         description: Hotel landing page details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelLandingPage'
 *       404:
 *         description: Hotel landing page not found
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

    const { id } = req.params;

    const landingPage = await HotelLandingPage.findOne({
      where: { id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!landingPage) {
      return res.status(404).json({ message: 'Hotel landing page not found' });
    }

    res.json(parseImages(landingPage));
  } catch (error) {
    console.error('Get hotel landing page error:', error);
    res.status(500).json({ message: 'Error fetching hotel landing page' });
  }
});

/**
 * @swagger
 * /api/hotel-landing-pages:
 *   post:
 *     summary: Create a new hotel landing page
 *     tags: [Hotel Landing Pages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_id
 *               - name
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     index:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Hotel landing page created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelLandingPage'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, hotelLandingPageValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const { hotel_id, name, description, status, images } = req.body;

    // Verify hotel belongs to organization
    const hotel = await Hotel.findOne({
      where: { 
        id: hotel_id,
        organization_id: organization.id 
      }
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found or does not belong to your organization' });
    }

    const landingPage = await HotelLandingPage.create({
      hotel_id,
      name,
      description,
      status: status || 'inactive',
      images: images ? JSON.stringify(images) : null
    });

    res.status(201).json(parseImages(landingPage));
  } catch (error) {
    console.error('Create hotel landing page error:', error);
    res.status(500).json({ message: 'Error creating hotel landing page' });
  }
});

/**
 * @swagger
 * /api/hotel-landing-pages/{id}:
 *   put:
 *     summary: Update hotel landing page
 *     tags: [Hotel Landing Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel landing page ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     index:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Hotel landing page updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelLandingPage'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Hotel landing page not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, hotelLandingPageValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const { id } = req.params;
    const { hotel_id, name, description, status, images } = req.body;

    // Find landing page and verify ownership
    const landingPage = await HotelLandingPage.findOne({
      where: { id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!landingPage) {
      return res.status(404).json({ message: 'Hotel landing page not found' });
    }

    // If hotel_id is being updated, verify the new hotel belongs to organization
    if (hotel_id && hotel_id !== landingPage.hotel_id) {
      const hotel = await Hotel.findOne({
        where: { 
          id: hotel_id,
          organization_id: organization.id 
        }
      });

      if (!hotel) {
        return res.status(404).json({ message: 'Hotel not found or does not belong to your organization' });
      }
    }

    // Update the landing page
    await landingPage.update({
      hotel_id: hotel_id || landingPage.hotel_id,
      name: name || landingPage.name,
      description: description !== undefined ? description : landingPage.description,
      status: status || landingPage.status,
      images: images !== undefined ? JSON.stringify(images) : landingPage.images
    });

    res.json(parseImages(landingPage));
  } catch (error) {
    console.error('Update hotel landing page error:', error);
    res.status(500).json({ message: 'Error updating hotel landing page' });
  }
});

/**
 * @swagger
 * /api/hotel-landing-pages/{id}:
 *   delete:
 *     summary: Delete hotel landing page
 *     tags: [Hotel Landing Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel landing page ID
 *     responses:
 *       200:
 *         description: Hotel landing page deleted successfully
 *       404:
 *         description: Hotel landing page not found
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

    const { id } = req.params;

    // Find landing page and verify ownership
    const landingPage = await HotelLandingPage.findOne({
      where: { id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!landingPage) {
      return res.status(404).json({ message: 'Hotel landing page not found' });
    }

    await landingPage.destroy();

    res.json({ message: 'Hotel landing page deleted successfully' });
  } catch (error) {
    console.error('Delete hotel landing page error:', error);
    res.status(500).json({ message: 'Error deleting hotel landing page' });
  }
});

module.exports = router;
