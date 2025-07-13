const express = require('express');
const { Restaurant, Organization, Hotel, Menu } = require('../models');

const router = express.Router();

/**
 * @swagger
 * /api/public/restaurants/{orgSlug}:
 *   get:
 *     summary: Get all restaurants for a specific organization
 *     tags: [Public Restaurants]
 *     parameters:
 *       - in: path
 *         name: orgSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization slug
 *     responses:
 *       200:
 *         description: List of restaurants
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
 *                   image:
 *                     type: string
 *                     nullable: true
 *                   hotel:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get('/:orgSlug', async (req, res) => {
  try {
    const { orgSlug } = req.params;

    // Find organization by slug
    const organization = await Organization.findOne({
      where: { org_slug: orgSlug }
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Get all hotels for this organization
    const hotels = await Hotel.findAll({
      where: { organization_id: organization.id },
      attributes: ['id']
    });

    if (hotels.length === 0) {
      return res.json([]);
    }

    const hotelIds = hotels.map(hotel => hotel.id);

    const restaurants = await Restaurant.findAll({
      where: { hotel_id: hotelIds },
      include: [
        { model: Hotel, attributes: ['name', 'address'] },
        { 
          model: Menu, 
          required: false
        }
      ]
    });

    res.json(restaurants);
  } catch (error) {
    console.error('Get public restaurants error:', error);
    res.status(500).json({ message: 'Error fetching restaurants' });
  }
});

/**
 * @swagger
 * /api/public/restaurants/{orgSlug}/{restaurantId}:
 *   get:
 *     summary: Get a specific restaurant with its menus
 *     tags: [Public Restaurants]
 *     parameters:
 *       - in: path
 *         name: orgSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization slug
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant details with menus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 service_type:
 *                   type: string
 *                 working_hours:
 *                   type: object
 *                 image:
 *                   type: string
 *                   nullable: true
 *                 hotel:
 *                   type: object
 *                 menus:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error
 */
router.get('/:orgSlug/:restaurantId', async (req, res) => {
  try {
    const { orgSlug, restaurantId } = req.params;

    // Find organization by slug
    const organization = await Organization.findOne({
      where: { org_slug: orgSlug }
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Get all hotels for this organization
    const hotels = await Hotel.findAll({
      where: { organization_id: organization.id },
      attributes: ['id']
    });

    if (hotels.length === 0) {
      return res.status(404).json({ message: 'No hotels found for this organization' });
    }

    const hotelIds = hotels.map(hotel => hotel.id);

    const restaurant = await Restaurant.findOne({
      where: { 
        id: restaurantId,
        hotel_id: hotelIds
      },
      include: [
        { model: Hotel, attributes: ['name', 'address'] },
        { 
          model: Menu,
          required: false
        }
      ]
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Get public restaurant error:', error);
    res.status(500).json({ message: 'Error fetching restaurant' });
  }
});

module.exports = router; 