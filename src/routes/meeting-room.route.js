const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { MeetingRoom, Hotel, Organization } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const meetingRoomValidation = [
  body('name').notEmpty().trim().isLength({ max: 255 }),
  body('capacity').optional().trim().isLength({ max: 100 }),
  body('features').optional().trim(),
  body('images').optional().isArray()
];

/**
 * @swagger
 * components:
 *   schemas:
 *     MeetingRoom:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         hotel_id:
 *           type: integer
 *         name:
 *           type: string
 *           maxLength: 255
 *         capacity:
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
 * /api/meeting-rooms:
 *   get:
 *     summary: Get all meeting rooms for the hotel
 *     tags: [Meeting Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: integer
 *         description: Filter by hotel ID
 *     responses:
 *       200:
 *         description: List of meeting rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MeetingRoom'
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
    
    // Filter by hotel_id if provided
    if (req.query.hotel_id) {
      whereClause.hotel_id = req.query.hotel_id;
    } else {
      // Get all hotels for the organization
      const hotels = await Hotel.findAll({
        where: { organization_id: organization.id },
        attributes: ['id']
      });
      whereClause.hotel_id = { [Op.in]: hotels.map(h => h.id) };
    }

    const meetingRooms = await MeetingRoom.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['name', 'ASC']]
    });

    // Parse images field for each meeting room to ensure it's an array
    const processedMeetingRooms = meetingRooms.map(meetingRoom => {
      const plainMeetingRoom = meetingRoom.get({ plain: true });
      return {
        ...plainMeetingRoom,
        images: plainMeetingRoom.images ? 
          (typeof plainMeetingRoom.images === 'string' ? JSON.parse(plainMeetingRoom.images) : plainMeetingRoom.images) 
          : []
      };
    });

    res.json(processedMeetingRooms);
  } catch (error) {
    console.error('Get meeting rooms error:', error);
    res.status(500).json({ message: 'Error fetching meeting rooms' });
  }
});

/**
 * @swagger
 * /api/meeting-rooms/{id}:
 *   get:
 *     summary: Get a meeting room by ID
 *     tags: [Meeting Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meeting room ID
 *     responses:
 *       200:
 *         description: Meeting room details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeetingRoom'
 *       404:
 *         description: Meeting room not found
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

    const meetingRoom = await MeetingRoom.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!meetingRoom) {
      return res.status(404).json({ message: 'Meeting room not found' });
    }

    // Parse images field to ensure it's an array
    const plainMeetingRoom = meetingRoom.get({ plain: true });
    const processedMeetingRoom = {
      ...plainMeetingRoom,
      images: plainMeetingRoom.images ? 
        (typeof plainMeetingRoom.images === 'string' ? JSON.parse(plainMeetingRoom.images) : plainMeetingRoom.images) 
        : []
    };

    res.json(processedMeetingRoom);
  } catch (error) {
    console.error('Get meeting room error:', error);
    res.status(500).json({ message: 'Error fetching meeting room' });
  }
});

/**
 * @swagger
 * /api/meeting-rooms:
 *   post:
 *     summary: Create a new meeting room
 *     tags: [Meeting Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - hotel_id
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               capacity:
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
 *         description: Meeting room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeetingRoom'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, meetingRoomValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Verify the hotel belongs to the organization
    const hotel = await Hotel.findOne({
      where: {
        id: req.body.hotel_id,
        organization_id: organization.id
      }
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const meetingRoom = await MeetingRoom.create(req.body);

    const createdMeetingRoom = await MeetingRoom.findByPk(meetingRoom.id, {
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    // Parse images field to ensure it's an array
    const plainCreatedMeetingRoom = createdMeetingRoom.get({ plain: true });
    const processedCreatedMeetingRoom = {
      ...plainCreatedMeetingRoom,
      images: plainCreatedMeetingRoom.images ? 
        (typeof plainCreatedMeetingRoom.images === 'string' ? JSON.parse(plainCreatedMeetingRoom.images) : plainCreatedMeetingRoom.images) 
        : []
    };

    res.status(201).json(processedCreatedMeetingRoom);
  } catch (error) {
    console.error('Create meeting room error:', error);
    res.status(500).json({ message: 'Error creating meeting room' });
  }
});

/**
 * @swagger
 * /api/meeting-rooms/{id}:
 *   put:
 *     summary: Update a meeting room
 *     tags: [Meeting Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meeting room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               capacity:
 *                 type: string
 *               features:
 *                 type: string
 *               images:
 *                 type: array
 *     responses:
 *       200:
 *         description: Meeting room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeetingRoom'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Meeting room not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, meetingRoomValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const meetingRoom = await MeetingRoom.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!meetingRoom) {
      return res.status(404).json({ message: 'Meeting room not found' });
    }

    await meetingRoom.update(req.body);

    const updatedMeetingRoom = await MeetingRoom.findByPk(meetingRoom.id, {
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    // Parse images field to ensure it's an array
    const plainUpdatedMeetingRoom = updatedMeetingRoom.get({ plain: true });
    const processedUpdatedMeetingRoom = {
      ...plainUpdatedMeetingRoom,
      images: plainUpdatedMeetingRoom.images ? 
        (typeof plainUpdatedMeetingRoom.images === 'string' ? JSON.parse(plainUpdatedMeetingRoom.images) : plainUpdatedMeetingRoom.images) 
        : []
    };

    res.json(processedUpdatedMeetingRoom);
  } catch (error) {
    console.error('Update meeting room error:', error);
    res.status(500).json({ message: 'Error updating meeting room' });
  }
});

/**
 * @swagger
 * /api/meeting-rooms/{id}:
 *   delete:
 *     summary: Delete a meeting room
 *     tags: [Meeting Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meeting room ID
 *     responses:
 *       200:
 *         description: Meeting room deleted successfully
 *       404:
 *         description: Meeting room not found
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

    const meetingRoom = await MeetingRoom.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!meetingRoom) {
      return res.status(404).json({ message: 'Meeting room not found' });
    }

    await meetingRoom.destroy();

    res.json({ message: 'Meeting room deleted successfully' });
  } catch (error) {
    console.error('Delete meeting room error:', error);
    res.status(500).json({ message: 'Error deleting meeting room' });
  }
});

module.exports = router; 