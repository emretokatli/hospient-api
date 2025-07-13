const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { Organization } = require('../models');

const router = express.Router();

// Validation middleware
const organizationValidation = [
  body('name').notEmpty().trim()
];

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Get organization details
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 isMultiProperty:
 *                   type: boolean
 *                 member_id:
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
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ message: 'Error fetching organization' });
  }
});

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Update organization details
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Organization name
 *               isMultiProperty:
 *                 type: boolean
 *                 description: Whether the organization has multiple properties
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 isMultiProperty:
 *                   type: boolean
 *                 member_id:
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
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    await organization.update(req.body);
    res.json(organization);
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ message: 'Error updating organization' });
  }
});

/**
 * @swagger
 * /api/organizations:
 *   put:
 *     summary: Update organization
 *     tags: [Organizations]
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
 *               - isMultiProperty
 *             properties:
 *               name:
 *                 type: string
 *                 description: Organization name
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 isMultiProperty:
 *                   type: boolean
 *                 member_id:
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
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.put('/', [authMiddleware, organizationValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    await organization.update(req.body);
    res.json(organization);
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ message: 'Error updating organization' });
  }
});

module.exports = router; 