const express = require('express');
const router = express.Router();
const { Integration, IntegrationLog } = require('../models');
const POSIntegrationService = require('../services/integration/pos-integration.service');
const PMSIntegrationService = require('../services/integration/pms-integration.service');
const GuestManagementIntegrationService = require('../services/integration/guest-management-integration.service');

// Webhook endpoint for receiving updates from 3rd party systems
router.post('/:integrationId', async (req, res) => {
  try {
    const { integrationId } = req.params;
    const { body, headers } = req;

    // Find the integration
    const integration = await Integration.findByPk(integrationId);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    // Validate webhook signature if secret is configured
    if (integration.webhook_secret) {
      const signature = headers['x-webhook-signature'] || headers['x-signature'];
      if (!signature) {
        return res.status(401).json({ error: 'Missing webhook signature' });
      }

      const baseService = new (require('../services/integration/base-integration.service'))();
      const isValid = baseService.validateWebhookSignature(
        JSON.stringify(body),
        signature,
        integration.webhook_secret
      );

      if (!isValid) {
        await baseService.logActivity('webhook', 'webhook_validation', 'inbound', 'failed', {
          error: 'Invalid webhook signature',
          request: { headers, body }
        });
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    // Process webhook based on integration type
    let service;
    let result;

    switch (integration.integration_type) {
      case 'pos':
        service = new POSIntegrationService(integrationId);
        result = await processPOSWebhook(service, body);
        break;
      case 'pms':
        service = new PMSIntegrationService(integrationId);
        result = await processPMSWebhook(service, body);
        break;
      case 'guest_management':
        service = new GuestManagementIntegrationService(integrationId);
        result = await processGuestManagementWebhook(service, body);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported integration type' });
    }

    // Log successful webhook processing
    await service.logActivity('webhook', 'webhook_processing', 'inbound', 'success', {
      request: { headers, body },
      response: result
    });

    res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Log webhook error
    try {
      const baseService = new (require('../services/integration/base-integration.service'))();
      await baseService.logActivity('webhook', 'webhook_processing', 'inbound', 'failed', {
        error: error.message,
        request: { headers: req.headers, body: req.body }
      });
    } catch (logError) {
      console.error('Error logging webhook error:', logError);
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process POS webhook
async function processPOSWebhook(service, webhookData) {
  const { event_type, data } = webhookData;

  switch (event_type) {
    case 'menu_updated':
      // Sync updated menu
      await service.syncMenus();
      return { action: 'menu_sync_triggered' };
    
    case 'check_created':
      // Handle new check creation
      return { action: 'check_created', check_id: data.check_id };
    
    case 'check_updated':
      // Handle check updates
      return { action: 'check_updated', check_id: data.check_id };
    
    case 'check_voided':
      // Handle check voiding
      return { action: 'check_voided', check_id: data.check_id };
    
    default:
      throw new Error(`Unsupported POS webhook event: ${event_type}`);
  }
}

// Process PMS webhook
async function processPMSWebhook(service, webhookData) {
  const { event_type, data } = webhookData;

  switch (event_type) {
    case 'reservation_created':
      // Sync new reservation
      await service.syncReservations();
      return { action: 'reservation_sync_triggered' };
    
    case 'reservation_updated':
      // Sync updated reservation
      await service.syncReservations();
      return { action: 'reservation_sync_triggered' };
    
    case 'check_in':
      // Handle check-in event
      return { action: 'check_in', reservation_id: data.reservation_id };
    
    case 'check_out':
      // Handle check-out event
      return { action: 'check_out', reservation_id: data.reservation_id };
    
    case 'room_status_changed':
      // Handle room status change
      return { action: 'room_status_changed', room_number: data.room_number };
    
    default:
      throw new Error(`Unsupported PMS webhook event: ${event_type}`);
  }
}

// Process Guest Management webhook
async function processGuestManagementWebhook(service, webhookData) {
  const { event_type, data } = webhookData;

  switch (event_type) {
    case 'feedback_submitted':
      // Handle new feedback
      return { action: 'feedback_received', feedback_id: data.feedback_id };
    
    case 'chat_message_received':
      // Handle new chat message
      return { action: 'chat_message_received', message_id: data.message_id };
    
    case 'notification_sent':
      // Handle notification sent
      return { action: 'notification_sent', notification_id: data.notification_id };
    
    case 'guest_updated':
      // Sync guest data
      await service.syncGuestData(data.guest_id);
      return { action: 'guest_sync_triggered' };
    
    default:
      throw new Error(`Unsupported Guest Management webhook event: ${event_type}`);
  }
}

// Health check endpoint for webhooks
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router; 