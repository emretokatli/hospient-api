# Integration Layer Implementation Guide

## Overview

This document describes the comprehensive Integration Layer implementation for the Hospient API that enables seamless integration with 3rd party systems including Hotel POS Systems, PMS Systems, and Guest Management Systems.

## Architecture

### Core Components

1. **Integration Models** (`src/models/`)
   - `integration.model.js` - Stores integration configurations and credentials
   - `integration_log.model.js` - Tracks all integration activities and sync operations

2. **Base Integration Service** (`src/services/integration/`)
   - `base-integration.service.js` - Common functionality for all integrations
   - `pos-integration.service.js` - Hotel POS system integration
   - `pms-integration.service.js` - Property Management System integration
   - `guest-management-integration.service.js` - Guest management system integration

3. **API Routes** (`src/routes/`)
   - `integration.routes.js` - Management endpoints for integrations
   - `webhook.routes.js` - Webhook endpoints for receiving updates

## Integration Types

### 1. Hotel POS Systems

**Purpose**: Synchronize menus and post guest checks

**Features**:
- Menu synchronization from POS to Hospient
- Post guest checks to POS system
- Check status monitoring
- Menu category management

**Supported Operations**:
```javascript
// Sync menus from POS
await posService.syncMenus();

// Post guest check
await posService.postGuestCheck({
  guestId: 123,
  roomNumber: '101',
  items: [
    { menuId: 1, quantity: 2, unitPrice: 15.99, totalPrice: 31.98 }
  ],
  subtotal: 31.98,
  tax: 2.56,
  total: 34.54,
  paymentMethod: 'credit_card',
  paymentStatus: 'pending'
});

// Get check status
await posService.getCheckStatus('check_123');

// Void check
await posService.voidCheck('check_123', 'Guest request');
```

### 2. Hotel PMS Systems

**Purpose**: Manage reservations, check-ins, and room status

**Features**:
- Reservation synchronization
- Check-in/check-out posting
- Room status monitoring
- Guest information management

**Supported Operations**:
```javascript
// Sync reservations
await pmsService.syncReservations('2024-01-01', '2024-12-31');

// Post check-in
await pmsService.postCheckIn({
  reservationId: 'res_123',
  guestId: 456,
  roomNumber: '101',
  checkInTime: new Date(),
  checkInBy: 'staff_member',
  specialRequests: 'Late check-in',
  paymentMethod: 'credit_card',
  depositAmount: 100.00
});

// Post check-out
await pmsService.postCheckOut({
  reservationId: 'res_123',
  guestId: 456,
  roomNumber: '101',
  checkOutTime: new Date(),
  finalBillAmount: 450.00,
  paymentStatus: 'paid',
  feedbackRating: 5,
  feedbackComments: 'Excellent stay!'
});

// Get room status
await pmsService.getRoomStatus('101');
```

### 3. Guest Management Systems

**Purpose**: Handle feedback, chat, and notifications

**Features**:
- Feedback posting and retrieval
- Chat message synchronization
- Notification management
- Guest data synchronization

**Supported Operations**:
```javascript
// Post feedback
await guestMgmtService.postFeedback({
  guestId: 123,
  hotelId: 1,
  roomNumber: '101',
  rating: 5,
  category: 'service',
  title: 'Excellent Service',
  message: 'The staff was very helpful',
  isAnonymous: false
});

// Post chat message
await guestMgmtService.postChatMessage({
  guestId: 123,
  hotelId: 1,
  roomNumber: '101',
  message: 'Can I get extra towels?',
  messageType: 'text',
  senderType: 'guest',
  senderId: 123,
  senderName: 'John Doe'
});

// Post notification
await guestMgmtService.postNotification({
  guestId: 123,
  hotelId: 1,
  roomNumber: '101',
  title: 'Pool Maintenance',
  message: 'Pool will be closed for maintenance from 2-4 PM',
  category: 'service',
  priority: 'normal',
  notificationType: 'push'
});

// Sync guest data
await guestMgmtService.syncGuestData();
```

## API Endpoints

### Integration Management

#### Get Integrations
```
GET /api/integrations?hotel_id=1&integration_type=pos&status=active
```

#### Create Integration
```
POST /api/integrations
{
  "hotel_id": 1,
  "integration_type": "pos",
  "provider_name": "Square POS",
  "provider_version": "2.0",
  "config": {
    "baseUrl": "https://api.square.com/v2",
    "endpoints": {
      "menus": "/catalog/items",
      "checks": "/orders"
    },
    "testEndpoint": "/health"
  },
  "credentials": {
    "apiKey": "your-api-key",
    "locationId": "your-location-id"
  },
  "webhook_url": "https://your-domain.com/api/webhooks/1",
  "webhook_secret": "your-webhook-secret",
  "sync_settings": {
    "auto_sync": true,
    "sync_interval": "hourly"
  }
}
```

#### Test Integration
```
POST /api/integrations/1/test
```

#### Trigger Sync
```
POST /api/integrations/1/sync
{
  "sync_type": "menus"
}
```

#### Get Integration Logs
```
GET /api/integrations/1/logs?operation_type=sync&status=success&limit=50&offset=0
```

### Webhook Endpoints

#### Receive Webhook
```
POST /api/webhooks/1
Headers:
  X-Webhook-Signature: sha256=...
Body:
{
  "event_type": "menu_updated",
  "data": {
    "menu_id": "menu_123",
    "changes": ["name", "price"]
  }
}
```

## Security Features

### 1. Credential Encryption
- All sensitive credentials are encrypted using AES-256-CBC
- Encryption key stored in environment variables
- Automatic encryption/decryption in base service

### 2. Webhook Signature Validation
- HMAC-SHA256 signature validation
- Configurable webhook secrets per integration
- Automatic signature verification for incoming webhooks

### 3. Rate Limiting
- Inherits existing rate limiting from main API
- Separate limits for webhook endpoints
- Configurable per integration type

### 4. Access Control
- Integration management requires authentication
- Hotel-specific data isolation
- Role-based access control

## Configuration Examples

### Square POS Integration
```javascript
{
  "integration_type": "pos",
  "provider_name": "Square POS",
  "config": {
    "baseUrl": "https://connect.squareup.com",
    "endpoints": {
      "menus": "/v2/catalog/items",
      "checks": "/v2/orders",
      "categories": "/v2/catalog/categories"
    },
    "testEndpoint": "/v2/locations"
  },
  "credentials": {
    "accessToken": "your-access-token",
    "locationId": "your-location-id"
  }
}
```

### Opera PMS Integration
```javascript
{
  "integration_type": "pms",
  "provider_name": "Opera PMS",
  "config": {
    "baseUrl": "https://api.operasoftware.com",
    "endpoints": {
      "reservations": "/v1/reservations",
      "checkins": "/v1/checkins",
      "checkouts": "/v1/checkouts",
      "rooms": "/v1/rooms",
      "guests": "/v1/guests"
    },
    "testEndpoint": "/v1/health"
  },
  "credentials": {
    "apiKey": "your-api-key",
    "hotelCode": "your-hotel-code"
  }
}
```

### Salesforce Guest Management
```javascript
{
  "integration_type": "guest_management",
  "provider_name": "Salesforce",
  "config": {
    "baseUrl": "https://your-instance.salesforce.com",
    "endpoints": {
      "feedback": "/services/data/v58.0/sobjects/Feedback__c",
      "chat": "/services/data/v58.0/sobjects/Chat_Message__c",
      "notifications": "/services/data/v58.0/sobjects/Notification__c",
      "guests": "/services/data/v58.0/sobjects/Contact"
    },
    "testEndpoint": "/services/data/v58.0/sobjects/User"
  },
  "credentials": {
    "accessToken": "your-access-token",
    "instanceUrl": "https://your-instance.salesforce.com"
  }
}
```

## Monitoring and Logging

### Integration Logs
All integration activities are automatically logged with:
- Operation type (sync, webhook, api_call, error, test)
- Direction (inbound, outbound, bidirectional)
- Status (success, failed, partial, pending)
- Processing time
- Records processed/success/failed
- Request/response data
- Error messages and codes

### Health Monitoring
- Integration status tracking (active, inactive, error, testing)
- Error count and last error message
- Last sync timestamp and status
- Connection testing capabilities

### Webhook Monitoring
- Webhook signature validation
- Incoming webhook processing logs
- Error handling and retry mechanisms

## Best Practices

### 1. Integration Setup
- Always test connections before activating
- Use environment-specific configurations
- Implement proper error handling
- Set up monitoring and alerting

### 2. Data Synchronization
- Use incremental sync when possible
- Implement conflict resolution strategies
- Handle partial failures gracefully
- Monitor sync performance

### 3. Security
- Rotate API keys regularly
- Use webhook signatures for validation
- Encrypt all sensitive data
- Implement proper access controls

### 4. Error Handling
- Log all errors with context
- Implement retry mechanisms
- Provide clear error messages
- Monitor error rates

## Testing

### Manual Testing
```bash
# Test integration connection
curl -X POST http://localhost:3000/api/integrations/1/test \
  -H "Authorization: Bearer your-token"

# Trigger menu sync
curl -X POST http://localhost:3000/api/integrations/1/sync \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"sync_type": "menus"}'

# Test webhook
curl -X POST http://localhost:3000/api/webhooks/1 \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=..." \
  -d '{"event_type": "menu_updated", "data": {"menu_id": "123"}}'
```

### Automated Testing
- Unit tests for each integration service
- Integration tests for API endpoints
- Webhook signature validation tests
- Error handling and retry tests

## Deployment Considerations

### Environment Variables
```bash
# Encryption key for credentials
ENCRYPTION_KEY=your-secure-encryption-key

# Integration-specific settings
INTEGRATION_TIMEOUT=30000
INTEGRATION_RETRY_ATTEMPTS=3
WEBHOOK_TIMEOUT=10000
```

### Database Migrations
Run migrations to create integration tables:
```bash
npx sequelize-cli db:migrate
```

### Monitoring Setup
- Set up alerts for integration failures
- Monitor webhook processing times
- Track sync success rates
- Monitor API rate limits

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check API credentials
   - Verify network connectivity
   - Check rate limits
   - Validate endpoint URLs

2. **Webhook Failures**
   - Verify webhook signature
   - Check webhook URL accessibility
   - Validate payload format
   - Monitor webhook processing logs

3. **Sync Failures**
   - Check data format compatibility
   - Verify required fields
   - Monitor error logs
   - Check integration status

4. **Performance Issues**
   - Optimize sync intervals
   - Implement pagination
   - Use incremental sync
   - Monitor processing times

### Debug Commands
```bash
# Check integration status
curl -X GET http://localhost:3000/api/integrations/1 \
  -H "Authorization: Bearer your-token"

# View integration logs
curl -X GET "http://localhost:3000/api/integrations/1/logs?limit=10" \
  -H "Authorization: Bearer your-token"

# Test webhook health
curl -X GET http://localhost:3000/api/webhooks/health
```

## Conclusion

This Integration Layer provides a robust, secure, and scalable solution for integrating with 3rd party hotel systems. The modular architecture allows for easy extension to support additional integration types, while the comprehensive logging and monitoring ensure reliable operation in production environments.

For additional support or questions, refer to the API documentation at `/api-docs` or contact the development team. 