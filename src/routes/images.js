const express = require('express');
const router = express.Router();
const { Images, Hotel } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     Images:
 *       type: object
 *       required:
 *         - hotel_id
 *         - image_url
 *         - image_type
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID of the image
 *         hotel_id:
 *           type: integer
 *           description: ID of the hotel this image belongs to
 *         image_url:
 *           type: string
 *           description: URL of the image
 *         image_type:
 *           type: string
 *           description: Type of image (e.g., "banner", "logo", "slider")
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the image was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the image was last updated
 */

/**
 * @swagger
 * /api/images:
 *   get:
 *     summary: Get all images
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of images
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Images'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const images = await Images.findAll({
      include: [
        { model: Hotel, attributes: ['name'] }
      ]
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/images/hotel/{hotelId}:
 *   get:
 *     summary: Get all images for a hotel
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: List of images for the hotel
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Images'
 *       500:
 *         description: Server error
 */
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const images = await Images.findAll({
      where: { hotel_id: req.params.hotelId }
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/images/{id}:
 *   get:
 *     summary: Get an image by ID
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Images'
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const image = await Images.findByPk(req.params.id, {
      include: [
        { model: Hotel, attributes: ['name'] }
      ]
    });
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/images:
 *   post:
 *     summary: Create a new image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Images'
 *     responses:
 *       201:
 *         description: Image created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Images'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const image = await Images.create(req.body);
    res.status(201).json(image);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/images/{id}:
 *   put:
 *     summary: Update an image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Image ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Images'
 *     responses:
 *       200:
 *         description: Image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Images'
 *       404:
 *         description: Image not found
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const image = await Images.findByPk(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    await image.update(req.body);
    res.json(image);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/images/{id}:
 *   delete:
 *     summary: Delete an image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const image = await Images.findByPk(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    await image.destroy();
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 