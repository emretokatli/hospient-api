const express = require('express');
const router = express.Router();
const { Menu, Hotel, Restaurant } = require('../models');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

/**
 * @swagger
 * components:
 *   schemas:
 *     Menu:
 *       type: object
 *       required:
 *         - item_name
 *         - item_description
 *         - tax_rate
 *         - item_price
 *         - allergens
 *         - sub_category
 *         - main_category
 *         - hotel_id
 *         - restaurant_id
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID of the menu item
 *         obj_num:
 *           type: string
 *           description: Object number (optional)
 *         item_name:
 *           type: string
 *           description: Name of the menu item
 *         item_description:
 *           type: string
 *           description: Description of the menu item
 *         tax_rate:
 *           type: number
 *           format: decimal
 *           description: Tax rate for the item
 *         item_price:
 *           type: number
 *           format: decimal
 *           description: Price of the item
 *         allergens:
 *           type: string
 *           description: List of allergens
 *         image:
 *           type: string
 *           description: URL or base64 of the item image (optional)
 *         sub_category:
 *           type: string
 *           description: Sub-category of the menu item
 *         main_category:
 *           type: string
 *           description: Main category of the menu item
 *         kcal:
 *           type: string
 *           description: Calorie information (optional)
 *         is_condiment:
 *           type: boolean
 *           description: Whether the item is a condiment
 *         hotel_id:
 *           type: integer
 *           description: ID of the hotel this menu item belongs to
 *         restaurant_id:
 *           type: integer
 *           description: ID of the restaurant this menu item belongs to
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the menu item was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the menu item was last updated
 */

/**
 * @swagger
 * /api/menus:
 *   get:
 *     summary: Get all menu items
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Menu'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const menus = await Menu.findAll({
      include: [
        { model: Hotel, attributes: ['name'] },
        { model: Restaurant, attributes: ['name'] }
      ]
    });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/menus/{id}:
 *   get:
 *     summary: Get a menu item by ID
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Menu item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       404:
 *         description: Menu item not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const menu = await Menu.findByPk(req.params.id, {
      include: [
        { model: Hotel, attributes: ['name'] },
        { model: Restaurant, attributes: ['name'] }
      ]
    });
    if (!menu) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/menus:
 *   post:
 *     summary: Create a new menu item
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Menu'
 *     responses:
 *       201:
 *         description: Menu item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const menu = await Menu.create(req.body);
    res.status(201).json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/menus/{id}:
 *   put:
 *     summary: Update a menu item
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Menu'
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       404:
 *         description: Menu item not found
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    await menu.update(req.body);
    res.json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/menus/{id}:
 *   delete:
 *     summary: Delete a menu item
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Menu item deleted successfully
 *       404:
 *         description: Menu item not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    await menu.destroy();
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

/**
 * @swagger
 * /api/menus/bulk-upload:
 *   post:
 *     summary: Upload multiple menu items from a CSV file
 *     tags: [Menus]
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
 *               - hotel_id
 *               - restaurant_id
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               hotel_id:
 *                 type: integer
 *               restaurant_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Menu items created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Menu'
 *       400:
 *         description: Invalid input data or file format
 *       500:
 *         description: Server error
 */
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { hotel_id, restaurant_id } = req.body;

    if (!hotel_id || !restaurant_id) {
      // Delete the uploaded file if required parameters are missing
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Missing required parameters: hotel_id and restaurant_id' });
    }

    // Verify that the hotel exists
    const hotel = await Hotel.findByPk(hotel_id);
    if (!hotel) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Hotel not found' });
    }

    // Verify that the restaurant exists and belongs to the hotel
    const restaurant = await Restaurant.findOne({
      where: {
        id: restaurant_id,
        hotel_id: hotel_id
      }
    });
    if (!restaurant) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Restaurant not found or does not belong to the specified hotel' });
    }

    const results = [];
    const errors = [];

    // Process the CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (data) => {
        try {
          // Map column names to handle different CSV formats
          const mapColumnName = (data, expectedName, alternativeNames = []) => {
            // First try the expected name
            if (data[expectedName] !== undefined) {
              return data[expectedName];
            }
            
            // Then try alternative names
            for (const altName of alternativeNames) {
              if (data[altName] !== undefined) {
                return data[altName];
              }
            }
            
            return undefined;
          };

          // Convert string values to appropriate types
          const menuItem = {
            obj_num: mapColumnName(data, 'obj_num', ['Object Number']) || null,
            item_name: mapColumnName(data, 'item_name', ['Item Name']),
            item_description: mapColumnName(data, 'item_description', ['Item Description']),
            main_category: mapColumnName(data, 'main_category', ['Main Category']),
            sub_category: mapColumnName(data, 'sub_category', ['Sub Category']),
            item_price: Math.round(parseFloat(mapColumnName(data, 'item_price', ['Item Price']) || 0) * 100),
            tax_rate: parseFloat(mapColumnName(data, 'tax_rate', ['Tax Rate']) || 0),
            kcal: mapColumnName(data, 'kcal', ['Calories']) || null,
            allergens: mapColumnName(data, 'allergens', ['Allergens']),
            image: mapColumnName(data, 'image', ['Image']) || null,
            is_condiment: mapColumnName(data, 'is_condiment', ['Is Condiment'])?.toLowerCase() === 'true',
            hotel_id: parseInt(hotel_id),
            restaurant_id: parseInt(restaurant_id)
          };

          // Validate required fields
          if (!menuItem.item_name || !menuItem.item_description || !menuItem.main_category || 
              !menuItem.sub_category || isNaN(menuItem.item_price) || isNaN(menuItem.tax_rate)) {
            errors.push(`Row with item_name "${data.item_name || data['Item Name'] || 'unknown'}": Missing required fields`);
            return;
          }

          // Create the menu item
          const createdItem = await Menu.create(menuItem);
          results.push(createdItem);
        } catch (error) {
          errors.push(`Row with item_name "${data.item_name || data['Item Name'] || 'unknown'}": ${error.message}`);
        }
      })
      .on('end', () => {
        // Delete the uploaded file after processing
        fs.unlinkSync(req.file.path);

        if (results.length === 0 && errors.length > 0) {
          return res.status(400).json({ 
            message: 'Failed to create any menu items', 
            errors: errors 
          });
        }

        res.status(201).json({
          message: `Successfully created ${results.length} menu items${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
          items: results,
          errors: errors.length > 0 ? errors : undefined
        });
      });
  } catch (error) {
    console.error('Error processing CSV file:', error);
    // Delete the uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 