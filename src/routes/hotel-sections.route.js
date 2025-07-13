const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { HotelSections, Hotel } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const hotelSectionValidation = [
  body('hotel_id').isInt().withMessage('Hotel ID must be an integer'),
  body('title').notEmpty().trim().isLength({ max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('slug').notEmpty().trim().isLength({ max: 255 }).withMessage('Slug is required and must be less than 255 characters'),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
  body('has_button').optional().isBoolean().withMessage('Has button must be a boolean'),
  body('button_text').optional().trim().isLength({ max: 255 }).withMessage('Button text must be less than 255 characters'),
  body('button_url').optional().trim().isLength({ max: 255 }).withMessage('Button URL must be less than 255 characters'),
  body('order_index').optional().isInt().withMessage('Order index must be an integer'),
  body('images').optional().isArray().withMessage('Images must be an array')
];

// Helper function to parse images JSON
const parseImages = (section) => {
  if (section && section.images) {
    try {
      section.images = JSON.parse(section.images);
    } catch (error) {
      section.images = [];
    }
  }
  return section;
};

// Helper function to parse images for multiple records
const parseImagesForMultiple = (sections) => {
  if (Array.isArray(sections)) {
    return sections.map(parseImages);
  }
  return sections;
};

// Helper function to check slug uniqueness within a hotel
const checkSlugUniqueness = async (slug, hotelId, excludeId = null) => {
  const whereClause = {
    slug: slug,
    hotel_id: hotelId
  };
  
  if (excludeId) {
    whereClause.id = { [Op.ne]: excludeId };
  }
  
  const existingSection = await HotelSections.findOne({ where: whereClause });
  return !existingSection;
};

/**
 * @swagger
 * components:
 *   schemas:
 *     HotelSection:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         hotel_id:
 *           type: integer
 *         title:
 *           type: string
 *           maxLength: 255
 *         slug:
 *           type: string
 *           maxLength: 255
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         has_button:
 *           type: boolean
 *         button_text:
 *           type: string
 *           maxLength: 255
 *         button_url:
 *           type: string
 *           maxLength: 255
 *         order_index:
 *           type: integer
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
 * /api/hotel-sections:
 *   get:
 *     summary: Get all hotel sections for the organization
 *     tags: [Hotel Sections]
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
 *         description: List of hotel sections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HotelSection'
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

    const sections = await HotelSections.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ],
      order: [['order_index', 'ASC'], ['created_at', 'DESC']]
    });

    res.json(parseImagesForMultiple(sections));
  } catch (error) {
    console.error('Get hotel sections error:', error);
    res.status(500).json({ message: 'Error fetching hotel sections' });
  }
});

/**
 * @swagger
 * /api/hotel-sections/{id}:
 *   get:
 *     summary: Get hotel section by ID
 *     tags: [Hotel Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel section ID
 *     responses:
 *       200:
 *         description: Hotel section details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelSection'
 *       404:
 *         description: Hotel section not found
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

    const section = await HotelSections.findOne({
      where: { id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!section) {
      return res.status(404).json({ message: 'Hotel section not found' });
    }

    res.json(parseImages(section));
  } catch (error) {
    console.error('Get hotel section error:', error);
    res.status(500).json({ message: 'Error fetching hotel section' });
  }
});

/**
 * @swagger
 * /api/hotel-sections:
 *   post:
 *     summary: Create a new hotel section
 *     tags: [Hotel Sections]
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
 *               - title
 *               - slug
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               slug:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               has_button:
 *                 type: boolean
 *               button_text:
 *                 type: string
 *                 maxLength: 255
 *               button_url:
 *                 type: string
 *                 maxLength: 255
 *               order_index:
 *                 type: integer
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
 *         description: Hotel section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelSection'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Slug already exists for this hotel
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, hotelSectionValidation, async (req, res) => {
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

    const { 
      hotel_id, 
      title, 
      slug, 
      description, 
      status, 
      has_button, 
      button_text, 
      button_url, 
      order_index, 
      images 
    } = req.body;

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

    // Check slug uniqueness within the hotel
    const isSlugUnique = await checkSlugUniqueness(slug, hotel_id);
    if (!isSlugUnique) {
      return res.status(409).json({ 
        message: 'A section with this slug already exists for this hotel',
        field: 'slug'
      });
    }

    const section = await HotelSections.create({
      hotel_id,
      title,
      slug,
      description,
      status: status || 'inactive',
      has_button: has_button || false,
      button_text,
      button_url,
      order_index: order_index || 0,
      images: images ? JSON.stringify(images) : null
    });

    res.status(201).json(parseImages(section));
  } catch (error) {
    console.error('Create hotel section error:', error);
    res.status(500).json({ message: 'Error creating hotel section' });
  }
});

/**
 * @swagger
 * /api/hotel-sections/{id}:
 *   put:
 *     summary: Update hotel section
 *     tags: [Hotel Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               slug:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               has_button:
 *                 type: boolean
 *               button_text:
 *                 type: string
 *                 maxLength: 255
 *               button_url:
 *                 type: string
 *                 maxLength: 255
 *               order_index:
 *                 type: integer
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
 *         description: Hotel section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelSection'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Hotel section not found
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Slug already exists for this hotel
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, hotelSectionValidation, async (req, res) => {
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
    const { 
      hotel_id, 
      title, 
      slug, 
      description, 
      status, 
      has_button, 
      button_text, 
      button_url, 
      order_index, 
      images 
    } = req.body;

    // Find section and verify ownership
    const section = await HotelSections.findOne({
      where: { id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!section) {
      return res.status(404).json({ message: 'Hotel section not found' });
    }

    // If hotel_id is being updated, verify the new hotel belongs to organization
    if (hotel_id && hotel_id !== section.hotel_id) {
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

    // Check slug uniqueness within the hotel (excluding current section)
    if (slug && slug !== section.slug) {
      const targetHotelId = hotel_id || section.hotel_id;
      const isSlugUnique = await checkSlugUniqueness(slug, targetHotelId, id);
      if (!isSlugUnique) {
        return res.status(409).json({ 
          message: 'A section with this slug already exists for this hotel',
          field: 'slug'
        });
      }
    }

    // Update section
    await section.update({
      hotel_id: hotel_id || section.hotel_id,
      title: title || section.title,
      slug: slug || section.slug,
      description: description !== undefined ? description : section.description,
      status: status || section.status,
      has_button: has_button !== undefined ? has_button : section.has_button,
      button_text: button_text !== undefined ? button_text : section.button_text,
      button_url: button_url !== undefined ? button_url : section.button_url,
      order_index: order_index !== undefined ? order_index : section.order_index,
      images: images !== undefined ? JSON.stringify(images) : section.images
    });

    res.json(parseImages(section));
  } catch (error) {
    console.error('Update hotel section error:', error);
    res.status(500).json({ message: 'Error updating hotel section' });
  }
});

/**
 * @swagger
 * /api/hotel-sections/{id}:
 *   delete:
 *     summary: Delete hotel section
 *     tags: [Hotel Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel section ID
 *     responses:
 *       200:
 *         description: Hotel section deleted successfully
 *       404:
 *         description: Hotel section not found
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

    const section = await HotelSections.findOne({
      where: { id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!section) {
      return res.status(404).json({ message: 'Hotel section not found' });
    }

    await section.destroy();

    res.json({ message: 'Hotel section deleted successfully' });
  } catch (error) {
    console.error('Delete hotel section error:', error);
    res.status(500).json({ message: 'Error deleting hotel section' });
  }
});

module.exports = router;
