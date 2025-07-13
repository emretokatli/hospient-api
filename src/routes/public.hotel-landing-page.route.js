const express = require('express');
const { HotelLandingPage, Hotel, Organization } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Helper function to parse images JSON
const parseImages = (landingPage) => {
  if (landingPage && landingPage.images) {
    try {
      landingPage.images = JSON.parse(landingPage.images);
    } catch (error) {
      landingPage.images = [];
    }
  }
  return landingPage;
};

// Helper function to parse images for multiple records
const parseImagesForMultiple = (landingPages) => {
  if (Array.isArray(landingPages)) {
    return landingPages.map(parseImages);
  }
  return landingPages;
};

/**
 * @swagger
 * /api/public/hotel-landing-pages:
 *   get:
 *     summary: Get all active hotel landing pages
 *     tags: [Public Hotel Landing Pages]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: integer
 *         description: Filter by hotel ID
 *       - in: query
 *         name: organization_slug
 *         schema:
 *           type: string
 *         description: Filter by organization slug
 *     responses:
 *       200:
 *         description: List of active hotel landing pages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   hotel_id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                         index:
 *                           type: integer
 *                   hotel:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       organization:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           org_slug:
 *                             type: string
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { hotel_id, organization_slug } = req.query;
    const whereClause = { status: 'active' };

    // Add filters
    if (hotel_id) {
      whereClause.hotel_id = hotel_id;
    }

    const includeClause = [
      {
        model: Hotel,
        attributes: ['id', 'name'],
        include: [
          {
            model: Organization,
            attributes: ['name', 'org_slug']
          }
        ]
      }
    ];

    // Add organization filter if provided
    if (organization_slug) {
      includeClause[0].include[0].where = { org_slug: organization_slug };
    }

    const landingPages = await HotelLandingPage.findAll({
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']]
    });

    res.json(parseImagesForMultiple(landingPages));
  } catch (error) {
    console.error('Get public hotel landing pages error:', error);
    res.status(500).json({ message: 'Error fetching hotel landing pages' });
  }
});

/**
 * @swagger
 * /api/public/hotel-landing-pages/{id}:
 *   get:
 *     summary: Get hotel landing page by ID (public access)
 *     tags: [Public Hotel Landing Pages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel landing page ID
 *     responses:
 *       200:
 *         description: Hotel landing page details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 hotel_id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       index:
 *                         type: integer
 *                 hotel:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     city:
 *                       type: string
 *                     country:
 *                       type: string
 *                     web_address:
 *                       type: string
 *                     logo_url:
 *                       type: string
 *                     banner_url:
 *                       type: string
 *                     organization:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         org_slug:
 *                           type: string
 *       404:
 *         description: Hotel landing page not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const landingPage = await HotelLandingPage.findOne({
      where: { 
        id,
        status: 'active'
      },
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name', 'address', 'city', 'country', 'web_address', 'logo_url', 'banner_url'],
          include: [
            {
              model: Organization,
              attributes: ['name', 'org_slug']
            }
          ]
        }
      ]
    });

    if (!landingPage) {
      return res.status(404).json({ message: 'Hotel landing page not found' });
    }

    res.json(parseImages(landingPage));
  } catch (error) {
    console.error('Get public hotel landing page error:', error);
    res.status(500).json({ message: 'Error fetching hotel landing page' });
  }
});

/**
 * @swagger
 * /api/public/hotel-landing-pages/organization/{slug}:
 *   get:
 *     summary: Get hotel landing pages by organization slug
 *     tags: [Public Hotel Landing Pages]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization slug
 *     responses:
 *       200:
 *         description: Hotel landing pages for organization retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   hotel_id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                         index:
 *                           type: integer
 *                   hotel:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get('/organization/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Find organization by slug
    const organization = await Organization.findOne({
      where: { org_slug: slug }
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Get active landing pages for the organization's hotels
    const landingPages = await HotelLandingPage.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Hotel,
          where: { organization_id: organization.id },
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              attributes: ['name', 'org_slug']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(parseImagesForMultiple(landingPages));
  } catch (error) {
    console.error('Get hotel landing pages by organization error:', error);
    res.status(500).json({ message: 'Error fetching hotel landing pages' });
  }
});

module.exports = router;
