const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { FileCategory } = require('../models');

const router = express.Router();

// Validation middleware
const fileCategoryValidation = [
  body('name').notEmpty().trim().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 255 }),
];

/**
 * @swagger
 * components:
 *   schemas:
 *     FileCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 255
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/file-categories:
 *   get:
 *     summary: Get all file categories
 *     tags: [File Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of file categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FileCategory'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const categories = await FileCategory.findAll({
      order: [['name', 'ASC']],
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching file categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/file-categories:
 *   post:
 *     summary: Create a new file category
 *     tags: [File Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 255
 *     responses:
 *       201:
 *         description: File category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileCategory'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', [authMiddleware, fileCategoryValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const category = await FileCategory.create({
      name,
      description,
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating file category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/file-categories/{id}:
 *   get:
 *     summary: Get a file category by ID
 *     tags: [File Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File category ID
 *     responses:
 *       200:
 *         description: File category details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileCategory'
 *       404:
 *         description: File category not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await FileCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'File category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching file category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/file-categories/{id}:
 *   put:
 *     summary: Update a file category
 *     tags: [File Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 255
 *     responses:
 *       200:
 *         description: File category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileCategory'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: File category not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', [authMiddleware, fileCategoryValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await FileCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'File category not found' });
    }

    const { name, description } = req.body;
    await category.update({
      name,
      description,
    });

    res.json(category);
  } catch (error) {
    console.error('Error updating file category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/file-categories/{id}:
 *   delete:
 *     summary: Delete a file category
 *     tags: [File Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File category ID
 *     responses:
 *       200:
 *         description: File category deleted successfully
 *       404:
 *         description: File category not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await FileCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'File category not found' });
    }

    await category.destroy();
    res.json({ message: 'File category deleted successfully' });
  } catch (error) {
    console.error('Error deleting file category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 