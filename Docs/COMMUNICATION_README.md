# Hotel Communication System

This document describes the hotel communication system that enables hotels to interact with guests and walk-in customers through a PWA application. The system supports multiple communication types including feedback, chat, notifications, and push notifications.

## Overview

The communication system supports four main types of interactions:

### 1. **Feedback System**
- Guest and staff feedback submissions
- Anonymous feedback support
- Rating system (1-5 stars)
- Categorized feedback (service, room, restaurant, spa, activity)
- Tag-based organization

### 2. **Chat System**
- Real-time messaging between hotel and guests
- Threaded conversations with replies
- Support for different sender types (hotel, guest, staff)
- Message metadata for rich content

### 3. **Notification System**
- In-app notifications for guests and walk-in customers
- Scheduled notifications
- Expiration times
- Priority levels (low, normal, high, urgent)
- Multiple categories (general, service, room, restaurant, spa, activity, emergency, promotion)

### 4. **Push Notification System**
- Instant push notifications to specific devices
- Device token management
- Rich content support through metadata
- Priority-based delivery

## Database Structure

### Communications Table

The `communications` table contains the following fields:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | INTEGER | Auto-increment primary key | Yes |
| `hotel_id` | INTEGER | Foreign key to hotels table | Yes |
| `type` | ENUM | Communication type (feedback, chat, notification, push_notification) | Yes |
| `category` | ENUM | Category (general, service, room, restaurant, spa, activity, emergency, promotion) | No (default: general) |
| `title` | VARCHAR(255) | Title of the communication | Yes |
| `message` | TEXT | Main message content | Yes |
| `sender_type` | ENUM | Type of sender (hotel, guest, staff) | Yes |
| `sender_id` | INTEGER | ID of the sender | No |
| `sender_name` | VARCHAR(255) | Name of the sender | No |
| `recipient_type` | ENUM | Type of recipient (guest, walkin, all, specific) | No (default: all) |
| `recipient_id` | INTEGER | Specific recipient ID | No |
| `recipient_device_token` | VARCHAR(500) | Device token for push notifications | No |
| `priority` | ENUM | Priority level (low, normal, high, urgent) | No (default: normal) |
| `status` | ENUM | Status (draft, sent, delivered, read, failed) | No (default: draft) |
| `read_at` | DATETIME | When message was read | No |
| `delivered_at` | DATETIME | When message was delivered | No |
| `scheduled_at` | DATETIME | Scheduled time for notifications | No |
| `expires_at` | DATETIME | Expiration time | No |
| `metadata` | JSON | Additional data (images, links, actions) | No |
| `rating` | INTEGER | Rating for feedback (1-5) | No |
| `response_to_id` | INTEGER | ID of parent message for replies | No |
| `is_anonymous` | BOOLEAN | Whether sender is anonymous | No (default: false) |
| `tags` | JSON | Tags for categorization | No |
| `language` | VARCHAR(10) | Language of communication | No (default: en) |
| `created_at` | DATETIME | Creation timestamp | Auto |
| `updated_at` | DATETIME | Last update timestamp | Auto |

## API Endpoints

### Base URL: `/api/communications`

#### 1. Get All Communications
```
GET /api/communications
```

**Query Parameters:**
- `hotel_id` (integer) - Filter by hotel ID
- `type` (string) - Filter by communication type
- `category` (string) - Filter by category
- `sender_type` (string) - Filter by sender type
- `status` (string) - Filter by status
- `priority` (string) - Filter by priority
- `page` (integer) - Page number for pagination
- `limit` (integer) - Items per page

#### 2. Get Communication by ID
```
GET /api/communications/{id}
```

#### 3. Create Communication
```
POST /api/communications
```

#### 4. Update Communication
```
PUT /api/communications/{id}
```

#### 5. Delete Communication
```
DELETE /api/communications/{id}
```

#### 6. Get Hotel Communications
```
GET /api/communications/hotel/{hotelId}
```

#### 7. Mark Communication as Read
```
PUT /api/communications/{id}/mark-read
```

### Specialized Endpoints

#### 8. Submit Feedback
```
POST /api/communications/feedback
```

**Request Body:**
```json
{
  "hotel_id": 1,
  "title": "Great Service Experience",
  "message": "The staff was very helpful and friendly",
  "sender_type": "guest",
  "sender_id": 123,
  "sender_name": "John Doe",
  "category": "service",
  "rating": 5,
  "is_anonymous": false,
  "tags": ["positive", "staff", "service"]
}
```

#### 9. Send Chat Message
```
POST /api/communications/chat
```

**Request Body:**
```json
{
  "hotel_id": 1,
  "message": "Hello, I need help with my room service order",
  "sender_type": "guest",
  "sender_id": 123,
  "sender_name": "John Doe",
  "recipient_type": "all",
  "response_to_id": null,
  "metadata": {
    "attachments": [],
    "quick_replies": ["Yes", "No", "Maybe"]
  }
}
```

#### 10. Send Notification
```
POST /api/communications/notifications
```

**Request Body:**
```json
{
  "hotel_id": 1,
  "title": "Pool Maintenance Notice",
  "message": "The pool will be closed for maintenance from 2-4 PM today",
  "category": "service",
  "recipient_type": "all",
  "priority": "normal",
  "scheduled_at": "2024-01-15T10:00:00.000Z",
  "expires_at": "2024-01-15T18:00:00.000Z",
  "metadata": {
    "action_url": "/pool-schedule",
    "image_url": "/images/pool-notice.jpg"
  }
}
```

#### 11. Send Push Notification
```
POST /api/communications/push-notifications
```

**Request Body:**
```json
{
  "hotel_id": 1,
  "title": "Welcome to Our Hotel!",
  "message": "Enjoy your stay with us. Don't forget to check out our spa offers.",
  "category": "promotion",
  "recipient_device_token": "device_token_here",
  "priority": "high",
  "metadata": {
    "deep_link": "/offers/spa",
    "image_url": "/images/spa-offer.jpg",
    "action_buttons": [
      {"title": "View Offers", "action": "view_offers"},
      {"title": "Book Spa", "action": "book_spa"}
    ]
  }
}
```

## Setup Instructions

### 1. Run the Migration

To create the communications table in your database, run:

```bash
cd api
node run-communication-migration.js
```

### 2. Verify Installation

After running the migration, you can test the API:

```bash
# Get all communications
curl http://localhost:3000/api/communications

# Submit feedback
curl -X POST http://localhost:3000/api/communications/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "hotel_id": 1,
    "title": "Test Feedback",
    "message": "This is a test feedback message",
    "sender_type": "guest",
    "rating": 5
  }'

# Send a chat message
curl -X POST http://localhost:3000/api/communications/chat \
  -H "Content-Type: application/json" \
  -d '{
    "hotel_id": 1,
    "message": "Hello, I need assistance",
    "sender_type": "guest",
    "sender_name": "Test User"
  }'
```

## Usage Examples

### Feedback Management

#### Submit Guest Feedback
```json
{
  "hotel_id": 1,
  "title": "Excellent Spa Experience",
  "message": "The spa treatment was amazing. The staff was professional and the facilities were clean.",
  "sender_type": "guest",
  "sender_id": 123,
  "sender_name": "Sarah Johnson",
  "category": "spa",
  "rating": 5,
  "tags": ["spa", "positive", "staff", "cleanliness"]
}
```

#### Submit Anonymous Feedback
```json
{
  "hotel_id": 1,
  "title": "Room Service Improvement Needed",
  "message": "The room service was slow and the food was cold when it arrived.",
  "sender_type": "guest",
  "category": "service",
  "rating": 2,
  "is_anonymous": true,
  "tags": ["room_service", "negative", "timing"]
}
```

### Chat System

#### Start a New Chat
```json
{
  "hotel_id": 1,
  "message": "I need help with my reservation",
  "sender_type": "guest",
  "sender_id": 123,
  "sender_name": "John Doe",
  "recipient_type": "all"
}
```

#### Reply to a Chat Message
```json
{
  "hotel_id": 1,
  "message": "I can help you with your reservation. What's your reservation number?",
  "sender_type": "hotel",
  "sender_name": "Hotel Staff",
  "recipient_type": "specific",
  "recipient_id": 123,
  "response_to_id": 456
}
```

### Notification System

#### Send Emergency Notification
```json
{
  "hotel_id": 1,
  "title": "Emergency Alert",
  "message": "Please evacuate the building immediately. This is not a drill.",
  "category": "emergency",
  "recipient_type": "all",
  "priority": "urgent",
  "metadata": {
    "sound": "emergency_alert",
    "vibrate": true,
    "action_url": "/emergency-procedures"
  }
}
```

#### Send Promotional Notification
```json
{
  "hotel_id": 1,
  "title": "Weekend Special Offer",
  "message": "Get 20% off on all spa treatments this weekend!",
  "category": "promotion",
  "recipient_type": "all",
  "priority": "normal",
  "scheduled_at": "2024-01-20T09:00:00.000Z",
  "expires_at": "2024-01-22T23:59:59.000Z",
  "metadata": {
    "image_url": "/images/spa-promo.jpg",
    "action_url": "/offers/spa-weekend",
    "coupon_code": "SPA20"
  }
}
```

### Push Notifications

#### Welcome Push Notification
```json
{
  "hotel_id": 1,
  "title": "Welcome to Grand Hotel!",
  "message": "Your room is ready. Check-in at the front desk.",
  "category": "service",
  "recipient_device_token": "fcm_token_here",
  "priority": "high",
  "metadata": {
    "deep_link": "/check-in",
    "image_url": "/images/welcome.jpg",
    "sound": "welcome_chime"
  }
}
```

## Features

### Multi-language Support
- Language field for international hotels
- Default language: English (en)
- Support for multiple languages per hotel

### Priority System
- **Low**: General information, non-urgent updates
- **Normal**: Regular notifications, standard communications
- **High**: Important updates, time-sensitive information
- **Urgent**: Emergency alerts, critical notifications

### Status Tracking
- **Draft**: Message created but not sent
- **Sent**: Message has been sent
- **Delivered**: Message delivered to recipient
- **Read**: Message has been read by recipient
- **Failed**: Message delivery failed

### Metadata Support
- Rich content (images, links, actions)
- Custom data for different communication types
- Action buttons for push notifications
- Deep linking support

### Anonymous Feedback
- Support for anonymous feedback submissions
- Privacy protection for sensitive feedback
- Still maintains categorization and rating

### Chat Threading
- Reply system for chat messages
- Threaded conversations
- Parent-child message relationships
- Easy conversation tracking

## Performance Optimizations

### Database Indexes
- Indexes on frequently queried fields
- Composite indexes for complex queries
- Optimized for hotel-specific queries

### Efficient Queries
- Pagination support for large datasets
- Filtering by multiple criteria
- Optimized joins with hotel data

### Real-time Capabilities
- Support for WebSocket integration
- Push notification delivery
- Status tracking for message delivery

## Integration with PWA

### WebSocket Support
The system is designed to work with WebSocket connections for real-time chat and notifications:

```javascript
// Example WebSocket connection
const ws = new WebSocket('ws://localhost:3000/communications/ws');

ws.onmessage = (event) => {
  const communication = JSON.parse(event.data);
  // Handle incoming communication
  displayMessage(communication);
};
```

### Push Notification Integration
For push notifications, integrate with Firebase Cloud Messaging (FCM) or similar services:

```javascript
// Example push notification handling
messaging.onMessage((payload) => {
  const communication = payload.data;
  // Display notification in PWA
  showNotification(communication);
});
```

## Swagger Documentation

Complete API documentation is available at:
```
http://localhost:3000/api-docs
```

The communications endpoints are automatically included in the Swagger documentation with full schema definitions and examples.

## Security Considerations

### Data Privacy
- Anonymous feedback support
- Secure device token handling
- GDPR compliance considerations

### Access Control
- Hotel-specific data isolation
- Role-based access for different sender types
- Secure API endpoints

### Message Validation
- Input validation for all fields
- XSS protection for message content
- Rate limiting for spam prevention 