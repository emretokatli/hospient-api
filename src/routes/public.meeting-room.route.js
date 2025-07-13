const express = require('express');
const { MeetingRoom, Hotel, Organization } = require('../models');

const router = express.Router();

/**
 * @swagger
 * /api/public/meeting-rooms:
 *   get:
 *     summary: Get all meeting rooms for a hotel (public)
 *     tags: [Public Meeting Rooms]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: List of meeting rooms
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
 *                   name:
 *                     type: string
 *                   capacity:
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
 *       400:
 *         description: Missing hotel_id parameter
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { hotel_id } = req.query;

    if (!hotel_id) {
      return res.status(400).json({ message: 'hotel_id parameter is required' });
    }

    // Verify the hotel exists
    const hotel = await Hotel.findByPk(hotel_id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const meetingRooms = await MeetingRoom.findAll({
      where: { hotel_id: parseInt(hotel_id) },
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
    console.error('Get public meeting rooms error:', error);
    res.status(500).json({ message: 'Error fetching meeting rooms' });
  }
});

/**
 * @swagger
 * /api/public/meeting-rooms/{id}:
 *   get:
 *     summary: Get a meeting room by ID (public)
 *     tags: [Public Meeting Rooms]
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
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 hotel_id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 capacity:
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
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Meeting room not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const meetingRoom = await MeetingRoom.findByPk(req.params.id, {
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
    console.error('Get public meeting room error:', error);
    res.status(500).json({ message: 'Error fetching meeting room' });
  }
});

module.exports = router; 