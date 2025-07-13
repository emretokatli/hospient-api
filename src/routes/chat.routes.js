/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Real-time chat endpoints
 */

/**
 * @swagger
 * /api/chat/{user}:
 *   get:
 *     summary: Get chat history for a User with optional hotel and room filters
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: user
 *         schema:
 *           type: string
 *         required: true
 *         description: User email (required)
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Hotel slug (optional)
 *       - in: query
 *         name: room
 *         schema:
 *           type: string
 *         description: Room number (optional)
 *     responses:
 *       200:
 *         description: List of chat messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   hotel_id:
 *                     type: integer
 *                   hotel_slug:
 *                     type: string
 *                   room:
 *                     type: string
 *                   user:
 *                     type: string
 *                   text:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: User email is required
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Failed to fetch messages
 */

/**
 * @swagger
 * /api/chat/admin/hotel/{hotelId}:
 *   get:
 *     summary: Get chat messages for a specific hotel (Admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Hotel ID (required)
 *       - in: query
 *         name: room
 *         schema:
 *           type: string
 *         description: Room number filter (optional)
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: User email filter (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of messages to return (default 100)
 *     responses:
 *       200:
 *         description: List of chat messages for the hotel
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   hotel_id:
 *                     type: integer
 *                   hotel_slug:
 *                     type: string
 *                   room:
 *                     type: string
 *                   user:
 *                     type: string
 *                   text:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Hotel does not belong to user's organization
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Failed to fetch messages
 */

/**
 * @swagger
 * /api/chat/admin/hotel/{hotelId}/send:
 *   post:
 *     summary: Send a chat message to a guest (Admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Hotel ID (required)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - text
 *             properties:
 *               user:
 *                 type: string
 *                 description: Guest email address
 *               text:
 *                 type: string
 *                 description: Message content
 *               room:
 *                 type: string
 *                 description: Room number (optional)
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 hotel_id:
 *                   type: integer
 *                 hotel_slug:
 *                   type: string
 *                 room:
 *                   type: string
 *                 user:
 *                   type: string
 *                 text:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input - Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Hotel does not belong to user's organization
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Failed to send message
 */

const express = require('express');
const router = express.Router();
const { ChatMessage, Hotel } = require('../models');
const authMiddleware = require('../middleware/auth.middleware');

// Get chat history for a user (email param is required), optional hotel_slug and room (query)
router.get('/:user', async (req, res) => {
  try {
    const { user } = req.params;
    const { slug, room } = req.query;
    
    // Validate required user email
    if (!user) {
      return res.status(400).json({ error: 'User email is required' });
    }
    
    // Build where clause - user is always required
    let where = { user };
    
    // Optional: Filter by hotel slug
    if (slug) {
      const hotel = await Hotel.findOne({ where: { hotel_slug: slug } });
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      where = { ...where, hotel_id: hotel.id, hotel_slug: slug };
    }
    
    // Optional: Filter by room number
    if (room) {
      where.room = room;
    }
    
    const messages = await ChatMessage.findAll({
      where,
      order: [['createdAt', 'ASC']],
      limit: 100,
    });
    
    res.json(messages);
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get chat messages for a specific hotel (Admin only)
router.get('/admin/hotel/:hotelId', authMiddleware, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { room, user, limit = 100 } = req.query;
    
    // Validate required hotel ID
    if (!hotelId) {
      return res.status(400).json({ error: 'Hotel ID is required' });
    }
    
    // Get member's organization
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Verify hotel belongs to member's organization
    const hotel = await Hotel.findOne({
      where: {
        id: hotelId,
        organization_id: organization.id
      }
    });
    
    if (!hotel) {
      return res.status(403).json({ error: 'Hotel not found or access denied' });
    }
    
    // Build where clause - hotel_id is always required
    let where = { hotel_id: hotelId };
    
    // Optional: Filter by room number
    if (room) {
      where.room = room;
    }
    
    // Optional: Filter by user email
    if (user) {
      where.user = user;
    }
    
    const messages = await ChatMessage.findAll({
      where,
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
    });
    
    res.json(messages);
  } catch (err) {
    console.error('Error fetching hotel chat messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a chat message to a guest (Admin only)
router.post('/admin/hotel/:hotelId/send', authMiddleware, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { user, text, room } = req.body;
    
    // Validate required fields
    if (!hotelId) {
      return res.status(400).json({ error: 'Hotel ID is required' });
    }
    
    if (!user) {
      return res.status(400).json({ error: 'User email is required' });
    }
    
    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    // Get member's organization
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Verify hotel belongs to member's organization
    const hotel = await Hotel.findOne({
      where: {
        id: hotelId,
        organization_id: organization.id
      }
    });
    
    if (!hotel) {
      return res.status(403).json({ error: 'Hotel not found or access denied' });
    }
    
    // Create the chat message
    const message = await ChatMessage.create({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      hotel_id: hotelId,
      hotel_slug: hotel.hotel_slug,
      room: room || null,
      user: user,
      text: text,
      createdAt: new Date(),
    });
    
    // Broadcast to user's room via WebSocket
    if (global.io) {
      global.io.to(`user:${user}`).emit('chat message', message);
      
      // Also broadcast to hotel room if hotel slug is provided
      if (hotel.hotel_slug) {
        global.io.to(`hotel:${hotel.hotel_slug}`).emit('chat message', message);
      }
    }
    
    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending chat message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
