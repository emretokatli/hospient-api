const express = require('express');
const { Menu, Restaurant, Organization, Hotel } = require('../models');

const router = express.Router();

/**
 * @swagger
 * /api/public/menus/{orgSlug}:
 *   get:
 *     summary: Get all active menus for a specific organization
 *     tags: [Public Menus]
 *     parameters:
 *       - in: path
 *         name: orgSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization slug
 *     responses:
 *       200:
 *         description: List of active menus
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
 *                   description:
 *                     type: string
 *                   menu_items:
 *                     type: array
 *                   restaurant:
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

    const menus = await Menu.findAll({
      include: [
        {
          model: Restaurant,
          where: { hotel_id: hotelIds },
          attributes: ['name', 'service_type']
        }
      ]
    });

    res.json(menus);
  } catch (error) {
    console.error('Get public menus error:', error);
    res.status(500).json({ message: 'Error fetching menus' });
  }
});

/**
 * @swagger
 * /api/public/menus/{orgSlug}/{menuId}:
 *   get:
 *     summary: Get a specific menu by ID
 *     tags: [Public Menus]
 *     parameters:
 *       - in: path
 *         name: orgSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization slug
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu ID
 *     responses:
 *       200:
 *         description: Menu details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 menu_items:
 *                   type: array
 *                 restaurant:
 *                   type: object
 *       404:
 *         description: Menu not found
 *       500:
 *         description: Server error
 */
router.get('/:orgSlug/:menuId', async (req, res) => {
  try {
    const { orgSlug, menuId } = req.params;

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

    const menu = await Menu.findOne({
      where: { 
        id: menuId
      },
      include: [
        {
          model: Restaurant,
          where: { hotel_id: hotelIds },
          attributes: ['name', 'service_type', 'working_hours']
        }
      ]
    });

    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    res.json(menu);
  } catch (error) {
    console.error('Get public menu error:', error);
    res.status(500).json({ message: 'Error fetching menu' });
  }
});

/**
 * @swagger
 * /api/public/menus/{orgSlug}/restaurant/{restaurantId}:
 *   get:
 *     summary: Get all menus for a specific restaurant
 *     tags: [Public Menus]
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
 *         description: List of menus for the restaurant
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error
 */
router.get('/:orgSlug/restaurant/:restaurantId', async (req, res) => {
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

    // Verify the restaurant belongs to this organization
    const restaurant = await Restaurant.findOne({
      where: { 
        id: restaurantId,
        hotel_id: hotelIds
      }
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Get all menus for this restaurant
    const menus = await Menu.findAll({
      where: { restaurant_id: restaurantId }
    });

    res.json(menus);
  } catch (error) {
    console.error('Get restaurant menus error:', error);
    res.status(500).json({ message: 'Error fetching restaurant menus' });
  }
});

module.exports = router; 