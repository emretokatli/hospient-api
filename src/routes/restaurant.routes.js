const express = require('express');
const router = express.Router();
const { Restaurant, Organization, Hotel } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkingHours:
 *       type: object
 *       properties:
 *         monday:
 *           type: object
 *           properties:
 *             open:
 *               type: string
 *               format: time
 *             close:
 *               type: string
 *               format: time
 *         tuesday:
 *           type: object
 *           properties:
 *             open:
 *               type: string
 *               format: time
 *             close:
 *               type: string
 *               format: time
 *         wednesday:
 *           type: object
 *           properties:
 *             open:
 *               type: string
 *               format: time
 *             close:
 *               type: string
 *               format: time
 *         thursday:
 *           type: object
 *           properties:
 *             open:
 *               type: string
 *               format: time
 *             close:
 *               type: string
 *               format: time
 *         friday:
 *           type: object
 *           properties:
 *             open:
 *               type: string
 *               format: time
 *             close:
 *               type: string
 *               format: time
 *         saturday:
 *           type: object
 *           properties:
 *             open:
 *               type: string
 *               format: time
 *             close:
 *               type: string
 *               format: time
 *         sunday:
 *           type: object
 *           properties:
 *             open:
 *               type: string
 *               format: time
 *             close:
 *               type: string
 *               format: time
 *     Restaurant:
 *       type: object
 *       required:
 *         - organization_id
 *         - hotel_id
 *         - name
 *         - service_type
 *         - working_hours
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID of the restaurant
 *         organization_id:
 *           type: integer
 *           description: ID of the organization this restaurant belongs to
 *         hotel_id:
 *           type: integer
 *           description: ID of the hotel this restaurant belongs to
 *         name:
 *           type: string
 *           description: Name of the restaurant
 *         service_type:
 *           type: string
 *           description: Type of service offered (e.g., "Fine Dining", "Buffet", "Cafe")
 *         working_hours:
 *           $ref: '#/components/schemas/WorkingHours'
 *         image:
 *           type: string
 *           description: Image URL or base64 data for the restaurant
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the restaurant was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the restaurant was last updated
 */

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     summary: Get all restaurants
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.findAll({
      include: [
        { model: Organization, attributes: ['name'] },
        { model: Hotel, attributes: ['name'] }
      ]
    });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     summary: Get a restaurant by ID
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      include: [
        { model: Organization, attributes: ['name'] },
        { model: Hotel, attributes: ['name'] }
      ]
    });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Restaurant'
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const restaurant = await Restaurant.create(req.body);
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/restaurants/{id}:
 *   put:
 *     summary: Update a restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Restaurant'
 *     responses:
 *       200:
 *         description: Restaurant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    await restaurant.update(req.body);
    res.json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/restaurants/{id}:
 *   delete:
 *     summary: Delete a restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant deleted successfully
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    await restaurant.destroy();
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 