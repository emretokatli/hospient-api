const express = require('express');
const { HotelSections, Hotel } = require('../models');

const router = express.Router();

// Helper function to parse images JSON
const parseImages = (section) => {
  if (section && section.images) {
    try {
      section.images = JSON.parse(section.images);
    } catch (error) {
      section.images = [];
    }
  }
  return section;
};

// Helper function to parse images for multiple records
const parseImagesForMultiple = (sections) => {
  if (Array.isArray(sections)) {
    return sections.map(parseImages);
  }
  return sections;
};

/**
 * @swagger
 * /api/public/hotel-sections:
 *   get:
 *     summary: Get all active hotel sections for a specific hotel
 *     tags: [Public Hotel Sections]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID to get sections for
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Filter by specific slug
 *     responses:
 *       200:
 *         description: List of hotel sections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HotelSection'
 *       400:
 *         description: Hotel ID is required
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { hotel_id, slug } = req.query;

    if (!hotel_id) {
      return res.status(400).json({ message: 'Hotel ID is required' });
    }

    // Verify hotel exists
    const hotel = await Hotel.findByPk(hotel_id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const whereClause = {
      hotel_id: hotel_id,
      status: 'active'
    };

    // Add slug filter if provided
    if (slug) {
      whereClause.slug = slug;
    }

    const sections = await HotelSections.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name']
        }
      ],
      order: [['order_index', 'ASC'], ['created_at', 'DESC']]
    });

    res.json(parseImagesForMultiple(sections));
  } catch (error) {
    console.error('Get public hotel sections error:', error);
    res.status(500).json({ message: 'Error fetching hotel sections' });
  }
});

/**
 * @swagger
 * /api/public/hotel-sections/{slug}:
 *   get:
 *     summary: Get hotel section by slug for a specific hotel
 *     tags: [Public Hotel Sections]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Section slug
 *       - in: query
 *         name: hotel_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel section details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelSection'
 *       400:
 *         description: Hotel ID is required
 *       404:
 *         description: Hotel section not found
 *       500:
 *         description: Server error
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { hotel_id } = req.query;

    if (!hotel_id) {
      return res.status(400).json({ message: 'Hotel ID is required' });
    }

    // Verify hotel exists
    const hotel = await Hotel.findByPk(hotel_id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const section = await HotelSections.findOne({
      where: {
        slug: slug,
        hotel_id: hotel_id,
        status: 'active'
      },
      include: [
        {
          model: Hotel,
          attributes: ['id', 'name']
        }
      ]
    });

    if (!section) {
      return res.status(404).json({ message: 'Hotel section not found' });
    }

    res.json(parseImages(section));
  } catch (error) {
    console.error('Get public hotel section error:', error);
    res.status(500).json({ message: 'Error fetching hotel section' });
  }
});

module.exports = router; 