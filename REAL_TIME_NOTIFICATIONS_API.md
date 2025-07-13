# Real-Time Notifications API Documentation

This document explains the real-time notification system implementation using WebSocket technology.

## Overview

The real-time notification system allows instant delivery of notifications from the backoffice to guests via WebSocket connections. When a notification is created in the backoffice, it's immediately sent to all relevant guests who are currently connected.

## Architecture

### Components

1. **WebSocket Server** (`/src/websocket/notificationServer.js`)
   - Handles WebSocket connections from guests
   - Manages connection lifecycle
   - Routes notifications to appropriate guests

2. **Communication Routes** (`/src/routes/communication.routes.js`)
   - Creates notifications in database
   - Sends real-time notifications via WebSocket
   - Provides test endpoints

3. **Frontend WebSocket Client** (`app/web/src/services/websocketService.ts`)
   - Connects to WebSocket server
   - Handles reconnection logic
   - Processes incoming notifications

## WebSocket Server

### Connection URL
```
ws://localhost:3000/ws/notifications?token={guestToken}&guestId={guestId}
```

### Authentication
- Uses JWT token for authentication
- Validates token and guestId match
- Closes connection if authentication fails

### Connection Management
- Stores connections by guest ID
- Handles multiple connections per guest
- Automatically cleans up closed connections

## API Endpoints

### 1. Create Notification (with Real-Time Delivery)

**POST** `/api/communications`

Creates a notification and sends it immediately via WebSocket to relevant guests.

**Request Body:**
```json
{
  "hotel_id": 1,
  "type": "notification",
  "title": "Pool Maintenance",
  "message": "The pool will be closed for maintenance from 2-4 PM",
  "category": "service",
  "recipient_type": "all",
  "priority": "normal",
  "sender_type": "hotel"
}
```

**Real-Time Behavior:**
- For `recipient_type: "guest"` + `recipient_id: 123` → Sends to guest 123 only
- For `recipient_type: "all"` → Sends to all connected guests
- For `recipient_type: "walkin"` → Sends to all connected guests
- For `recipient_type: "specific"` → Sends to specific guest by recipient_id

### 2. WebSocket Statistics

**GET** `/api/communications/websocket/stats`

Returns current WebSocket connection statistics.

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalConnections": 5,
    "uniqueGuests": 3,
    "guests": [
      {
        "guestId": 123,
        "connections": 2
      },
      {
        "guestId": 456,
        "connections": 1
      },
      {
        "guestId": 789,
        "connections": 2
      }
    ]
  }
}
```

### 3. Test WebSocket Notification

**POST** `/api/communications/websocket/test`

Sends a test notification to a specific guest via WebSocket.

**Request Body:**
```json
{
  "guestId": 123,
  "message": "This is a test notification"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Test notification sent to guest 123"
}
```

## WebSocket Message Format

### Incoming Messages (from server to client)

**Notification Message:**
```json
{
  "type": "notification",
  "data": {
    "id": 123,
    "hotel_id": 1,
    "type": "notification",
    "title": "Pool Maintenance",
    "message": "The pool will be closed for maintenance",
    "category": "service",
    "priority": "normal",
    "sender_type": "hotel",
    "recipient_type": "all",
    "status": "sent",
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Connection Confirmation:**
```json
{
  "type": "connection",
  "data": {
    "status": "connected",
    "guestId": 123,
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

**System Message:**
```json
{
  "type": "system",
  "data": {
    "message": "Server maintenance in 5 minutes",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

## Frontend Integration

### WebSocket Service Usage

```typescript
import { websocketService } from '../services/websocketService';

// Connect to WebSocket
websocketService.connect(token, guestId);

// Add message listener
websocketService.addListener('my-component', (message) => {
  if (message.type === 'notification') {
    // Handle new notification
    console.log('New notification:', message.data);
  }
});

// Remove listener when component unmounts
websocketService.removeListener('my-component');
```

### Notification Context Usage

```typescript
import { useNotifications } from '../contexts/NotificationContext';

const { notifications, unreadCount, isConnected } = useNotifications();
```

## Testing

### 1. Test WebSocket Connection

```bash
# Get WebSocket statistics
curl -X GET http://localhost:3000/api/communications/websocket/stats

# Send test notification
curl -X POST http://localhost:3000/api/communications/websocket/test \
  -H "Content-Type: application/json" \
  -d '{"guestId": 123, "message": "Test notification"}'
```

### 2. Test from Frontend

```javascript
// In browser console
import { websocketService } from './src/services/websocketService';

// Check connection status
console.log('Connected:', websocketService.isConnected());

// Test notification (if you have the context)
import { useNotifications } from './src/contexts/NotificationContext';
const { addNotification } = useNotifications();

addNotification({
  id: 999,
  title: 'Test',
  message: 'Test notification',
  // ... other fields
});
```

### 3. Monitor WebSocket Traffic

Use browser developer tools:
1. Open Network tab
2. Filter by "WS" (WebSocket)
3. Look for connections to `/ws/notifications`
4. Monitor message traffic

## Error Handling

### WebSocket Connection Errors

- **Authentication Failed**: Invalid token or guestId mismatch
- **Connection Lost**: Automatic reconnection with exponential backoff
- **Server Unavailable**: Graceful degradation to polling

### Notification Delivery Errors

- **Guest Not Connected**: Notification stored in database, delivered on next connection
- **Connection Lost**: Notification queued for retry
- **Invalid Recipient**: Error logged, notification not sent

## Performance Considerations

### Connection Limits
- No hard limit on connections per guest
- Automatic cleanup of closed connections
- Memory usage scales with active connections

### Message Delivery
- Immediate delivery for connected guests
- Database storage for offline guests
- No message queuing (messages are lost if guest is offline)

### Scalability
- Single WebSocket server instance
- Horizontal scaling requires sticky sessions
- Consider Redis for connection sharing across instances

## Security

### Authentication
- JWT token validation on connection
- Guest ID verification
- Automatic connection termination on auth failure

### Data Privacy
- Notifications only sent to intended recipients
- No cross-guest data leakage
- Secure WebSocket upgrade process

## Troubleshooting

### Common Issues

1. **WebSocket Not Connecting**
   - Check if WebSocket server is running
   - Verify token and guestId parameters
   - Check browser console for errors

2. **Notifications Not Arriving**
   - Verify guest is connected to WebSocket
   - Check recipient_type and recipient_id
   - Monitor server logs for errors

3. **Multiple Connections**
   - Normal behavior for multiple browser tabs
   - Each connection receives notifications
   - Automatic cleanup on tab close

### Debug Commands

```bash
# Check WebSocket server status
curl http://localhost:3000/api/communications/websocket/stats

# Test notification delivery
curl -X POST http://localhost:3000/api/communications/websocket/test \
  -H "Content-Type: application/json" \
  -d '{"guestId": 123, "message": "Debug test"}'

# Monitor server logs
tail -f logs/app.log | grep -i websocket
```

## Deployment

### Environment Variables
```bash
JWT_SECRET=your-jwt-secret
PORT=3000
NODE_ENV=production
```

### Production Considerations
- Use HTTPS/WSS in production
- Configure reverse proxy for WebSocket upgrade
- Monitor WebSocket connection count
- Set up logging for WebSocket events

### Load Balancer Configuration
```nginx
# Nginx configuration for WebSocket support
location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Future Enhancements

1. **Message Queuing**: Store offline notifications for later delivery
2. **Push Notifications**: Integrate with FCM/APNS for mobile notifications
3. **Message Acknowledgment**: Track notification delivery and read status
4. **Rate Limiting**: Prevent notification spam
5. **Message Templates**: Predefined notification templates
6. **Scheduled Notifications**: Send notifications at specific times
7. **Notification Preferences**: Allow guests to customize notification settings 