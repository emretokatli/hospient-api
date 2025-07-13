const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { Meeting, Hotel, Organization } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const meetingValidation = [
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
  body('is_public').optional().isBoolean(),
  body('requires_approval').optional().isBoolean(),
  body('special_requirements').optional().trim(),
  body('catering_required').optional().isBoolean(),
  body('equipment_required').optional().trim(),
  body('budget').optional().isFloat({ min: 0 }),
  body('deposit_paid').optional().isBoolean(),
  body('deposit_amount').optional().isFloat({ min: 0 }),
  body('total_cost').optional().isFloat({ min: 0 }),
  body('notes').optional().trim()
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Meeting:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         hotel_id:
 *           type: integer
 *         title:
 *           type: string
 *           maxLength: 255
 *         description:
 *           type: string
 *         event_type:
 *           type: string
 *           enum: [meeting, conference, wedding, birthday, corporate_event, other]
 *         start_date:
 *           type: string
 *           format: date-time
 *         end_date:
 *           type: string
 *           format: date-time
 *         capacity:
 *           type: integer
 *         current_attendees:
 *           type: integer
 *         location:
 *           type: string
 *         organizer_name:
 *           type: string
 *         organizer_email:
 *           type: string
 *         organizer_phone:
 *           type: string
 *         status:
 *           type: string
 *           enum: [draft, confirmed, in_progress, completed, cancelled]
 *         is_public:
 *           type: boolean
 *         requires_approval:
 *           type: boolean
 *         special_requirements:
 *           type: string
 *         catering_required:
 *           type: boolean
 *         equipment_required:
 *           type: string
 *         budget:
 *           type: number
 *         deposit_paid:
 *           type: boolean
 *         deposit_amount:
 *           type: number
 *         total_cost:
 *           type: number
 *         notes:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: Get all meetings for the hotel
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, confirmed, in_progress, completed, cancelled]
 *         description: Filter by status
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
 *       - in: query
 *         name: is_public
 *         schema:
 *           type: boolean
 *         description: Filter by public visibility
 *     responses:
 *       200:
 *         description: List of meetings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Meeting'
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

    // Add other filters
    if (req.query.event_type) {
      whereClause.event_type = req.query.event_type;
    }
    if (req.query.status) {
      whereClause.status = req.query.status;
    }
    if (req.query.is_public !== undefined) {
      whereClause.is_public = req.query.is_public === 'true';
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
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['start_date', 'ASC']]
    });

    res.json(meetings);
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ message: 'Error fetching meetings' });
  }
});

/**
 * @swagger
 * /api/meetings/{id}:
 *   get:
 *     summary: Get a meeting by ID
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
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
 *               $ref: '#/components/schemas/Meeting'
 *       404:
 *         description: Meeting not found
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

    // Get all hotels for the organization
    const hotels = await Hotel.findAll({
      where: { organization_id: organization.id },
      attributes: ['id']
    });
    const hotelIds = hotels.map(h => h.id);

    const meeting = await Meeting.findOne({
      where: {
        id: req.params.id,
        hotel_id: { [Op.in]: hotelIds }
      },
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

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ message: 'Error fetching meeting' });
  }
});

/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Create a new meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
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
 *               is_public:
 *                 type: boolean
 *               requires_approval:
 *                 type: boolean
 *               special_requirements:
 *                 type: string
 *               catering_required:
 *                 type: boolean
 *               equipment_required:
 *                 type: string
 *               budget:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meeting created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Meeting'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, meetingValidation, async (req, res) => {
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

    const meeting = await Meeting.create({
      ...req.body,
      created_by: req.member.id
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

    res.status(201).json(createdMeeting);
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ message: 'Error creating meeting' });
  }
});

/**
 * @swagger
 * /api/meetings/{id}:
 *   put:
 *     summary: Update a meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meeting ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               event_type:
 *                 type: string
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
 *               status:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *               requires_approval:
 *                 type: boolean
 *               special_requirements:
 *                 type: string
 *               catering_required:
 *                 type: boolean
 *               equipment_required:
 *                 type: string
 *               budget:
 *                 type: number
 *               deposit_paid:
 *                 type: boolean
 *               deposit_amount:
 *                 type: number
 *               total_cost:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meeting updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Meeting'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, meetingValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Get all hotels for the organization
    const hotels = await Hotel.findAll({
      where: { organization_id: organization.id },
      attributes: ['id']
    });
    const hotelIds = hotels.map(h => h.id);

    const meeting = await Meeting.findOne({
      where: {
        id: req.params.id,
        hotel_id: { [Op.in]: hotelIds }
      }
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check for date conflicts (excluding current meeting)
    if (req.body.start_date && req.body.end_date && req.body.location) {
      const conflictingMeeting = await Meeting.findOne({
        where: {
          id: { [Op.ne]: req.params.id },
          hotel_id: meeting.hotel_id,
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
    }

    // If status is being changed to confirmed, set approved_by and approved_at
    if (req.body.status === 'confirmed' && meeting.status !== 'confirmed') {
      req.body.approved_by = req.member.id;
      req.body.approved_at = new Date();
    }

    await meeting.update(req.body);

    const updatedMeeting = await Meeting.findByPk(meeting.id, {
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

    res.json(updatedMeeting);
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ message: 'Error updating meeting' });
  }
});

/**
 * @swagger
 * /api/meetings/{id}:
 *   delete:
 *     summary: Delete a meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meeting ID
 *     responses:
 *       200:
 *         description: Meeting deleted successfully
 *       404:
 *         description: Meeting not found
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

    // Get all hotels for the organization
    const hotels = await Hotel.findAll({
      where: { organization_id: organization.id },
      attributes: ['id']
    });
    const hotelIds = hotels.map(h => h.id);

    const meeting = await Meeting.findOne({
      where: {
        id: req.params.id,
        hotel_id: { [Op.in]: hotelIds }
      }
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    await meeting.destroy();
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ message: 'Error deleting meeting' });
  }
});

/**
 * @swagger
 * /api/meetings/{id}/approve:
 *   post:
 *     summary: Approve a meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meeting ID
 *     responses:
 *       200:
 *         description: Meeting approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Meeting'
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Get all hotels for the organization
    const hotels = await Hotel.findAll({
      where: { organization_id: organization.id },
      attributes: ['id']
    });
    const hotelIds = hotels.map(h => h.id);

    const meeting = await Meeting.findOne({
      where: {
        id: req.params.id,
        hotel_id: { [Op.in]: hotelIds }
      }
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.status === 'confirmed') {
      return res.status(400).json({ message: 'Meeting is already approved' });
    }

    await meeting.update({
      status: 'confirmed',
      approved_by: req.member.id,
      approved_at: new Date()
    });

    const updatedMeeting = await Meeting.findByPk(meeting.id, {
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

    res.json(updatedMeeting);
  } catch (error) {
    console.error('Approve meeting error:', error);
    res.status(500).json({ message: 'Error approving meeting' });
  }
});

module.exports = router;
