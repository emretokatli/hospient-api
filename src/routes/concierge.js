// routes/concierge.js
const express = require('express');
const router  = express.Router();
const { ConciergeCategory, ConciergeRequest } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     ConciergeCategory:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID of the category
 *         parent_id:
 *           type: integer
 *           nullable: true
 *           description: ID of the parent category (for hierarchical structure)
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Name of the concierge category
 *         description:
 *           type: string
 *           description: Description of the category
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the category was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the category was last updated
 *         subCategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConciergeCategory'
 *           description: Sub-categories of this category
 *         parent:
 *           $ref: '#/components/schemas/ConciergeCategory'
 *           description: Parent category
 *     ConciergeRequest:
 *       type: object
 *       required:
 *         - hotel_id
 *         - category_id
 *         - title
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID of the request
 *         hotel_id:
 *           type: integer
 *           description: ID of the hotel this request belongs to
 *         guest_id:
 *           type: integer
 *           nullable: true
 *           description: ID of the guest making the request
 *         category_id:
 *           type: integer
 *           description: ID of the concierge category
 *         title:
 *           type: string
 *           maxLength: 255
 *           description: Title of the concierge request
 *         details:
 *           type: object
 *           description: Additional details as JSON object
 *         status:
 *           type: string
 *           enum: [requested, in_progress, done, cancelled]
 *           default: requested
 *           description: Current status of the request
 *         scheduled_for:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Scheduled date/time for the request
 *         completed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date/time when the request was completed
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the request was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the request was last updated
 *         category:
 *           $ref: '#/components/schemas/ConciergeCategory'
 *           description: Associated category information
 */

// ------- Categories -------

/**
 * @swagger
 * /api/concierge/categories:
 *   get:
 *     summary: Get all concierge categories with their sub-categories
 *     tags: [Concierge Categories]
 *     responses:
 *       200:
 *         description: List of concierge categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ConciergeCategory'
 *       500:
 *         description: Server error
 */
router.get('/categories', async (req, res) => {
  try {
    const cats = await ConciergeCategory.findAll({ include: ['subCategories'] });
    console.log('Backend - Found categories:', cats.length);
    if (cats.length > 0) {
      console.log('Backend - First category:', JSON.stringify(cats[0].toJSON(), null, 2));
    }
    res.json(cats);
  } catch (error) {
    console.error('Error fetching concierge categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

/**
 * @swagger
 * /api/concierge/categories:
 *   post:
 *     summary: Create a new concierge category
 *     tags: [Concierge Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Name of the category
 *               description:
 *                 type: string
 *                 description: Description of the category
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID of the parent category (for hierarchical structure)
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConciergeCategory'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/categories', async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const cat = await ConciergeCategory.create({ name, description, parent_id });
    res.status(201).json(cat);
  } catch (error) {
    console.error('Error creating concierge category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

// ------- Requests -------

/**
 * @swagger
 * /api/concierge/requests:
 *   get:
 *     summary: Get all concierge requests with optional filtering
 *     tags: [Concierge Requests]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: integer
 *         description: Filter requests by hotel ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [requested, in_progress, done, cancelled]
 *         description: Filter requests by status
 *     responses:
 *       200:
 *         description: List of concierge requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ConciergeRequest'
 *       500:
 *         description: Server error
 */
router.get('/requests', async (req, res) => {
  try {
    const where = {};
    if (req.query.hotel_id) where.hotel_id = req.query.hotel_id;
    if (req.query.status)   where.status   = req.query.status;
    if (req.query.category_id) where.category_id = req.query.category_id;
    if (req.query.guest_id) where.guest_id = req.query.guest_id;

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await ConciergeRequest.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    const list = await ConciergeRequest.findAll({
      where,
      include: [{ model: ConciergeCategory, attributes: ['name'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    
    console.log('Backend - Found requests:', list.length);
    if (list.length > 0) {
      console.log('Backend - First request:', JSON.stringify(list[0].toJSON(), null, 2));
    }
    
    res.json({
      data: list,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching concierge requests:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
});

/**
 * @swagger
 * /api/concierge/requests:
 *   post:
 *     summary: Create a new concierge request
 *     tags: [Concierge Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_id
 *               - category_id
 *               - title
 *             properties:
 *               hotel_id:
 *                 type: integer
 *                 description: ID of the hotel
 *               guest_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID of the guest making the request
 *               category_id:
 *                 type: integer
 *                 description: ID of the concierge category
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: Title of the request
 *               details:
 *                 type: object
 *                 description: Additional details as JSON object
 *               scheduled_for:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Scheduled date/time for the request
 *     responses:
 *       201:
 *         description: Request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConciergeRequest'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/requests', async (req, res) => {
  try {
    const data = {
      hotel_id:      req.body.hotel_id,
      guest_id:      req.body.guest_id,
      category_id:   req.body.category_id,
      title:         req.body.title,
      details:       req.body.details || {},
      scheduled_for: req.body.scheduled_for,
    };
    
    if (!data.hotel_id || !data.category_id || !data.title) {
      return res.status(400).json({ message: 'hotel_id, category_id, and title are required' });
    }
    
    const created = await ConciergeRequest.create(data);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating concierge request:', error);
    res.status(500).json({ message: 'Error creating request' });
  }
});

/**
 * @swagger
 * /api/concierge/requests/{id}:
 *   get:
 *     summary: Get a specific concierge request by ID
 *     tags: [Concierge Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the concierge request
 *     responses:
 *       200:
 *         description: Concierge request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConciergeRequest'
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.route('/requests/:id')
  .get(async (req, res) => {
    try {
      const r = await ConciergeRequest.findByPk(req.params.id, {
        include: [{ model: ConciergeCategory, attributes: ['name'] }],
      });
      if (!r) return res.status(404).json({ message: 'Not found' });
      res.json(r);
    } catch (error) {
      console.error('Error fetching concierge request:', error);
      res.status(500).json({ message: 'Error fetching request' });
    }
  })

/**
 * @swagger
 * /api/concierge/requests/{id}:
 *   put:
 *     summary: Update a concierge request
 *     tags: [Concierge Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the concierge request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               details:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [requested, in_progress, done, cancelled]
 *               scheduled_for:
 *                 type: string
 *                 format: date-time
 *               completed_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConciergeRequest'
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
  .put(async (req, res) => {
    try {
      const r = await ConciergeRequest.findByPk(req.params.id);
      if (!r) return res.status(404).json({ message: 'Not found' });
      await r.update(req.body);
      
      // Fetch the updated request with category information
      const updatedRequest = await ConciergeRequest.findByPk(req.params.id, {
        include: [{ model: ConciergeCategory, attributes: ['name'] }],
      });
      
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating concierge request:', error);
      res.status(500).json({ message: 'Error updating request' });
    }
  })

/**
 * @swagger
 * /api/concierge/requests/{id}:
 *   delete:
 *     summary: Delete a concierge request
 *     tags: [Concierge Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the concierge request
 *     responses:
 *       204:
 *         description: Request deleted successfully
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
  .delete(async (req, res) => {
    try {
      const count = await ConciergeRequest.destroy({ where: { id: req.params.id } });
      res.status(count ? 204 : 404).end();
    } catch (error) {
      console.error('Error deleting concierge request:', error);
      res.status(500).json({ message: 'Error deleting request' });
    }
  });

module.exports = router;
