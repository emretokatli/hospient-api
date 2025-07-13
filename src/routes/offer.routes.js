const express = require('express');
const router = express.Router();
const { Offer, Hotel } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Offer:
 *       type: object
 *       required:
 *         - hotel_id
 *         - title
 *         - type
 *         - valid_from
 *         - valid_until
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated unique identifier
 *         hotel_id:
 *           type: integer
 *           description: ID of the hotel this offer belongs to
 *         title:
 *           type: string
 *           description: Title of the offer
 *         description:
 *           type: string
 *           description: Detailed description of the offer
 *         type:
 *           type: string
 *           enum: [spa, restaurant, pool, activity, room, other]
 *           description: Type of offer
 *         discount_percentage:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           maximum: 100
 *           description: Percentage discount (0-100)
 *         discount_amount:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           description: Fixed discount amount
 *         original_price:
 *           type: number
 *           format: decimal
 *           description: Original price before discount
 *         discounted_price:
 *           type: number
 *           format: decimal
 *           description: Price after discount
 *         valid_from:
 *           type: string
 *           format: date-time
 *           description: Start date of offer validity
 *         valid_until:
 *           type: string
 *           format: date-time
 *           description: End date of offer validity
 *         is_active:
 *           type: boolean
 *           description: Whether the offer is currently active
 *         terms_conditions:
 *           type: string
 *           description: Terms and conditions for the offer
 *         image_url:
 *           type: string
 *           description: URL to offer image
 *         max_uses:
 *           type: integer
 *           minimum: 0
 *           description: Maximum number of times this offer can be used
 *         current_uses:
 *           type: integer
 *           minimum: 0
 *           description: Current number of times this offer has been used
 *         applicable_for:
 *           type: string
 *           enum: [guests, walkin, both]
 *           description: Who can use this offer
 *         priority:
 *           type: integer
 *           minimum: 0
 *           description: Priority order for displaying offers
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/offers:
 *   get:
 *     summary: Get all offers with optional filtering
 *     tags: [Offers]
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
 *           enum: [spa, restaurant, pool, activity, room, other]
 *         description: Filter by offer type
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: applicable_for
 *         schema:
 *           type: string
 *           enum: [guests, walkin, both]
 *         description: Filter by applicable audience
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
 *         description: List of offers
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
 *                     $ref: '#/components/schemas/Offer'
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
      hotel_id,
      type,
      is_active,
      applicable_for,
      page = 1,
      limit = 10
    } = req.query;

    const where = {};
    
    if (hotel_id) {
      where.hotel_id = hotel_id;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }
    
    if (applicable_for) {
      where.applicable_for = applicable_for;
    }

    // Add date validity filter
    const now = new Date();
    where.valid_from = { [Op.lte]: now };
    where.valid_until = { [Op.gte]: now };

    const offset = (page - 1) * limit;
    
    const { count, rows } = await Offer.findAndCountAll({
      where,
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        }
      ],
      order: [['priority', 'DESC'], ['created_at', 'DESC']],
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
    console.error('Error fetching offers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch offers'
    });
  }
});

/**
 * @swagger
 * /api/offers/{id}:
 *   get:
 *     summary: Get a specific offer by ID
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Offer ID
 *     responses:
 *       200:
 *         description: Offer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Offer'
 *       404:
 *         description: Offer not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        }
      ]
    });

    if (!offer) {
      return res.status(404).json({
        status: 'error',
        message: 'Offer not found'
      });
    }

    res.json({
      status: 'success',
      data: offer
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch offer'
    });
  }
});

/**
 * @swagger
 * /api/offers:
 *   post:
 *     summary: Create a new offer
 *     tags: [Offers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_id
 *               - title
 *               - type
 *               - valid_from
 *               - valid_until
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [spa, restaurant, pool, activity, room, other]
 *               discount_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               discount_amount:
 *                 type: number
 *                 minimum: 0
 *               original_price:
 *                 type: number
 *               discounted_price:
 *                 type: number
 *               valid_from:
 *                 type: string
 *                 format: date-time
 *               valid_until:
 *                 type: string
 *                 format: date-time
 *               is_active:
 *                 type: boolean
 *               terms_conditions:
 *                 type: string
 *               image_url:
 *                 type: string
 *               max_uses:
 *                 type: integer
 *                 minimum: 0
 *               applicable_for:
 *                 type: string
 *                 enum: [guests, walkin, both]
 *               priority:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Offer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Offer'
 *       400:
 *         description: Validation error
 */
router.post('/', async (req, res) => {
  try {
    const {
      hotel_id,
      title,
      description,
      type,
      discount_percentage,
      discount_amount,
      original_price,
      discounted_price,
      valid_from,
      valid_until,
      is_active = true,
      terms_conditions,
      image_url,
      max_uses,
      applicable_for = 'both',
      priority = 0
    } = req.body;

    // Validate required fields
    if (!hotel_id || !title || !type || !valid_from || !valid_until) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: hotel_id, title, type, valid_from, valid_until'
      });
    }

    // Validate date range
    if (new Date(valid_from) >= new Date(valid_until)) {
      return res.status(400).json({
        status: 'error',
        message: 'valid_until must be after valid_from'
      });
    }

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotel_id);
    if (!hotel) {
      return res.status(400).json({
        status: 'error',
        message: 'Hotel not found'
      });
    }

    const offer = await Offer.create({
      hotel_id,
      title,
      description,
      type,
      discount_percentage,
      discount_amount,
      original_price,
      discounted_price,
      valid_from,
      valid_until,
      is_active,
      terms_conditions,
      image_url,
      max_uses,
      applicable_for,
      priority
    });

    const createdOffer = await Offer.findByPk(offer.id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        }
      ]
    });

    res.status(201).json({
      status: 'success',
      data: createdOffer
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to create offer'
    });
  }
});

/**
 * @swagger
 * /api/offers/{id}:
 *   put:
 *     summary: Update an existing offer
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Offer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Offer'
 *     responses:
 *       200:
 *         description: Offer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Offer'
 *       404:
 *         description: Offer not found
 *       400:
 *         description: Validation error
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const offer = await Offer.findByPk(id);
    if (!offer) {
      return res.status(404).json({
        status: 'error',
        message: 'Offer not found'
      });
    }

    // Validate date range if both dates are provided
    if (updateData.valid_from && updateData.valid_until) {
      if (new Date(updateData.valid_from) >= new Date(updateData.valid_until)) {
        return res.status(400).json({
          status: 'error',
          message: 'valid_until must be after valid_from'
        });
      }
    }

    await offer.update(updateData);

    const updatedOffer = await Offer.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        }
      ]
    });

    res.json({
      status: 'success',
      data: updatedOffer
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to update offer'
    });
  }
});

/**
 * @swagger
 * /api/offers/{id}:
 *   delete:
 *     summary: Delete an offer
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Offer ID
 *     responses:
 *       200:
 *         description: Offer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       404:
 *         description: Offer not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findByPk(id);
    if (!offer) {
      return res.status(404).json({
        status: 'error',
        message: 'Offer not found'
      });
    }

    await offer.destroy();

    res.json({
      status: 'success',
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete offer'
    });
  }
});

/**
 * @swagger
 * /api/offers/hotel/{hotelId}:
 *   get:
 *     summary: Get all offers for a specific hotel
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [spa, restaurant, pool, activity, room, other]
 *         description: Filter by offer type
 *       - in: query
 *         name: applicable_for
 *         schema:
 *           type: string
 *           enum: [guests, walkin, both]
 *         description: Filter by applicable audience
 *     responses:
 *       200:
 *         description: List of offers for the hotel
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
 *                     $ref: '#/components/schemas/Offer'
 *       404:
 *         description: Hotel not found
 */
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { type, applicable_for } = req.query;

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        status: 'error',
        message: 'Hotel not found'
      });
    }

    const where = {
      hotel_id: hotelId,
      is_active: true
    };

    if (type) {
      where.type = type;
    }

    if (applicable_for) {
      where.applicable_for = applicable_for;
    }

    // Add date validity filter
    const now = new Date();
    where.valid_from = { [Op.lte]: now };
    where.valid_until = { [Op.gte]: now };

    const offers = await Offer.findAll({
      where,
      order: [['priority', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      status: 'success',
      data: offers
    });
  } catch (error) {
    console.error('Error fetching hotel offers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch hotel offers'
    });
  }
});

module.exports = router; 