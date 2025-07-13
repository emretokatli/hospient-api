const express = require('express');
const router = express.Router();
const { Communication, Hotel } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Communication:
 *       type: object
 *       required:
 *         - hotel_id
 *         - type
 *         - title
 *         - message
 *         - sender_type
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated unique identifier
 *         hotel_id:
 *           type: integer
 *           description: ID of the hotel this communication belongs to
 *         type:
 *           type: string
 *           enum: [feedback, chat, notification, push_notification]
 *           description: Type of communication
 *         category:
 *           type: string
 *           enum: [general, service, room, restaurant, spa, activity, emergency, promotion]
 *           description: Category of the communication
 *         title:
 *           type: string
 *           description: Title of the communication
 *         message:
 *           type: string
 *           description: Main message content
 *         sender_type:
 *           type: string
 *           enum: [hotel, guest, staff]
 *           description: Type of sender
 *         sender_id:
 *           type: integer
 *           description: ID of the sender (guest_id, staff_id, or null for hotel)
 *         sender_name:
 *           type: string
 *           description: Name of the sender
 *         recipient_type:
 *           type: string
 *           enum: [guest, walkin, all, specific]
 *           description: Type of recipient
 *         recipient_id:
 *           type: integer
 *           description: Specific recipient ID if recipient_type is specific
 *         recipient_device_token:
 *           type: string
 *           description: Device token for push notifications
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *           description: Priority level
 *         status:
 *           type: string
 *           enum: [draft, sent, delivered, read, failed]
 *           description: Current status
 *         read_at:
 *           type: string
 *           format: date-time
 *           description: When the message was read
 *         delivered_at:
 *           type: string
 *           format: date-time
 *           description: When the message was delivered
 *         scheduled_at:
 *           type: string
 *           format: date-time
 *           description: Scheduled time for notifications
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: Expiration time
 *         metadata:
 *           type: object
 *           description: Additional data like images, links, actions
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating for feedback
 *         response_to_id:
 *           type: integer
 *           description: ID of the message this is replying to
 *         is_anonymous:
 *           type: boolean
 *           description: Whether the sender is anonymous
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for categorization
 *         language:
 *           type: string
 *           description: Language of the communication
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

// Helper function to parse JSON fields
const parseJsonFields = (communication) => {
  if (communication) {
    if (communication.metadata && typeof communication.metadata === 'string') {
      try {
        communication.metadata = JSON.parse(communication.metadata);
      } catch (e) {
        communication.metadata = null;
      }
    }
    if (communication.tags && typeof communication.tags === 'string') {
      try {
        communication.tags = JSON.parse(communication.tags);
      } catch (e) {
        communication.tags = null;
      }
    }
  }
  return communication;
};

// Helper function to stringify JSON fields
const stringifyJsonFields = (data) => {
  if (data.metadata && typeof data.metadata === 'object') {
    data.metadata = JSON.stringify(data.metadata);
  }
  if (data.tags && Array.isArray(data.tags)) {
    data.tags = JSON.stringify(data.tags);
  }
  return data;
};

// Helper function to send real-time notifications via WebSocket
const sendRealTimeNotification = (notification, recipientType, recipientId) => {
  try {
    const wsServer = global.notificationWebSocketServer;
    if (!wsServer) {
      console.warn('WebSocket server not available for real-time notification');
      return;
    }

    // Parse JSON fields for WebSocket transmission
    const parsedNotification = parseJsonFields(notification);

    switch (recipientType) {
      case 'guest':
        if (recipientId) {
          wsServer.sendToGuest(recipientId, parsedNotification);
        }
        break;
      case 'all':
      case 'walkin':
        wsServer.sendToAllGuests(parsedNotification);
        break;
      case 'specific':
        if (recipientId) {
          wsServer.sendToGuest(recipientId, parsedNotification);
        }
        break;
      default:
        console.warn(`Unknown recipient type: ${recipientType}`);
    }

    console.log(`Real-time notification sent via WebSocket to ${recipientType}${recipientId ? ` (ID: ${recipientId})` : ''}`);
  } catch (error) {
    console.error('Error sending real-time notification:', error);
  }
};

/**
 * @swagger
 * /api/communications:
 *   get:
 *     summary: Get all communications with optional filtering
 *     tags: [Communications]
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
 *           enum: [feedback, chat, notification, push_notification]
 *         description: Filter by communication type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [general, service, room, restaurant, spa, activity, emergency, promotion]
 *         description: Filter by category
 *       - in: query
 *         name: sender_type
 *         schema:
 *           type: string
 *           enum: [hotel, guest, staff]
 *         description: Filter by sender type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, delivered, read, failed]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         description: Filter by priority
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
 *         description: List of communications
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
 *                     $ref: '#/components/schemas/Communication'
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
      category,
      sender_type,
      status,
      priority,
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
    
    if (category) {
      where.category = category;
    }
    
    if (sender_type) {
      where.sender_type = sender_type;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }

    const offset = (page - 1) * limit;
    
    const { count, rows } = await Communication.findAndCountAll({
      where,
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        },
        {
          model: Communication,
          as: 'replies',
          include: [
            {
              model: Hotel,
              as: 'Hotel',
              attributes: ['id', 'name', 'hotel_slug']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Parse JSON fields for all communications
    const parsedRows = rows.map(row => {
      const data = row.toJSON();
      return parseJsonFields(data);
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      status: 'success',
      data: parsedRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch communications'
    });
  }
});

/**
 * @swagger
 * /api/communications/{id}:
 *   get:
 *     summary: Get a specific communication by ID
 *     tags: [Communications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Communication ID
 *     responses:
 *       200:
 *         description: Communication details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 *       404:
 *         description: Communication not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const communication = await Communication.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        },
        {
          model: Communication,
          as: 'replies',
          include: [
            {
              model: Hotel,
              as: 'Hotel',
              attributes: ['id', 'name', 'hotel_slug']
            }
          ]
        },
        {
          model: Communication,
          as: 'parent_message',
          include: [
            {
              model: Hotel,
              as: 'Hotel',
              attributes: ['id', 'name', 'hotel_slug']
            }
          ]
        }
      ]
    });

    if (!communication) {
      return res.status(404).json({
        status: 'error',
        message: 'Communication not found'
      });
    }

    const parsedCommunication = parseJsonFields(communication.toJSON());

    res.json({
      status: 'success',
      data: parsedCommunication
    });
  } catch (error) {
    console.error('Error fetching communication:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch communication'
    });
  }
});

/**
 * @swagger
 * /api/communications:
 *   post:
 *     summary: Create a new communication
 *     tags: [Communications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_id
 *               - type
 *               - title
 *               - message
 *               - sender_type
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [feedback, chat, notification, push_notification]
 *               category:
 *                 type: string
 *                 enum: [general, service, room, restaurant, spa, activity, emergency, promotion]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               sender_type:
 *                 type: string
 *                 enum: [hotel, guest, staff]
 *               sender_id:
 *                 type: integer
 *               sender_name:
 *                 type: string
 *               recipient_type:
 *                 type: string
 *                 enum: [guest, walkin, all, specific]
 *               recipient_id:
 *                 type: integer
 *               recipient_device_token:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               response_to_id:
 *                 type: integer
 *               is_anonymous:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: Communication created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 *       400:
 *         description: Validation error
 */
router.post('/', async (req, res) => {
  try {
    const {
      hotel_id,
      type,
      category = 'general',
      title,
      message,
      sender_type,
      sender_id,
      sender_name,
      recipient_type = 'all',
      recipient_id,
      recipient_device_token,
      priority = 'normal',
      scheduled_at,
      expires_at,
      metadata,
      rating,
      response_to_id,
      is_anonymous = false,
      tags,
      language = 'en'
    } = req.body;

    // Validate required fields
    if (!hotel_id || !type || !title || !message || !sender_type) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: hotel_id, type, title, message, sender_type'
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

    // Validate response_to_id if provided
    if (response_to_id) {
      const parentMessage = await Communication.findByPk(response_to_id);
      if (!parentMessage) {
        return res.status(400).json({
          status: 'error',
          message: 'Parent message not found'
        });
      }
    }

    // Set initial status based on type and scheduling
    let status = 'draft';
    if (type === 'push_notification' && !scheduled_at) {
      status = 'sent';
    } else if (scheduled_at && new Date(scheduled_at) > new Date()) {
      status = 'draft';
    } else {
      status = 'sent';
    }

    // Prepare data with JSON stringification
    const communicationData = stringifyJsonFields({
      hotel_id,
      type,
      category,
      title,
      message,
      sender_type,
      sender_id,
      sender_name,
      recipient_type,
      recipient_id,
      recipient_device_token,
      priority,
      status,
      scheduled_at,
      expires_at,
      metadata,
      rating,
      response_to_id,
      is_anonymous,
      tags,
      language
    });

    const communication = await Communication.create(communicationData);

    const createdCommunication = await Communication.findByPk(communication.id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        }
      ]
    });

    const parsedCommunication = parseJsonFields(createdCommunication.toJSON());

    // Send real-time notification for notification types
    if (type === 'notification' || type === 'push_notification') {
      sendRealTimeNotification(parsedCommunication, recipient_type, recipient_id);
    }

    res.status(201).json({
      status: 'success',
      data: parsedCommunication
    });
  } catch (error) {
    console.error('Error creating communication:', error);
    
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
      message: 'Failed to create communication'
    });
  }
});

/**
 * @swagger
 * /api/communications/{id}:
 *   put:
 *     summary: Update an existing communication
 *     tags: [Communications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Communication ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Communication'
 *     responses:
 *       200:
 *         description: Communication updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 *       404:
 *         description: Communication not found
 *       400:
 *         description: Validation error
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = stringifyJsonFields(req.body);

    const communication = await Communication.findByPk(id);
    if (!communication) {
      return res.status(404).json({
        status: 'error',
        message: 'Communication not found'
      });
    }

    await communication.update(updateData);

    const updatedCommunication = await Communication.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        }
      ]
    });

    const parsedCommunication = parseJsonFields(updatedCommunication.toJSON());

    res.json({
      status: 'success',
      data: parsedCommunication
    });

    // Send real-time notification
    sendRealTimeNotification(parsedCommunication, communication.recipient_type, communication.recipient_id);
  } catch (error) {
    console.error('Error updating communication:', error);
    
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
      message: 'Failed to update communication'
    });
  }
});

/**
 * @swagger
 * /api/communications/{id}:
 *   delete:
 *     summary: Delete a communication
 *     tags: [Communications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Communication ID
 *     responses:
 *       200:
 *         description: Communication deleted successfully
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
 *         description: Communication not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const communication = await Communication.findByPk(id);
    if (!communication) {
      return res.status(404).json({
        status: 'error',
        message: 'Communication not found'
      });
    }

    await communication.destroy();

    res.json({
      status: 'success',
      message: 'Communication deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting communication:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete communication'
    });
  }
});

/**
 * @swagger
 * /api/communications/hotel/{hotelId}:
 *   get:
 *     summary: Get all communications for a specific hotel
 *     tags: [Communications]
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
 *           enum: [feedback, chat, notification, push_notification]
 *         description: Filter by communication type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [general, service, room, restaurant, spa, activity, emergency, promotion]
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of communications for the hotel
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
 *                     $ref: '#/components/schemas/Communication'
 *       404:
 *         description: Hotel not found
 */
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { type, category } = req.query;

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        status: 'error',
        message: 'Hotel not found'
      });
    }

    const where = {
      hotel_id: hotelId
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    const communications = await Communication.findAll({
      where,
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        },
        {
          model: Communication,
          as: 'replies',
          include: [
            {
              model: Hotel,
              as: 'Hotel',
              attributes: ['id', 'name', 'hotel_slug']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Parse JSON fields for all communications
    const parsedCommunications = communications.map(comm => {
      const data = comm.toJSON();
      return parseJsonFields(data);
    });

    res.json({
      status: 'success',
      data: parsedCommunications
    });
  } catch (error) {
    console.error('Error fetching hotel communications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch hotel communications'
    });
  }
});

/**
 * @swagger
 * /api/communications/{id}/mark-read:
 *   put:
 *     summary: Mark a communication as read
 *     tags: [Communications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Communication ID
 *     responses:
 *       200:
 *         description: Communication marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 *       404:
 *         description: Communication not found
 */
router.put('/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const communication = await Communication.findByPk(id);
    if (!communication) {
      return res.status(404).json({
        status: 'error',
        message: 'Communication not found'
      });
    }

    await communication.update({
      status: 'read',
      read_at: new Date()
    });

    const updatedCommunication = await Communication.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        }
      ]
    });

    const parsedCommunication = parseJsonFields(updatedCommunication.toJSON());

    res.json({
      status: 'success',
      data: parsedCommunication
    });

    // Send real-time notification
    sendRealTimeNotification(parsedCommunication, communication.recipient_type, communication.recipient_id);
  } catch (error) {
    console.error('Error marking communication as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark communication as read'
    });
  }
});

/**
 * @swagger
 * /api/communications/feedback:
 *   post:
 *     summary: Submit feedback
 *     tags: [Communications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_id
 *               - title
 *               - message
 *               - sender_type
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               sender_type:
 *                 type: string
 *                 enum: [guest, staff]
 *               sender_id:
 *                 type: integer
 *               sender_name:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [general, service, room, restaurant, spa, activity]
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               is_anonymous:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 */
router.post('/feedback', async (req, res) => {
  try {
    const {
      hotel_id,
      title,
      message,
      sender_type,
      sender_id,
      sender_name,
      category = 'general',
      rating,
      is_anonymous = false,
      tags
    } = req.body;

    // Validate required fields
    if (!hotel_id || !title || !message || !sender_type) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: hotel_id, title, message, sender_type'
      });
    }

    // Validate sender type for feedback
    if (!['guest', 'staff'].includes(sender_type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Sender type must be guest or staff for feedback'
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

    // Prepare data with JSON stringification
    const feedbackData = stringifyJsonFields({
      hotel_id,
      type: 'feedback',
      category,
      title,
      message,
      sender_type,
      sender_id,
      sender_name: is_anonymous ? 'Anonymous' : sender_name,
      recipient_type: 'all',
      priority: 'normal',
      status: 'sent',
      rating,
      is_anonymous,
      tags,
      language: 'en'
    });

    const feedback = await Communication.create(feedbackData);

    const createdFeedback = await Communication.findByPk(feedback.id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        }
      ]
    });

    const parsedFeedback = parseJsonFields(createdFeedback.toJSON());

    res.status(201).json({
      status: 'success',
      data: parsedFeedback
    });

    // Send real-time notification
    sendRealTimeNotification(parsedFeedback, 'all', null);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
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
      message: 'Failed to submit feedback'
    });
  }
});

/**
 * @swagger
 * /api/communications/chat:
 *   post:
 *     summary: Send a chat message
 *     tags: [Communications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_id
 *               - message
 *               - sender_type
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               message:
 *                 type: string
 *               sender_type:
 *                 type: string
 *                 enum: [hotel, guest, staff]
 *               sender_id:
 *                 type: integer
 *               sender_name:
 *                 type: string
 *               recipient_type:
 *                 type: string
 *                 enum: [guest, walkin, all, specific]
 *               recipient_id:
 *                 type: integer
 *               response_to_id:
 *                 type: integer
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Chat message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 */
router.post('/chat', async (req, res) => {
  try {
    const {
      hotel_id,
      message,
      sender_type,
      sender_id,
      sender_name,
      recipient_type = 'all',
      recipient_id,
      response_to_id,
      metadata
    } = req.body;

    // Validate required fields
    if (!hotel_id || !message || !sender_type) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: hotel_id, message, sender_type'
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

    // Validate response_to_id if provided
    if (response_to_id) {
      const parentMessage = await Communication.findByPk(response_to_id);
      if (!parentMessage) {
        return res.status(400).json({
          status: 'error',
          message: 'Parent message not found'
        });
      }
    }

    // Prepare data with JSON stringification
    const chatData = stringifyJsonFields({
      hotel_id,
      type: 'chat',
      category: 'general',
      title: `Chat Message from ${sender_name || sender_type}`,
      message,
      sender_type,
      sender_id,
      sender_name,
      recipient_type,
      recipient_id,
      priority: 'normal',
      status: 'sent',
      response_to_id,
      metadata,
      language: 'en'
    });

    const chatMessage = await Communication.create(chatData);

    const createdMessage = await Communication.findByPk(chatMessage.id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        }
      ]
    });

    const parsedMessage = parseJsonFields(createdMessage.toJSON());

    res.status(201).json({
      status: 'success',
      data: parsedMessage
    });

    // Send real-time notification
    sendRealTimeNotification(parsedMessage, recipient_type, recipient_id);
  } catch (error) {
    console.error('Error sending chat message:', error);
    
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
      message: 'Failed to send chat message'
    });
  }
});

/**
 * @swagger
 * /api/communications/notifications:
 *   post:
 *     summary: Send a notification
 *     tags: [Communications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_id
 *               - title
 *               - message
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [general, service, room, restaurant, spa, activity, emergency, promotion]
 *               recipient_type:
 *                 type: string
 *                 enum: [guest, walkin, all, specific]
 *               recipient_id:
 *                 type: integer
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 */
router.post('/notifications', async (req, res) => {
  try {
    const {
      hotel_id,
      title,
      message,
      category = 'general',
      recipient_type = 'all',
      recipient_id,
      priority = 'normal',
      scheduled_at,
      expires_at,
      metadata
    } = req.body;

    // Validate required fields
    if (!hotel_id || !title || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: hotel_id, title, message'
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

    // Set status based on scheduling
    let status = 'sent';
    if (scheduled_at && new Date(scheduled_at) > new Date()) {
      status = 'draft';
    }

    // Prepare data with JSON stringification
    const notificationData = stringifyJsonFields({
      hotel_id,
      type: 'notification',
      category,
      title,
      message,
      sender_type: 'hotel',
      recipient_type,
      recipient_id,
      priority,
      status,
      scheduled_at,
      expires_at,
      metadata,
      language: 'en'
    });

    const notification = await Communication.create(notificationData);

    const createdNotification = await Communication.findByPk(notification.id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        }
      ]
    });

    const parsedNotification = parseJsonFields(createdNotification.toJSON());

    res.status(201).json({
      status: 'success',
      data: parsedNotification
    });

    // Send real-time notification
    sendRealTimeNotification(parsedNotification, recipient_type, recipient_id);
  } catch (error) {
    console.error('Error sending notification:', error);
    
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
      message: 'Failed to send notification'
    });
  }
});

/**
 * @swagger
 * /api/communications/push-notifications:
 *   post:
 *     summary: Send a push notification
 *     tags: [Communications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_id
 *               - title
 *               - message
 *               - recipient_device_token
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [general, service, room, restaurant, spa, activity, emergency, promotion]
 *               recipient_device_token:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Push notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 */
router.post('/push-notifications', async (req, res) => {
  try {
    const {
      hotel_id,
      title,
      message,
      category = 'general',
      recipient_device_token,
      priority = 'normal',
      metadata
    } = req.body;

    // Validate required fields
    if (!hotel_id || !title || !message || !recipient_device_token) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: hotel_id, title, message, recipient_device_token'
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

    // Prepare data with JSON stringification
    const pushData = stringifyJsonFields({
      hotel_id,
      type: 'push_notification',
      category,
      title,
      message,
      sender_type: 'hotel',
      recipient_type: 'specific',
      recipient_device_token,
      priority,
      status: 'sent',
      metadata,
      language: 'en'
    });

    const pushNotification = await Communication.create(pushData);

    const createdPushNotification = await Communication.findByPk(pushNotification.id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        }
      ]
    });

    const parsedPushNotification = parseJsonFields(createdPushNotification.toJSON());

    res.status(201).json({
      status: 'success',
      data: parsedPushNotification
    });

    // Send real-time notification
    sendRealTimeNotification(parsedPushNotification, 'specific', recipient_device_token.split(',')[0]);
  } catch (error) {
    console.error('Error sending push notification:', error);
    
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
      message: 'Failed to send push notification'
    });
  }
});

/**
 * @swagger
 * /api/communications/websocket/stats:
 *   get:
 *     summary: Get WebSocket connection statistics
 *     tags: [Communications]
 *     responses:
 *       200:
 *         description: WebSocket statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalConnections:
 *                       type: integer
 *                     uniqueGuests:
 *                       type: integer
 *                     guests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           guestId:
 *                             type: integer
 *                           connections:
 *                             type: integer
 */
router.get('/websocket/stats', async (req, res) => {
  try {
    const wsServer = global.notificationWebSocketServer;
    if (!wsServer) {
      return res.status(503).json({
        status: 'error',
        message: 'WebSocket server not available'
      });
    }

    const stats = wsServer.getStats();
    
    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Error getting WebSocket stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get WebSocket statistics'
    });
  }
});

/**
 * @swagger
 * /api/communications/websocket/test:
 *   post:
 *     summary: Send a test notification via WebSocket
 *     tags: [Communications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guestId
 *               - message
 *             properties:
 *               guestId:
 *                 type: integer
 *                 description: Guest ID to send test notification to
 *               message:
 *                 type: string
 *                 description: Test message content
 *     responses:
 *       200:
 *         description: Test notification sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post('/websocket/test', async (req, res) => {
  try {
    const { guestId, message } = req.body;

    if (!guestId || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'guestId and message are required'
      });
    }

    const wsServer = global.notificationWebSocketServer;
    if (!wsServer) {
      return res.status(503).json({
        status: 'error',
        message: 'WebSocket server not available'
      });
    }

    const testNotification = {
      id: Date.now(),
      hotel_id: 1,
      type: 'notification',
      category: 'general',
      title: 'Test Notification',
      message: message,
      sender_type: 'hotel',
      recipient_type: 'guest',
      recipient_id: guestId,
      priority: 'normal',
      status: 'sent',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    wsServer.sendToGuest(guestId, testNotification);

    res.json({
      status: 'success',
      message: `Test notification sent to guest ${guestId}`
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send test notification'
    });
  }
});

module.exports = router; 