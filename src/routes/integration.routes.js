const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { Integration, IntegrationLog, Hotel, Member } = require('../models');
const POSIntegrationService = require('../services/integration/pos-integration.service');
const PMSIntegrationService = require('../services/integration/pms-integration.service');
const GuestManagementIntegrationService = require('../services/integration/guest-management-integration.service');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/integrations/providers:
 *   get:
 *     summary: Get available providers for each integration type
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: Available providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     pos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *                           credentials:
 *                             type: array
 *                             items:
 *                               type: object
 *                     pms:
 *                       type: array
 *                       items:
 *                         type: object
 *                     guest_management:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = {
      pos: [
        {
          value: 'simphony_cloud',
          label: 'Simphony Cloud',
          credentials: [
            { name: 'apiUrl', label: 'API Url', type: 'url', required: true },
            { name: 'apiAuthUrl', label: 'API Auth Url', type: 'url', required: true },
            { name: 'apiUser', label: 'API User', type: 'text', required: true },
            { name: 'apiUserPassword', label: 'API User Password', type: 'password', required: true },
            { name: 'companyCode', label: 'Company Code', type: 'text', required: true },
            { name: 'clientId', label: 'Client ID', type: 'text', required: true },
            { name: 'locationRef', label: 'Location Ref', type: 'text', required: true },
            { name: 'accessToken', label: 'Access Token', type: 'password', required: false },
            { name: 'refreshToken', label: 'Refresh Token', type: 'password', required: false }
          ]
        },
        {
          value: 'simpra',
          label: 'Simpra',
          credentials: [
            { name: 'apiUrl', label: 'API Url', type: 'url', required: true },
            { name: 'accessToken', label: 'Access Token', type: 'password', required: true }
          ]
        }
      ],
      pms: [
        {
          value: 'opera_cloud',
          label: 'Opera Cloud',
          credentials: [
            { name: 'apiUrl', label: 'API Url', type: 'url', required: true },
            { name: 'appKey', label: 'App Key', type: 'text', required: true },
            { name: 'apiUser', label: 'API User', type: 'text', required: true },
            { name: 'apiUserPassword', label: 'API User Password', type: 'password', required: true },
            { name: 'clientId', label: 'Client ID', type: 'text', required: true },
            { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
            { name: 'hotelId', label: 'Hotel ID', type: 'text', required: true },
            { name: 'hotelName', label: 'Hotel Name', type: 'text', required: true },
            { name: 'cashierId', label: 'Cashier ID', type: 'text', required: true },
            { name: 'enterpriseId', label: 'Enterprise ID', type: 'text', required: true },
            { name: 'accessToken', label: 'Access Token', type: 'password', required: false },
            { name: 'refreshToken', label: 'Refresh Token', type: 'password', required: false }
          ]
        },
        {
          value: 'simpra_pms',
          label: 'Simpra PMS',
          credentials: [
            { name: 'apiUrl', label: 'API Url', type: 'url', required: true },
            { name: 'accessToken', label: 'Access Token', type: 'password', required: true }
          ]
        }
      ],
      guest_management: [
        // Will be added later
      ]
    };

    res.json({
      status: 'success',
      data: providers
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch providers'
    });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Integration:
 *       type: object
 *       required:
 *         - hotel_id
 *         - integration_type
 *         - provider
 *         - provider_name
 *         - config
 *         - credentials
 *       properties:
 *         id:
 *           type: integer
 *         hotel_id:
 *           type: integer
 *         integration_type:
 *           type: string
 *           enum: [pos, pms, guest_management]
 *         provider:
 *           type: string
 *           description: Specific provider name (e.g., Simphony Cloud, Opera Cloud)
 *         provider_name:
 *           type: string
 *         provider_version:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, error, testing]
 *         config:
 *           type: object
 *         credentials:
 *           type: object
 *         webhook_url:
 *           type: string
 *         webhook_secret:
 *           type: string
 *         sync_settings:
 *           type: object
 *         last_sync:
 *           type: string
 *           format: date-time
 *         sync_status:
 *           type: string
 *           enum: [success, failed, in_progress]
 *         error_count:
 *           type: integer
 *         last_error:
 *           type: string
 *         created_by:
 *           type: integer
 *         updated_by:
 *           type: integer
 */

/**
 * @swagger
 * /api/integrations:
 *   get:
 *     summary: Get all integrations for a hotel
 *     tags: [Integrations]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Hotel ID
 *       - in: query
 *         name: integration_type
 *         schema:
 *           type: string
 *           enum: [pos, pms, guest_management]
 *         description: Filter by integration type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, error, testing]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of integrations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Integration'
 */
router.get('/', async (req, res) => {
  try {
    const { hotel_id, integration_type, status } = req.query;
    
    if (!hotel_id) {
      return res.status(400).json({
        status: 'error',
        message: 'hotel_id is required'
      });
    }

    const whereClause = { hotel_id: parseInt(hotel_id) };
    
    if (integration_type) {
      whereClause.integration_type = integration_type;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const integrations = await Integration.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        },
        {
          model: Member,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Member,
          as: 'updater',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      status: 'success',
      data: integrations
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch integrations'
    });
  }
});

/**
 * @swagger
 * /api/integrations/{id}:
 *   get:
 *     summary: Get integration by ID
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Integration ID
 *     responses:
 *       200:
 *         description: Integration details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const integration = await Integration.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        },
        {
          model: Member,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Member,
          as: 'updater',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!integration) {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found'
      });
    }

    res.json({
      status: 'success',
      data: integration
    });
  } catch (error) {
    console.error('Error fetching integration:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch integration'
    });
  }
});

/**
 * @swagger
 * /api/integrations:
 *   post:
 *     summary: Create a new integration
 *     tags: [Integrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_id
 *               - integration_type
 *               - provider
 *               - provider_name
 *               - config
 *               - credentials
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               integration_type:
 *                 type: string
 *                 enum: [pos, pms, guest_management]
 *               provider:
 *                 type: string
 *               provider_name:
 *                 type: string
 *               provider_version:
 *                 type: string
 *               config:
 *                 type: object
 *               credentials:
 *                 type: object
 *               webhook_url:
 *                 type: string
 *               webhook_secret:
 *                 type: string
 *               sync_settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Integration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 */
router.post('/', async (req, res) => {
  try {
    console.log('Creating integration - Request body:', JSON.stringify(req.body, null, 2));
    console.log('Member ID:', req.member?.id);
    
    const {
      hotel_id,
      integration_type,
      provider,
      provider_name,
      provider_version,
      config,
      credentials,
      webhook_url,
      webhook_secret,
      sync_settings
    } = req.body;

    // Validate required fields
    if (!hotel_id || !integration_type || !provider || !provider_name || !config || !credentials) {
      console.log('Missing required fields:', { hotel_id, integration_type, provider, provider_name, config: !!config, credentials: !!credentials });
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: hotel_id, integration_type, provider, provider_name, config, credentials'
      });
    }

    // Validate integration type
    const validTypes = ['pos', 'pms', 'guest_management'];
    if (!validTypes.includes(integration_type)) {
      console.log('Invalid integration type:', integration_type);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid integration_type. Must be one of: ' + validTypes.join(', ')
      });
    }

    // Validate provider based on integration type
    const validProviders = {
      pos: ['simphony_cloud', 'simpra'],
      pms: ['opera_cloud', 'simpra_pms'],
      guest_management: []
    };

    if (!validProviders[integration_type].includes(provider)) {
      console.log('Invalid provider for integration type:', { integration_type, provider });
      return res.status(400).json({
        status: 'error',
        message: `Invalid provider '${provider}' for integration type '${integration_type}'`
      });
    }

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotel_id);
    if (!hotel) {
      console.log('Hotel not found:', hotel_id);
      return res.status(400).json({
        status: 'error',
        message: 'Hotel not found'
      });
    }

    console.log('Hotel found:', hotel.id, hotel.name);

    // Encrypt credentials
    console.log('Encrypting credentials...');
    const baseService = new (require('../services/integration/base-integration.service'))();
    const encryptedCredentials = baseService.encryptCredentials(credentials);
    console.log('Credentials encrypted successfully');

    console.log('Creating integration in database...');
    const integration = await Integration.create({
      hotel_id,
      integration_type,
      provider,
      provider_name,
      provider_version,
      config,
      credentials: encryptedCredentials,
      webhook_url,
      webhook_secret,
      sync_settings,
      created_by: req.member.id,
      status: 'inactive'
    });

    console.log('Integration created with ID:', integration.id);

    const createdIntegration = await Integration.findByPk(integration.id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        },
        {
          model: Member,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    console.log('Integration fetched with associations');

    res.status(201).json({
      status: 'success',
      data: createdIntegration
    });
  } catch (error) {
    console.error('Error creating integration:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create integration',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/integrations/{id}:
 *   put:
 *     summary: Update integration
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Integration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider_version:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, error, testing]
 *               config:
 *                 type: object
 *               credentials:
 *                 type: object
 *               webhook_url:
 *                 type: string
 *               webhook_secret:
 *                 type: string
 *               sync_settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Integration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_by: req.member.id };

    const integration = await Integration.findByPk(id);
    if (!integration) {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found'
      });
    }

    // Encrypt credentials if provided
    if (updateData.credentials) {
      const baseService = new (require('../services/integration/base-integration.service'))();
      updateData.credentials = baseService.encryptCredentials(updateData.credentials);
    }

    await integration.update(updateData);

    const updatedIntegration = await Integration.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'Hotel',
          attributes: ['id', 'name', 'hotel_slug']
        },
        {
          model: Member,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Member,
          as: 'updater',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    res.json({
      status: 'success',
      data: updatedIntegration
    });
  } catch (error) {
    console.error('Error updating integration:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update integration'
    });
  }
});

/**
 * @swagger
 * /api/integrations/{id}/test:
 *   post:
 *     summary: Test integration connection
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Integration ID
 *     responses:
 *       200:
 *         description: Test results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     connection:
 *                       type: string
 *                     details:
 *                       type: object
 */
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;

    const integration = await Integration.findByPk(id);
    if (!integration) {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found'
      });
    }

    let service;
    switch (integration.integration_type) {
      case 'pos':
        service = new POSIntegrationService(id);
        break;
      case 'pms':
        service = new PMSIntegrationService(id);
        break;
      case 'guest_management':
        service = new GuestManagementIntegrationService(id);
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Unsupported integration type'
        });
    }

    const testResult = await service.testIntegration();

    res.json({
      status: 'success',
      data: testResult
    });
  } catch (error) {
    console.error('Error testing integration:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to test integration',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/integrations/{id}/sync:
 *   post:
 *     summary: Trigger integration sync
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Integration ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sync_type:
 *                 type: string
 *                 description: Type of sync to perform
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Sync results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     processed:
 *                       type: integer
 *                     success:
 *                       type: integer
 *                     failed:
 *                       type: integer
 */
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    const { sync_type, start_date, end_date } = req.body;

    const integration = await Integration.findByPk(id);
    if (!integration) {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found'
      });
    }

    if (integration.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'Integration must be active to perform sync'
      });
    }

    let service;
    let syncResult;

    switch (integration.integration_type) {
      case 'pos':
        service = new POSIntegrationService(id);
        if (sync_type === 'menus') {
          syncResult = await service.syncMenus();
        } else {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid sync_type for POS integration. Use: menus'
          });
        }
        break;
      case 'pms':
        service = new PMSIntegrationService(id);
        if (sync_type === 'reservations') {
          syncResult = await service.syncReservations(start_date, end_date);
        } else {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid sync_type for PMS integration. Use: reservations'
          });
        }
        break;
      case 'guest_management':
        service = new GuestManagementIntegrationService(id);
        if (sync_type === 'guest_data') {
          syncResult = await service.syncGuestData();
        } else {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid sync_type for Guest Management integration. Use: guest_data'
          });
        }
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Unsupported integration type'
        });
    }

    res.json({
      status: 'success',
      data: syncResult
    });
  } catch (error) {
    console.error('Error syncing integration:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync integration',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/integrations/{id}/logs:
 *   get:
 *     summary: Get integration logs
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Integration ID
 *       - in: query
 *         name: operation_type
 *         schema:
 *           type: string
 *           enum: [sync, webhook, api_call, error, test]
 *         description: Filter by operation type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed, partial, pending]
 *         description: Filter by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: Integration logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { operation_type, status, limit = 50, offset = 0 } = req.query;

    const integration = await Integration.findByPk(id);
    if (!integration) {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found'
      });
    }

    const whereClause = { integration_id: parseInt(id) };
    
    if (operation_type) {
      whereClause.operation_type = operation_type;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const logs = await IntegrationLog.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await IntegrationLog.count({ where: whereClause });

    res.json({
      status: 'success',
      data: {
        logs,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching integration logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch integration logs'
    });
  }
});

/**
 * @swagger
 * /api/integrations/{id}:
 *   delete:
 *     summary: Delete integration
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Integration ID
 *     responses:
 *       200:
 *         description: Integration deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const integration = await Integration.findByPk(id);
    if (!integration) {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found'
      });
    }

    await integration.destroy();

    res.json({
      status: 'success',
      message: 'Integration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting integration:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete integration'
    });
  }
});

module.exports = router; 