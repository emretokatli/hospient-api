const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { Hotel, Organization, Restaurant, Menu } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Function to generate a random alphanumeric slug
const generateRandomSlug = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Function to get a unique hotel slug
const getUniqueHotelSlug = async () => {
  let slug;
  let isUnique = false;
  
  while (!isUnique) {
    slug = generateRandomSlug();
    // Check if slug exists
    const existingHotel = await Hotel.findOne({
      where: { hotel_slug: slug }
    });
    if (!existingHotel) {
      isUnique = true;
    }
  }
  
  return slug;
};

// Validation middleware
const hotelValidation = [
  body('name').notEmpty().trim().isLength({ max: 255 }),
  body('address').notEmpty().trim(),
  body('city').notEmpty().trim().isLength({ max: 100 }),
  body('country').notEmpty().trim().isLength({ max: 100 }),
  body('web_address').optional().trim().isLength({ max: 255 }),
  body('social_media_links').optional().trim().isLength({ max: 255 }),
  body('logo_url').optional().trim().isLength({ max: 255 }),
  body('banner_url').optional().trim().isLength({ max: 255 }),
  body('has_fb').optional().isBoolean(),
  body('has_spa').optional().isBoolean(),
  body('isMultiImages').optional().isBoolean(),
  body('specials').optional().trim(),
  body('organization_id').isInt()
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Hotel:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         organization_id:
 *           type: integer
 *         name:
 *           type: string
 *           maxLength: 255
 *         address:
 *           type: string
 *         city:
 *           type: string
 *           maxLength: 100
 *         country:
 *           type: string
 *           maxLength: 100
 *         web_address:
 *           type: string
 *           maxLength: 255
 *         social_media_links:
 *           type: string
 *           maxLength: 255
 *         logo_url:
 *           type: string
 *           maxLength: 255
 *         banner_url:
 *           type: string
 *           maxLength: 255
 *         has_fb:
 *           type: boolean
 *         has_spa:
 *           type: boolean
 *         isMultiImages:
 *           type: boolean
 *         specials:
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
 * /api/hotels:
 *   get:
 *     summary: Get all hotels for the organization
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of hotels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   organization_id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *                   web_address:
 *                     type: string
 *                   social_media_links:
 *                     type: string
 *                   logo_url:
 *                     type: string
 *                   banner_url:
 *                     type: string
 *                   has_fb:
 *                     type: boolean
 *                   has_spa:
 *                     type: boolean
 *                   isMultiImages:
 *                     type: boolean
 *                   specials:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
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

    const hotels = await Hotel.findAll({
      where: { organization_id: organization.id }
    });

    res.json(hotels);
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({ message: 'Error fetching hotels' });
  }
});

/**
 * @swagger
 * /api/hotels/{id}:
 *   get:
 *     summary: Get hotel by ID
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 email:
 *                   type: string
 *                 description:
 *                   type: string
 *                 website:
 *                   type: string
 *                 check_in_time:
 *                   type: string
 *                 check_out_time:
 *                   type: string
 *                 organization_id:
 *                   type: integer
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const hotel = await Hotel.findOne({
      where: {
        id: req.params.id,
        organization_id: organization.id
      }
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json(hotel);
  } catch (error) {
    console.error('Get hotel error:', error);
    res.status(500).json({ message: 'Error fetching hotel' });
  }
});

/**
 * @swagger
 * /api/hotels/organization/{organizationId}:
 *   get:
 *     summary: Get all hotels for a specific organization
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: List of hotels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hotel'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/organization/:organizationId', authMiddleware, async (req, res) => {
  try {
    const hotels = await Hotel.findAll({
      where: { organization_id: req.params.organizationId }
    });

    res.json(hotels);
  } catch (error) {
    console.error('Get hotels by organization error:', error);
    res.status(500).json({ message: 'Error fetching hotels' });
  }
});

/**
 * @swagger
 * /api/hotels:
 *   post:
 *     summary: Create a new hotel
 *     tags: [Hotels]
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
 *               - address
 *               - city
 *               - country
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Hotel name
 *               address:
 *                 type: string
 *                 description: Hotel address
 *               city:
 *                 type: string
 *                 maxLength: 100
 *                 description: Hotel city
 *               country:
 *                 type: string
 *                 maxLength: 100
 *                 description: Hotel country
 *               web_address:
 *                 type: string
 *                 maxLength: 255
 *                 description: Hotel website URL
 *               social_media_links:
 *                 type: string
 *                 maxLength: 255
 *                 description: Social media links
 *               logo_url:
 *                 type: string
 *                 maxLength: 255
 *                 description: Logo image URL
 *               banner_url:
 *                 type: string
 *                 maxLength: 255
 *                 description: Banner image URL
 *               has_fb:
 *                 type: boolean
 *                 description: FB flag
 *               has_spa:
 *                 type: boolean
 *                 description: Spa flag
 *               isMultiImages:
 *                 type: boolean
 *                 description: Services flag
 *               specials:
 *                 type: string
 *                 description: Special offers or notes
 *     responses:
 *       201:
 *         description: Hotel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 organization_id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 city:
 *                   type: string
 *                 country:
 *                   type: string
 *                 web_address:
 *                   type: string
 *                 social_media_links:
 *                   type: string
 *                 logo_url:
 *                   type: string
 *                 banner_url:
 *                   type: string
 *                 has_fb:
 *                   type: boolean
 *                 has_spa:
 *                   type: boolean
 *                 isMultiImages:
 *                   type: boolean
 *                 specials:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', [authMiddleware, hotelValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Generate a unique slug for the hotel
    const hotel_slug = await getUniqueHotelSlug();

    const hotel = await Hotel.create({
      ...req.body,
      organization_id: organization.id,
      hotel_slug: hotel_slug
    });

    res.status(201).json(hotel);
  } catch (error) {
    console.error('Create hotel error:', error);
    res.status(500).json({ message: 'Error creating hotel' });
  }
});

/**
 * @swagger
 * /api/hotels/{id}:
 *   put:
 *     summary: Update hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Hotel name
 *               address:
 *                 type: string
 *                 description: Hotel address
 *               phone:
 *                 type: string
 *                 description: Contact phone number
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *               description:
 *                 type: string
 *                 description: Hotel description
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: Hotel website URL
 *               check_in_time:
 *                 type: string
 *                 description: Check-in time
 *               check_out_time:
 *                 type: string
 *                 description: Check-out time
 *     responses:
 *       200:
 *         description: Hotel updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 email:
 *                   type: string
 *                 description:
 *                   type: string
 *                 website:
 *                   type: string
 *                 check_in_time:
 *                   type: string
 *                 check_out_time:
 *                   type: string
 *                 organization_id:
 *                   type: integer
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.put('/:id', [authMiddleware, hotelValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const hotel = await Hotel.findOne({
      where: {
        id: req.params.id,
        organization_id: organization.id
      }
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    await hotel.update(req.body);
    res.json(hotel);
  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({ message: 'Error updating hotel' });
  }
});

/**
 * @swagger
 * /api/hotels/{id}:
 *   delete:
 *     summary: Delete hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const hotel = await Hotel.findOne({
      where: {
        id: req.params.id,
        organization_id: organization.id
      }
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    await hotel.destroy();
    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    console.error('Delete hotel error:', error);
    res.status(500).json({ message: 'Error deleting hotel' });
  }
});

/**
 * @swagger
 * /api/hotels/{id}/restaurants:
 *   get:
 *     summary: Get all restaurants and their menus for a specific hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: List of restaurants with their menus
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   service_type:
 *                     type: string
 *                   working_hours:
 *                     type: object
 *                   menus:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         item_name:
 *                           type: string
 *                         item_description:
 *                           type: string
 *                         tax_rate:
 *                           type: number
 *                         item_price:
 *                           type: number
 *                         allergens:
 *                           type: string
 *                         image:
 *                           type: string
 *                         sub_category:
 *                           type: string
 *                         main_category:
 *                           type: string
 *                         kcal:
 *                           type: string
 *                         is_condiment:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/:id/restaurants', authMiddleware, async (req, res) => {
  try {
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const hotel = await Hotel.findOne({
      where: {
        id: req.params.id,
        organization_id: organization.id
      }
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const restaurants = await Restaurant.findAll({
      where: { hotel_id: hotel.id },
      include: [
        {
          model: Menu,
          as: "Menus",
          required: false,
          order: [
            ["main_category", "ASC"],
            ["sub_category", "ASC"],
            ["item_name", "ASC"],
          ],
        },
      ],
    });

    console.log('Found restaurants:', restaurants.map(r => ({
      id: r.id,
      name: r.name,
      menuCount: r.Menus ? r.Menus.length : 0
    })));

    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

module.exports = router; 