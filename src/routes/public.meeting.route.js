const express = require('express');
const { body, validationResult } = require('express-validator');
const { Meeting, Hotel, Organization } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware for public booking
const publicMeetingValidation = [
  body('title').notEmpty().trim().isLength({ max: 255 }),
  body('description').optional().trim(),
  body('event_type').isIn(['meeting', 'conference', 'wedding', 'birthday', 'corporate_event', 'other']),
  body('start_date').isISO8601().toDate(),
  body('end_date').isISO8601().toDate(),
  body('capacity').optional().isInt({ min: 1 }),
  body('location').optional().trim().isLength({ max: 255 }),
  body('organizer_name').notEmpty().trim().isLength({ max: 255 }),
  body('organizer_email').isEmail().normalizeEmail(),
  body('organizer_phone').optional().trim().isLength({ max: 50 }),
  body('special_requirements').optional().trim(),
  body('catering_required').optional().isBoolean(),
  body('equipment_required').optional().trim()
];

/**
 * @swagger
 * /api/public/meetings:
 *   get:
 *     summary: Get all public meetings for a hotel
 *     tags: [Public Meetings]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: integer
 *         description: Filter by hotel ID
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *           enum: [meeting, conference, wedding, birthday, corporate_event, other]
 *         description: Filter by event type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of public meetings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   event_type:
 *                     type: string
 *                   start_date:
 *                     type: string
 *                     format: date-time
 *                   end_date:
 *                     type: string
 *                     format: date-time
 *                   capacity:
 *                     type: integer
 *                   current_attendees:
 *                     type: integer
 *                   location:
 *                     type: string
 *                   organizer_name:
 *                     type: string
 *                   status:
 *                     type: string
 *                   hotel:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const whereClause = {
      is_public: true,
      status: { [Op.in]: ['confirmed', 'in_progress'] }
    };
    
    // Filter by hotel_id if provided
    if (req.query.hotel_id) {
      whereClause.hotel_id = req.query.hotel_id;
    }

    // Add other filters
    if (req.query.event_type) {
      whereClause.event_type = req.query.event_type;
    }
    if (req.query.start_date) {
      whereClause.start_date = { [Op.gte]: new Date(req.query.start_date) };
    }
    if (req.query.end_date) {
      whereClause.end_date = { [Op.lte]: new Date(req.query.end_date) };
    }

    const meetings = await Meeting.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              attributes: ['id', 'name', 'org_slug']
            }
          ]
        }
      ],
      order: [['start_date', 'ASC']]
    });

    res.json(meetings);
  } catch (error) {
    console.error('Get public meetings error:', error);
    res.status(500).json({ message: 'Error fetching meetings' });
  }
});

/**
 * @swagger
 * /api/public/meetings/{id}:
 *   get:
 *     summary: Get a public meeting by ID
 *     tags: [Public Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meeting ID
 *     responses:
 *       200:
 *         description: Meeting details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 event_type:
 *                   type: string
 *                 start_date:
 *                   type: string
 *                   format: date-time
 *                 end_date:
 *                   type: string
 *                   format: date-time
 *                 capacity:
 *                   type: integer
 *                 current_attendees:
 *                   type: integer
 *                 location:
 *                   type: string
 *                 organizer_name:
 *                   type: string
 *                 status:
 *                   type: string
 *                 hotel:
 *                   type: object
 *       404:
 *         description: Meeting not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      where: {
        id: req.params.id,
        is_public: true,
        status: { [Op.in]: ['confirmed', 'in_progress'] }
      },
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              attributes: ['id', 'name', 'org_slug']
            }
          ]
        }
      ]
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    console.error('Get public meeting error:', error);
    res.status(500).json({ message: 'Error fetching meeting' });
  }
});

/**
 * @swagger
 * /api/public/meetings/hotel/{hotel_slug}:
 *   get:
 *     summary: Get all public meetings for a hotel by slug
 *     tags: [Public Meetings]
 *     parameters:
 *       - in: path
 *         name: hotel_slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel slug
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *           enum: [meeting, conference, wedding, birthday, corporate_event, other]
 *         description: Filter by event type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of public meetings for the hotel
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
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
          attributes: ['id', 'name', 'org_slug']
        }
      ]
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const whereClause = {
      hotel_id: hotel.id,
      is_public: true,
      status: { [Op.in]: ['confirmed', 'in_progress'] }
    };

    // Add filters
    if (req.query.event_type) {
      whereClause.event_type = req.query.event_type;
    }
    if (req.query.start_date) {
      whereClause.start_date = { [Op.gte]: new Date(req.query.start_date) };
    }
    if (req.query.end_date) {
      whereClause.end_date = { [Op.lte]: new Date(req.query.end_date) };
    }

    const meetings = await Meeting.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              attributes: ['id', 'name', 'org_slug']
            }
          ]
        }
      ],
      order: [['start_date', 'ASC']]
    });

    res.json(meetings);
  } catch (error) {
    console.error('Get meetings by hotel slug error:', error);
    res.status(500).json({ message: 'Error fetching meetings' });
  }
});

/**
 * @swagger
 * /api/public/meetings:
 *   post:
 *     summary: Create a new meeting request (public booking)
 *     tags: [Public Meetings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - event_type
 *               - start_date
 *               - end_date
 *               - organizer_name
 *               - organizer_email
 *               - hotel_id
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               event_type:
 *                 type: string
 *                 enum: [meeting, conference, wedding, birthday, corporate_event, other]
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               capacity:
 *                 type: integer
 *               location:
 *                 type: string
 *               organizer_name:
 *                 type: string
 *               organizer_email:
 *                 type: string
 *               organizer_phone:
 *                 type: string
 *               special_requirements:
 *                 type: string
 *               catering_required:
 *                 type: boolean
 *               equipment_required:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meeting request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input or conflicting meeting
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.post('/', publicMeetingValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify the hotel exists
    const hotel = await Hotel.findByPk(req.body.hotel_id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Check for date conflicts
    const conflictingMeeting = await Meeting.findOne({
      where: {
        hotel_id: req.body.hotel_id,
        location: req.body.location,
        status: { [Op.in]: ['draft', 'confirmed', 'in_progress'] },
        [Op.or]: [
          {
            start_date: { [Op.lt]: req.body.end_date },
            end_date: { [Op.gt]: req.body.start_date }
          }
        ]
      }
    });

    if (conflictingMeeting) {
      return res.status(400).json({ 
        message: 'There is a conflicting meeting at this location and time' 
      });
    }

    // Create meeting with default values for public bookings
    const meeting = await Meeting.create({
      ...req.body,
      status: 'draft', // Public bookings start as draft and need approval
      requires_approval: true,
      is_public: false, // Initially private until approved
      created_by: null // No authenticated user for public bookings
    });

    const createdMeeting = await Meeting.findByPk(meeting.id, {
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

    res.status(201).json({
      ...createdMeeting.toJSON(),
      message: 'Meeting request submitted successfully. You will be notified once it is approved.'
    });
  } catch (error) {
    console.error('Create public meeting error:', error);
    res.status(500).json({ message: 'Error creating meeting request' });
  }
});

/**
 * @swagger
 * /api/public/meetings/availability:
 *   get:
 *     summary: Check meeting room availability
 *     tags: [Public Meetings]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *       - in: query
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting room location
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date and time
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date and time
 *     responses:
 *       200:
 *         description: Availability check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 conflicting_meetings:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.get('/availability', async (req, res) => {
  try {
    const { hotel_id, location, start_date, end_date } = req.query;

    if (!hotel_id || !location || !start_date || !end_date) {
      return res.status(400).json({ 
        message: 'Missing required parameters: hotel_id, location, start_date, end_date' 
      });
    }

    // Check for conflicting meetings
    const conflictingMeetings = await Meeting.findAll({
      where: {
        hotel_id: parseInt(hotel_id),
        location: location,
        status: { [Op.in]: ['draft', 'confirmed', 'in_progress'] },
        [Op.or]: [
          {
            start_date: { [Op.lt]: new Date(end_date) },
            end_date: { [Op.gt]: new Date(start_date) }
          }
        ]
      },
      attributes: ['id', 'title', 'start_date', 'end_date', 'status'],
      order: [['start_date', 'ASC']]
    });

    const available = conflictingMeetings.length === 0;

    res.json({
      available,
      conflicting_meetings: conflictingMeetings
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ message: 'Error checking availability' });
  }
});

module.exports = router;
