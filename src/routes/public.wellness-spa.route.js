const express = require('express');
const { WellnessSpa, Hotel } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @swagger
 * /api/public/wellness-spa:
 *   get:
 *     summary: Get all active wellness & spa services (public access)
 *     tags: [Public Wellness & Spa]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: integer
 *         description: Filter services by hotel ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by service type
 *     responses:
 *       200:
 *         description: List of wellness & spa services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WellnessSpa'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { hotel_id, type } = req.query;
    
    const whereClause = {
      is_active: true
    };

    if (hotel_id) {
      whereClause.hotel_id = hotel_id;
    }

    if (type) {
      whereClause.type = type;
    }

    const wellnessSpaServices = await WellnessSpa.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name', 'hotel_slug']
        }
      ],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    res.json(wellnessSpaServices);
  } catch (error) {
    console.error('Get public wellness spa services error:', error);
    res.status(500).json({ message: 'Error fetching wellness spa services' });
  }
});

/**
 * @swagger
 * /api/public/wellness-spa/types:
 *   get:
 *     summary: Get available wellness & spa service types (public access)
 *     tags: [Public Wellness & Spa]
 *     responses:
 *       200:
 *         description: List of available service types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Server error
 */
router.get('/types', async (req, res) => {
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
    console.error('Get public wellness spa types error:', error);
    res.status(500).json({ message: 'Error fetching wellness spa types' });
  }
});

/**
 * @swagger
 * /api/public/wellness-spa/hotel/{hotel_slug}:
 *   get:
 *     summary: Get all wellness & spa services for a specific hotel by slug (public access)
 *     tags: [Public Wellness & Spa]
 *     parameters:
 *       - in: path
 *         name: hotel_slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel slug
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by service type
 *     responses:
 *       200:
 *         description: List of wellness & spa services for the hotel
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WellnessSpa'
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotel/:hotel_slug', async (req, res) => {
  try {
    const { hotel_slug } = req.params;
    const { type } = req.query;

    // Find hotel by slug
    const hotel = await Hotel.findOne({
      where: { hotel_slug: hotel_slug }
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const whereClause = {
      hotel_id: hotel.id,
      is_active: true
    };

    if (type) {
      whereClause.type = type;
    }

    const wellnessSpaServices = await WellnessSpa.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name', 'hotel_slug']
        }
      ],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    res.json(wellnessSpaServices);
  } catch (error) {
    console.error('Get public wellness spa services by hotel error:', error);
    res.status(500).json({ message: 'Error fetching wellness spa services' });
  }
});

/**
 * @swagger
 * /api/public/wellness-spa/{id}:
 *   get:
 *     summary: Get wellness & spa service by ID (public access)
 *     tags: [Public Wellness & Spa]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wellness & Spa service ID
 *       - in: query
 *         name: hotel_slug
 *         schema:
 *           type: string
 *         description: Hotel slug for verification
 *     responses:
 *       200:
 *         description: Wellness & spa service details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WellnessSpa'
 *       404:
 *         description: Wellness & spa service not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const { hotel_slug } = req.query;
    
    if (!hotel_slug) {
      return res.status(400).json({ message: 'Hotel slug is required' });
    }

    // Find hotel by slug
    const hotel = await Hotel.findOne({
      where: { hotel_slug: hotel_slug }
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const wellnessSpaService = await WellnessSpa.findOne({
      where: { 
        id: req.params.id,
        hotel_id: hotel.id,
        is_active: true
      },
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name', 'hotel_slug']
        }
      ]
    });

    if (!wellnessSpaService) {
      return res.status(404).json({ message: 'Wellness & spa service not found' });
    }

    res.json(wellnessSpaService);
  } catch (error) {
    console.error('Get public wellness spa service error:', error);
    res.status(500).json({ message: 'Error fetching wellness spa service' });
  }
});

module.exports = router; 