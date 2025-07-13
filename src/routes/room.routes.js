const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { Room, Hotel, Organization } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const roomValidation = [
  body('hotel_id').isInt().withMessage('Hotel ID must be an integer'),
  body('room_type').notEmpty().trim().isLength({ max: 100 }).withMessage('Room type is required and must be less than 100 characters'),
  body('bed_type').notEmpty().trim().isLength({ max: 100 }).withMessage('Bed type is required and must be less than 100 characters'),
  body('features').optional().trim(),
  body('images').optional().isArray().withMessage('Images must be an array')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         hotel_id:
 *           type: integer
 *         room_type:
 *           type: string
 *           maxLength: 100
 *         bed_type:
 *           type: string
 *           maxLength: 100
 *         features:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               index:
 *                 type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms for the organization
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: integer
 *         description: Filter rooms by hotel ID
 *     responses:
 *       200:
 *         description: List of rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
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

    const whereClause = {};
    if (req.query.hotel_id) {
      whereClause.hotel_id = req.query.hotel_id;
    }

    const rooms = await Room.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
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
 *               $ref: '#/components/schemas/Room'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const room = await Room.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Error fetching room' });
  }
});

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
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
 *               - room_type
 *               - bed_type
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               room_type:
 *                 type: string
 *                 maxLength: 100
 *               bed_type:
 *                 type: string
 *                 maxLength: 100
 *               features:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     index:
 *                       type: string
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, roomValidation, async (req, res) => {
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

    // Verify that the hotel belongs to the organization
    const hotel = await Hotel.findOne({
      where: { 
        id: req.body.hotel_id,
        organization_id: organization.id 
      }
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found or does not belong to your organization' });
    }

    const room = await Room.create(req.body);
    
    const createdRoom = await Room.findByPk(room.id, {
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json(createdRoom);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Error creating room' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Update a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               room_type:
 *                 type: string
 *                 maxLength: 100
 *               bed_type:
 *                 type: string
 *                 maxLength: 100
 *               features:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     index:
 *                       type: string
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, roomValidation, async (req, res) => {
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

    const room = await Room.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // If hotel_id is being updated, verify the new hotel belongs to the organization
    if (req.body.hotel_id && req.body.hotel_id !== room.hotel_id) {
      const hotel = await Hotel.findOne({
        where: { 
          id: req.body.hotel_id,
          organization_id: organization.id 
        }
      });

      if (!hotel) {
        return res.status(404).json({ message: 'Hotel not found or does not belong to your organization' });
      }
    }

    await room.update(req.body);
    
    const updatedRoom = await Room.findByPk(room.id, {
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name']
        }
      ]
    });

    res.json(updatedRoom);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Error updating room' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Delete a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const room = await Room.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await room.destroy();
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Error deleting room' });
  }
});

module.exports = router; 