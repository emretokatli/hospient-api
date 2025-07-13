const express = require('express');
const { Room, Hotel, Organization } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @swagger
 * /api/public/rooms:
 *   get:
 *     summary: Get all public rooms
 *     tags: [Public Rooms]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: integer
 *         description: Filter rooms by hotel ID
 *     responses:
 *       200:
 *         description: List of public rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   hotel_id:
 *                     type: integer
 *                   room_type:
 *                     type: string
 *                   bed_type:
 *                     type: string
 *                   features:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                         index:
 *                           type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const whereClause = {};
    if (req.query.hotel_id) {
      whereClause.hotel_id = req.query.hotel_id;
    }

    const rooms = await Room.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          include: [
            {
              model: Organization,
              attributes: ['name', 'org_slug']
            }
          ],
          attributes: ['id', 'name']
        }
      ]
    });

    res.json(rooms);
  } catch (error) {
    console.error('Get public rooms error:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

/**
 * @swagger
 * /api/public/rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Public Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 hotel_id:
 *                   type: integer
 *                 room_type:
 *                   type: string
 *                 bed_type:
 *                   type: string
 *                 features:
 *                   type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       index:
 *                         type: string
 *                 hotel:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     organization:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         org_slug:
 *                           type: string
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [
        {
          model: Hotel,
          include: [
            {
              model: Organization,
              attributes: ['name', 'org_slug']
            }
          ],
          attributes: ['id', 'name']
        }
      ]
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room by ID error:', error);
    res.status(500).json({ message: 'Error fetching room' });
  }
});

/**
 * @swagger
 * /api/public/rooms/hotel/{hotel_slug}:
 *   get:
 *     summary: Get rooms by hotel slug
 *     tags: [Public Rooms]
 *     parameters:
 *       - in: path
 *         name: hotel_slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel slug
 *     responses:
 *       200:
 *         description: Rooms for hotel retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   hotel_id:
 *                     type: integer
 *                   room_type:
 *                     type: string
 *                   bed_type:
 *                     type: string
 *                   features:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                         index:
 *                           type: string
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotel/:hotel_slug', async (req, res) => {
  try {
    const { hotel_slug } = req.params;

    // Find hotel by slug
    const hotel = await Hotel.findOne({
      where: { hotel_slug: hotel_slug },
      include: [
        {
          model: Organization,
          attributes: ['name', 'org_slug']
        }
      ]
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Get rooms for this hotel
    const rooms = await Room.findAll({
      where: { hotel_id: hotel.id }
    });

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms by hotel slug error:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

module.exports = router; 