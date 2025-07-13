# Concierge Services API

This document describes the Concierge Services API endpoints and setup instructions for the Vivatalia Hotel Management System.

## Overview

The Concierge Services API provides endpoints for managing concierge categories and requests. It allows hotels to organize and track guest service requests efficiently.

## Features

- **Hierarchical Categories**: Support for parent-child category relationships
- **Request Management**: Full CRUD operations for concierge requests
- **Status Tracking**: Track request status (requested, in_progress, done, cancelled)
- **Scheduling**: Support for scheduled requests
- **JSON Details**: Flexible JSON payload for additional request details

## Database Setup

### Option 1: Using the Migration Script (Recommended)

```bash
# Run the concierge migration script
npm run concierge:migrate
```

### Option 2: Using Sequelize CLI

```bash
# Run all migrations including concierge tables
npm run db:migrate
```

### Option 3: Manual SQL

If you prefer to run the SQL manually, execute the following in your MySQL database:

```sql
-- Create concierge_categories table
CREATE TABLE IF NOT EXISTS concierge_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES concierge_categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_parent_id (parent_id),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create concierge_requests table
CREATE TABLE IF NOT EXISTS concierge_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotel_id INT NOT NULL,
  guest_id INT NULL,
  category_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  details TEXT NULL COMMENT 'JSON payload for additional request details',
  status ENUM('requested', 'in_progress', 'done', 'cancelled') DEFAULT 'requested' NOT NULL,
  scheduled_for DATETIME NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES concierge_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_guest_id (guest_id),
  INDEX idx_created_at (created_at),
  INDEX idx_scheduled_for (scheduled_for)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample categories
INSERT IGNORE INTO concierge_categories (name, description, created_at, updated_at) VALUES
('Transportation', 'Transportation and travel services', NOW(), NOW()),
('Dining & Reservations', 'Restaurant reservations and dining services', NOW(), NOW()),
('Entertainment', 'Entertainment and activity bookings', NOW(), NOW()),
('Spa & Wellness', 'Spa treatments and wellness services', NOW(), NOW()),
('Business Services', 'Business and meeting room services', NOW(), NOW()),
('Housekeeping', 'Housekeeping and room service requests', NOW(), NOW()),
('Personal Assistance', 'Shopping and translation', NOW(), NOW()),
('Information Provision and Referral','City guide and events calendar', NOW(), NOW()),
('Emergency Assistance', 'Lost passport and medical need', NOW(), NOW());
```

## API Endpoints

### Concierge Categories

#### GET /api/concierge/categories
Get all concierge categories with their sub-categories.

**Response:**
```json
[
  {
    "id": 1,
    "parent_id": null,
    "name": "Transportation",
    "description": "Transportation and travel services",
    "created_at": "2024-03-22T10:00:00.000Z",
    "updated_at": "2024-03-22T10:00:00.000Z",
    "subCategories": []
  }
]
```

#### POST /api/concierge/categories
Create a new concierge category.

**Request Body:**
```json
{
  "name": "Airport Transfer",
  "description": "Airport pickup and drop-off services",
  "parent_id": 1
}
```

### Concierge Requests

#### GET /api/concierge/requests
Get all concierge requests with optional filtering.

**Query Parameters:**
- `hotel_id` (integer): Filter by hotel ID
- `status` (string): Filter by status (requested, in_progress, done, cancelled)

**Response:**
```json
[
  {
    "id": 1,
    "hotel_id": 1,
    "guest_id": 123,
    "category_id": 1,
    "title": "Airport pickup needed",
    "details": {
      "flight_number": "AA123",
      "pickup_time": "14:30",
      "passengers": 2
    },
    "status": "requested",
    "scheduled_for": "2024-03-23T14:30:00.000Z",
    "completed_at": null,
    "created_at": "2024-03-22T10:00:00.000Z",
    "updated_at": "2024-03-22T10:00:00.000Z",
    "category": {
      "name": "Transportation"
    }
  }
]
```

#### POST /api/concierge/requests
Create a new concierge request.

**Request Body:**
```json
{
  "hotel_id": 1,
  "guest_id": 123,
  "category_id": 1,
  "title": "Airport pickup needed",
  "details": {
    "flight_number": "AA123",
    "pickup_time": "14:30",
    "passengers": 2
  },
  "scheduled_for": "2024-03-23T14:30:00.000Z"
}
```

#### GET /api/concierge/requests/:id
Get a specific concierge request by ID.

#### PUT /api/concierge/requests/:id
Update a concierge request.

**Request Body:**
```json
{
  "status": "in_progress",
  "details": {
    "driver_assigned": "John Doe",
    "vehicle": "Mercedes S-Class"
  }
}
```

#### DELETE /api/concierge/requests/:id
Delete a concierge request.

## Data Models

### ConciergeCategory
- `id` (integer): Primary key
- `parent_id` (integer, nullable): Parent category ID for hierarchical structure
- `name` (string, 255 chars): Category name
- `description` (text, nullable): Category description
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

### ConciergeRequest
- `id` (integer): Primary key
- `hotel_id` (integer): Foreign key to hotels table
- `guest_id` (integer, nullable): Guest identifier
- `category_id` (integer): Foreign key to concierge_categories table
- `title` (string, 255 chars): Request title
- `details` (text, nullable): JSON payload for additional details
- `status` (enum): Request status (requested, in_progress, done, cancelled)
- `scheduled_for` (datetime, nullable): Scheduled date/time
- `completed_at` (datetime, nullable): Completion date/time
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

## Swagger Documentation

The API is fully documented with Swagger. Access the interactive documentation at:

```
http://localhost:3000/api-docs
```

The concierge endpoints are organized under:
- **Concierge Categories**: Category management endpoints
- **Concierge Requests**: Request management endpoints

## Usage Examples

### Creating a Hierarchical Category Structure

```javascript
// Create parent category
const transportation = await fetch('/api/concierge/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Transportation',
    description: 'Transportation services'
  })
});

// Create sub-category
const airportTransfer = await fetch('/api/concierge/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Airport Transfer',
    description: 'Airport pickup and drop-off',
    parent_id: transportation.id
  })
});
```

### Creating a Request with Details

```javascript
const request = await fetch('/api/concierge/requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hotel_id: 1,
    guest_id: 123,
    category_id: 1,
    title: 'Airport pickup needed',
    details: {
      flight_number: 'AA123',
      arrival_time: '14:30',
      passengers: 2,
      special_requests: 'Wheelchair assistance needed'
    },
    scheduled_for: '2024-03-23T14:30:00.000Z'
  })
});
```

### Updating Request Status

```javascript
await fetch('/api/concierge/requests/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'in_progress',
    details: {
      driver_assigned: 'John Doe',
      vehicle: 'Mercedes S-Class',
      estimated_arrival: '14:25'
    }
  })
});
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400`: Bad Request (invalid input data)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

Error response format:
```json
{
  "message": "Error description"
}
```

## Security Considerations

- All endpoints should be protected with authentication middleware
- Validate input data to prevent SQL injection
- Implement rate limiting for production use
- Consider adding audit logging for request changes

## Performance Optimization

The database includes indexes on frequently queried fields:
- `hotel_id`: For filtering requests by hotel
- `status`: For filtering by request status
- `created_at`: For sorting by creation date
- `scheduled_for`: For scheduled request queries

## Troubleshooting

### Common Issues

1. **Foreign Key Constraints**: Ensure hotels table exists before creating requests
2. **JSON Details**: The `details` field stores JSON as text, ensure valid JSON format
3. **Status Updates**: Use valid enum values for status updates

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` in your environment variables.

## Support

For issues or questions regarding the Concierge Services API, please refer to the main API documentation or contact the development team.

## Sample JSON Codes for All Categories

Below are comprehensive examples for each concierge category with realistic request details.

### 1. Transportation

#### Airport Transfer
```json
{
  "hotel_id": 1,
  "guest_id": 123,
  "category_id": 1,
  "title": "Airport pickup needed",
  "details": {
    "flight_number": "AA123",
    "airline": "American Airlines",
    "arrival_time": "14:30",
    "terminal": "Terminal 3",
    "passengers": 2,
    "luggage_count": 3,
    "special_requests": "Wheelchair assistance needed",
    "vehicle_preference": "Luxury sedan",
    "contact_phone": "+1-555-0123"
  },
  "scheduled_for": "2024-03-23T14:30:00.000Z"
}
```

#### Local Transportation
```json
{
  "hotel_id": 1,
  "guest_id": 124,
  "category_id": 1,
  "title": "City tour transportation",
  "details": {
    "pickup_location": "Hotel lobby",
    "destination": "Downtown shopping district",
    "duration": "4 hours",
    "passengers": 4,
    "vehicle_type": "Van",
    "tour_guide": true,
    "special_requests": "Air conditioning required"
  },
  "scheduled_for": "2024-03-24T09:00:00.000Z"
}
```

### 2. Dining & Reservations

#### Restaurant Reservation
```json
{
  "hotel_id": 1,
  "guest_id": 125,
  "category_id": 2,
  "title": "Dinner reservation at La Maison",
  "details": {
    "restaurant_name": "La Maison",
    "date": "2024-03-25",
    "time": "19:30",
    "party_size": 2,
    "special_requests": "Window seat preferred, anniversary celebration",
    "dietary_restrictions": "One guest is vegetarian",
    "contact_phone": "+1-555-0124",
    "confirmation_required": true
  },
  "scheduled_for": "2024-03-25T19:30:00.000Z"
}
```

#### Room Service
```json
{
  "hotel_id": 1,
  "guest_id": 126,
  "category_id": 2,
  "title": "Breakfast room service",
  "details": {
    "room_number": "1205",
    "order_items": [
      "Continental breakfast",
      "Fresh orange juice",
      "Coffee with cream"
    ],
    "delivery_time": "07:30",
    "special_instructions": "Please knock gently, guest is a light sleeper",
    "payment_method": "Room charge"
  },
  "scheduled_for": "2024-03-26T07:30:00.000Z"
}
```

### 3. Entertainment

#### Event Tickets
```json
{
  "hotel_id": 1,
  "guest_id": 127,
  "category_id": 3,
  "title": "Broadway show tickets",
  "details": {
    "show_name": "The Phantom of the Opera",
    "date": "2024-03-27",
    "time": "20:00",
    "ticket_count": 2,
    "seating_preference": "Orchestra section",
    "price_range": "Premium",
    "special_requests": "Aisle seats if possible",
    "pickup_location": "Hotel concierge desk"
  },
  "scheduled_for": "2024-03-27T20:00:00.000Z"
}
```

#### Activity Booking
```json
{
  "hotel_id": 1,
  "guest_id": 128,
  "category_id": 3,
  "title": "Sailing excursion booking",
  "details": {
    "activity_name": "Sunset Sailing Cruise",
    "date": "2024-03-28",
    "duration": "3 hours",
    "participants": 2,
    "pickup_location": "Hotel lobby",
    "included_items": ["Refreshments", "Life jackets", "Professional guide"],
    "special_requests": "Private tour preferred",
    "weather_dependent": true
  },
  "scheduled_for": "2024-03-28T17:00:00.000Z"
}
```

### 4. Spa & Wellness

#### Spa Treatment
```json
{
  "hotel_id": 1,
  "guest_id": 129,
  "category_id": 4,
  "title": "Couples massage appointment",
  "details": {
    "treatment_type": "Swedish massage",
    "duration": "90 minutes",
    "therapists": 2,
    "room_type": "Couples suite",
    "add_ons": ["Aromatherapy", "Hot stone therapy"],
    "special_requests": "Gentle pressure, focus on back and shoulders",
    "allergies": "No lavender oil",
    "pre_treatment": "Arrive 15 minutes early"
  },
  "scheduled_for": "2024-03-29T14:00:00.000Z"
}
```

#### Fitness Class
```json
  {
    "hotel_id": 1,
    "guest_id": 130,
    "category_id": 4,
    "title": "Yoga class reservation",
    "details": {
      "class_type": "Vinyasa Flow",
      "instructor": "Sarah Johnson",
      "duration": "60 minutes",
      "difficulty_level": "Intermediate",
      "equipment_needed": ["Yoga mat", "Blocks"],
      "class_size": "Small group (max 8)",
      "special_requests": "Focus on flexibility and relaxation"
    },
    "scheduled_for": "2024-03-30T07:00:00.000Z"
  }
```

### 5. Business Services

#### Meeting Room
```json
{
  "hotel_id": 1,
  "guest_id": 131,
  "category_id": 5,
  "title": "Conference room booking",
  "details": {
    "room_name": "Executive Boardroom",
    "capacity": 12,
    "duration": "4 hours",
    "equipment": ["Projector", "Whiteboard", "Video conferencing", "Coffee service"],
    "setup_type": "Boardroom style",
    "catering": "Coffee and pastries for 10 people",
    "technical_support": true,
    "special_requests": "Quiet room away from lobby"
  },
  "scheduled_for": "2024-03-31T09:00:00.000Z"
}
```

#### Business Center Services
```json
{
  "hotel_id": 1,
  "guest_id": 132,
  "category_id": 5,
  "title": "Document printing and binding",
  "details": {
    "service_type": "Document preparation",
    "documents": ["Presentation slides", "Meeting agenda", "Financial reports"],
    "copies": 15,
    "binding": "Spiral binding",
    "paper_size": "A4",
    "color": "Black and white",
    "urgency": "Same day",
    "pickup_location": "Business center"
  },
  "scheduled_for": "2024-04-01T16:00:00.000Z"
}
```

### 6. Housekeeping

#### Room Service Request
```json
{
  "hotel_id": 1,
  "guest_id": 133,
  "category_id": 6,
  "title": "Extra towels and toiletries",
  "details": {
    "room_number": "1508",
    "items_needed": [
      "Extra bath towels (3)",
      "Hand towels (2)",
      "Shampoo and conditioner",
      "Toothbrush and toothpaste"
    ],
    "delivery_time": "Within 30 minutes",
    "special_requests": "Please leave at door if no answer",
    "urgency": "High"
  },
  "scheduled_for": "2024-04-02T15:00:00.000Z"
}
```

#### Maintenance Request
```json
{
  "hotel_id": 1,
  "guest_id": 134,
  "category_id": 6,
  "title": "Air conditioning not working",
  "details": {
    "room_number": "1203",
    "issue_type": "HVAC",
    "description": "Air conditioning unit making loud noise and not cooling properly",
    "urgency": "High",
    "guest_present": true,
    "preferred_time": "Immediate attention",
    "contact_phone": "+1-555-0125"
  },
  "scheduled_for": "2024-04-03T10:00:00.000Z"
}
```

### 7. Personal Assistance

#### Shopping Service
```json
{
  "hotel_id": 1,
  "guest_id": 135,
  "category_id": 7,
  "title": "Gift shopping assistance",
  "details": {
    "shopping_type": "Gift shopping",
    "budget": "$200",
    "recipient": "Wife's birthday",
    "preferences": ["Jewelry", "Perfume", "Luxury items"],
    "store_preferences": ["Tiffany & Co.", "Saks Fifth Avenue"],
    "delivery": "To hotel room",
    "wrapping": true,
    "special_requests": "Discrete packaging for surprise"
  },
  "scheduled_for": "2024-04-04T14:00:00.000Z"
}
```

#### Translation Services
```json
{
  "hotel_id": 1,
  "guest_id": 136,
  "category_id": 7,
  "title": "Business meeting interpreter",
  "details": {
    "languages": ["English", "Japanese"],
    "meeting_type": "Business negotiation",
    "duration": "2 hours",
    "location": "Hotel conference room",
    "participants": 6,
    "specialization": "Technical terminology",
    "equipment": "Simultaneous interpretation equipment",
    "confidentiality": "NDA required"
  },
  "scheduled_for": "2024-04-05T13:00:00.000Z"
}
```

### 8. Information Provision and Referral

#### City Guide
```json
{
  "hotel_id": 1,
  "guest_id": 137,
  "category_id": 8,
  "title": "Local attractions information",
  "details": {
    "interests": ["Museums", "Historical sites", "Shopping"],
    "duration": "Full day",
    "group_size": 2,
    "accessibility": "Wheelchair accessible options needed",
    "budget": "Moderate",
    "preferred_language": "English",
    "special_requests": "Avoid tourist traps, local recommendations"
  },
  "scheduled_for": "2024-04-06T09:00:00.000Z"
}
```

#### Events Calendar
```json
{
  "hotel_id": 1,
  "guest_id": 138,
  "category_id": 8,
  "title": "Weekend events information",
  "details": {
    "date_range": "2024-04-06 to 2024-04-07",
    "event_types": ["Music concerts", "Food festivals", "Art exhibitions"],
    "location_preference": "Downtown area",
    "ticket_availability": "Check current availability",
    "transportation": "Public transit options",
    "special_requests": "Family-friendly events only"
  },
  "scheduled_for": "2024-04-06T10:00:00.000Z"
}
```

### 9. Emergency Assistance

#### Lost Passport
```json
{
  "hotel_id": 1,
  "guest_id": 139,
  "category_id": 9,
  "title": "Lost passport assistance",
  "details": {
    "passport_country": "United States",
    "last_seen": "Hotel lobby",
    "time_lost": "2024-04-07T15:30:00.000Z",
    "urgency": "Critical",
    "travel_date": "2024-04-08",
    "embassy_contact": "US Embassy - 555-0126",
    "police_report": "Filed at local precinct",
    "replacement_process": "Emergency passport application"
  },
  "scheduled_for": "2024-04-07T16:00:00.000Z"
}
```

#### Medical Emergency
```json
{
  "hotel_id": 1,
  "guest_id": 140,
  "category_id": 9,
  "title": "Medical assistance needed",
  "details": {
    "symptoms": "Severe chest pain and shortness of breath",
    "patient_age": 65,
    "medical_history": "Heart condition, diabetes",
    "medications": ["Blood pressure medication", "Insulin"],
    "allergies": "Penicillin",
    "emergency_contact": "Spouse - +1-555-0127",
    "insurance": "International travel insurance",
    "preferred_hospital": "Any accredited facility"
  },
  "scheduled_for": "2024-04-08T08:00:00.000Z"
}
```

### Sample Response Updates

#### Status Update Example
```json
{
  "status": "in_progress",
  "details": {
    "assigned_staff": "Maria Rodriguez",
    "estimated_completion": "2024-04-08T12:00:00.000Z",
    "current_status": "Driver en route to airport",
    "vehicle_details": "Mercedes S-Class - License: ABC123",
    "contact_phone": "+1-555-0128"
  }
}
```

#### Completion Update Example
```json
{
  "status": "done",
  "completed_at": "2024-04-08T12:15:00.000Z",
  "details": {
    "completion_notes": "Guest successfully picked up from airport",
    "actual_completion_time": "2024-04-08T12:15:00.000Z",
    "guest_satisfaction": "Excellent",
    "tips_provided": "$20",
    "follow_up_required": false
  }
} 