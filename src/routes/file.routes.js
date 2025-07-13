const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { File, FileCategory, Hotel, Organization } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Validation middleware
const fileValidation = [
  body('category_id').isInt(),
  body('organization_id').isInt(),
  body('hotel_id').isInt(),
];

/**
 * @swagger
 * components:
 *   schemas:
 *     File:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         file_name:
 *           type: string
 *           maxLength: 255
 *         original_name:
 *           type: string
 *           maxLength: 255
 *         category_id:
 *           type: integer
 *         organization_id:
 *           type: integer
 *         hotel_id:
 *           type: integer
 *         file_size:
 *           type: integer
 *         file_path:
 *           type: string
 *           maxLength: 512
 *         mime_type:
 *           type: string
 *           maxLength: 100
 *         upload_date:
 *           type: string
 *           format: date-time
 *         modified_date:
 *           type: string
 *           format: date-time
 *         member_id:
 *           type: integer
 *         is_deleted:
 *           type: boolean
 *         category_name:
 *           type: string
 *           description: Name of the file category
 */

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Get all files for a hotel and organization
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: List of files
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/File'
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('GET /api/files - Request received');
    console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('User:', req.member ? `ID: ${req.member.id}, Email: ${req.member.email}` : 'Not found');
    
    const { hotelId, organizationId } = req.query;
    console.log('Query params - hotelId:', hotelId, 'organizationId:', organizationId);

    if (!hotelId || !organizationId) {
      console.log('Missing required parameters');
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const files = await File.findAll({
      include: [
        {
          model: FileCategory,
          attributes: ['name'],
          as: 'category',
        },
      ],
      where: {
        hotel_id: hotelId,
        organization_id: organizationId,
        is_deleted: false,
      },
      order: [['upload_date', 'DESC']],
    });

    console.log(`Found ${files.length} files`);

    // Format the response to include category_name
    const formattedFiles = files.map(file => {
      const fileObj = file.toJSON();
      fileObj.category_name = fileObj.category ? fileObj.category.name : null;
      delete fileObj.category;
      return fileObj;
    });

    res.json(formattedFiles);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/files:
 *   post:
 *     summary: Upload a new file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - category_id
 *               - organization_id
 *               - hotel_id
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               category_id:
 *                 type: integer
 *               organization_id:
 *                 type: integer
 *               hotel_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       400:
 *         description: Invalid input or missing required parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', [authMiddleware, upload.single('file')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { category_id, organization_id, hotel_id } = req.body;

    if (!category_id || !organization_id || !hotel_id) {
      // Delete the uploaded file if required parameters are missing
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Verify that the hotel belongs to the organization
    const hotel = await Hotel.findOne({
      where: {
        id: hotel_id,
        organization_id: organization_id,
      },
    });

    if (!hotel) {
      // Delete the uploaded file if hotel doesn't belong to the organization
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Hotel does not belong to the organization' });
    }

    // Create file record in the database
    const file = await File.create({
      file_name: req.file.filename,
      original_name: req.file.originalname,
      category_id: category_id,
      organization_id: organization_id,
      hotel_id: hotel_id,
      file_size: req.file.size,
      file_path: `/uploads/${req.file.filename}`,
      mime_type: req.file.mimetype,
      member_id: req.user ? req.user.id : null,
    });

    res.status(201).json(file);
  } catch (error) {
    console.error('Error uploading file:', error);
    // Delete the uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Get a file by ID
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       404:
 *         description: File not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/file', authMiddleware, async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Missing file ID' });
    }

    const file = await File.findOne({
      include: [
        {
          model: FileCategory,
          attributes: ['name'],
          as: 'category',
        },
      ],
      where: {
        id,
        is_deleted: false,
      },
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Format the response to include category_name
    const fileObj = file.toJSON();
    fileObj.category_name = fileObj.category ? fileObj.category.name : null;
    delete fileObj.category;

    res.json(fileObj);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete a file (soft delete)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *       - in: query
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: File not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const { id, hotelId, organizationId } = req.query;

    if (!id || !hotelId || !organizationId) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const file = await File.findOne({
      where: {
        id,
        hotel_id: hotelId,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Soft delete the file
    await file.update({ is_deleted: true });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 