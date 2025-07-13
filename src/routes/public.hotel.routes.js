const express = require('express');
const { Hotel, Organization, Restaurant, Menu } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @swagger
 * /api/public/hotels:
 *   get:
 *     summary: Get all public hotels
 *     tags: [Public Hotels]
 *     responses:
 *       200:
 *         description: List of public hotels retrieved successfully
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
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const hotels = await Hotel.findAll({
      include: [
        { 
          model: Organization, 
          attributes: ['name', 'org_slug']
        }
      ]
    });

    res.json(hotels);
  } catch (error) {
    console.error('Get public hotels error:', error);
    res.status(500).json({ message: 'Error fetching hotels' });
  }
});

/**
 * @swagger
 * /api/public/hotels/{slug}:
 *   get:
 *     summary: Get hotel by organization slug
 *     tags: [Public Hotels]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization slug
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
 *                 restaurants:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Find organization by slug
    const organization = await Organization.findOne({
      where: { org_slug: slug }
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Get hotel with restaurants and menus
    const hotel = await Hotel.findOne({
      where: { organization_id: organization.id },
      include: [
        {
          model: Restaurant,
          include: [
            {
              model: Menu
            }
          ]
        }
      ]
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json(hotel);
  } catch (error) {
    console.error('Get hotel by slug error:', error);
    res.status(500).json({ message: 'Error fetching hotel' });
  }
});

/**
 * @swagger
 * /api/public/hotels/slug/{hotel_slug}:
 *   get:
 *     summary: Get hotel by hotel slug
 *     tags: [Public Hotels]
 *     parameters:
 *       - in: path
 *         name: hotel_slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel slug
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
 *                 hotel_slug:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/slug/:hotel_slug', async (req, res) => {
  try {
    const { hotel_slug } = req.params;

    // Find hotel by hotel_slug
    const hotel = await Hotel.findOne({
      where: { hotel_slug: hotel_slug },
      include: [
        { 
          model: Organization, 
          attributes: ['name', 'org_slug']
        }
      ]
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json(hotel);
  } catch (error) {
    console.error('Get hotel by hotel_slug error:', error);
    res.status(500).json({ message: 'Error fetching hotel' });
  }
});

module.exports = router; 