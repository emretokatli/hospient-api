# Hotel Meetings & Events Management System

This document describes the hotel meetings and events management system that enables hotels to manage meetings, conferences, weddings, and other events. The system supports both internal hotel management and public booking capabilities.

## Overview

The meetings and events system provides comprehensive functionality for:

### 1. **Event Management**
- Create, edit, and delete meetings and events
- Support for multiple event types (meeting, conference, wedding, birthday, corporate_event, other)
- Status tracking (draft, confirmed, in_progress, completed, cancelled)
- Approval workflow for public bookings

### 2. **Public Booking System**
- Allow guests to submit meeting requests
- Availability checking for meeting rooms
- Automatic conflict detection
- Email notifications for approvals

### 3. **Resource Management**
- Capacity tracking
- Location management
- Equipment requirements
- Catering services
- Budget and cost tracking

## Database Structure

### Meetings Table

The `meetings` table contains the following fields:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | INTEGER | Auto-increment primary key | Yes |
| `hotel_id` | INTEGER | Foreign key to hotels table | Yes |
| `title` | VARCHAR(255) | Event title | Yes |
| `description` | TEXT | Event description | No |
| `event_type` | ENUM | Type of event | Yes |
| `start_date` | DATETIME | Event start date and time | Yes |
| `end_date` | DATETIME | Event end date and time | Yes |
| `capacity` | INTEGER | Maximum attendees | No |
| `current_attendees` | INTEGER | Current number of attendees | No (default: 0) |
| `location` | VARCHAR(255) | Meeting room or venue | No |
| `organizer_name` | VARCHAR(255) | Organizer's name | Yes |
| `organizer_email` | VARCHAR(255) | Organizer's email | Yes |
| `organizer_phone` | VARCHAR(50) | Organizer's phone | No |
| `status` | ENUM | Event status | No (default: draft) |
| `is_public` | BOOLEAN | Public visibility | No (default: false) |
| `requires_approval` | BOOLEAN | Requires approval | No (default: true) |
| `special_requirements` | TEXT | Special requirements | No |
| `catering_required` | BOOLEAN | Catering needed | No (default: false) |
| `equipment_required` | TEXT | Required equipment | No |
| `budget` | DECIMAL(10,2) | Event budget | No |
| `deposit_paid` | BOOLEAN | Deposit status | No (default: false) |
| `deposit_amount` | DECIMAL(10,2) | Deposit amount | No |
| `total_cost` | DECIMAL(10,2) | Total event cost | No |
| `notes` | TEXT | Internal notes | No |
| `created_by` | INTEGER | Creator member ID | No |
| `approved_by` | INTEGER | Approver member ID | No |
| `approved_at` | DATETIME | Approval timestamp | No |
| `created_at` | DATETIME | Creation timestamp | Auto |
| `updated_at` | DATETIME | Last update timestamp | Auto |

## API Endpoints

### Protected Routes (Hotel Staff)

#### Base URL: `/api/meetings`

#### 1. Get All Meetings
```
GET /api/meetings
```

**Query Parameters:**
- `hotel_id` (integer) - Filter by hotel ID
- `event_type` (string) - Filter by event type
- `status` (string) - Filter by status
- `start_date` (string) - Filter by start date (YYYY-MM-DD)
- `end_date` (string) - Filter by end date (YYYY-MM-DD)
- `is_public` (boolean) - Filter by public visibility

#### 2. Get Meeting by ID
```
GET /api/meetings/{id}
```

#### 3. Create Meeting
```
POST /api/meetings
```

**Required Fields:**
- `title` (string)
- `event_type` (string)
- `start_date` (datetime)
- `end_date` (datetime)
- `organizer_name` (string)
- `organizer_email` (string)
- `hotel_id` (integer)

#### 4. Update Meeting
```
PUT /api/meetings/{id}
```

#### 5. Delete Meeting
```
DELETE /api/meetings/{id}
```

#### 6. Approve Meeting
```
POST /api/meetings/{id}/approve
```

### Public Routes (Guests)

#### Base URL: `/api/public/meetings`

#### 1. Get Public Meetings
```
GET /api/public/meetings
```

**Query Parameters:**
- `hotel_id` (integer) - Filter by hotel ID
- `event_type` (string) - Filter by event type
- `start_date` (string) - Filter by start date
- `end_date` (string) - Filter by end date

#### 2. Get Public Meeting by ID
```
GET /api/public/meetings/{id}
```

#### 3. Get Meetings by Hotel Slug
```
GET /api/public/meetings/hotel/{hotel_slug}
```

#### 4. Create Meeting Request
```
POST /api/public/meetings
```

**Required Fields:**
- `title` (string)
- `event_type` (string)
- `start_date` (datetime)
- `end_date` (datetime)
- `organizer_name` (string)
- `organizer_email` (string)
- `hotel_id` (integer)

#### 5. Check Availability
```
GET /api/public/meetings/availability
```

**Required Parameters:**
- `hotel_id` (integer)
- `location` (string)
- `start_date` (datetime)
- `end_date` (datetime)

## Event Types

The system supports the following event types:

1. **meeting** - Business meetings
2. **conference** - Large conferences and seminars
3. **wedding** - Wedding ceremonies and receptions
4. **birthday** - Birthday parties and celebrations
5. **corporate_event** - Corporate events and team building
6. **other** - Other types of events

## Status Flow

The meeting status follows this flow:

1. **draft** - Initial state for new meetings
2. **confirmed** - Approved and confirmed meetings
3. **in_progress** - Currently ongoing meetings
4. **completed** - Finished meetings
5. **cancelled** - Cancelled meetings

## Public Booking Workflow

1. Guest submits meeting request via public API
2. Request is created with status 'draft' and requires_approval=true
3. Hotel staff reviews the request
4. Staff can approve, modify, or reject the request
5. Upon approval, status changes to 'confirmed' and is_public=true
6. Guest receives notification of approval

## Conflict Detection

The system automatically detects scheduling conflicts by checking:
- Same hotel and location
- Overlapping time periods
- Conflicting statuses (draft, confirmed, in_progress)

## Usage Examples

### Create a Business Meeting
```json
{
  "hotel_id": 1,
  "title": "Quarterly Business Review",
  "description": "Q4 business review meeting with stakeholders",
  "event_type": "meeting",
  "start_date": "2024-03-28T09:00:00.000Z",
  "end_date": "2024-03-28T11:00:00.000Z",
  "capacity": 20,
  "location": "Conference Room A",
  "organizer_name": "John Smith",
  "organizer_email": "john.smith@company.com",
  "organizer_phone": "+1234567890",
  "catering_required": true,
  "equipment_required": "Projector, Whiteboard, Coffee Service",
  "budget": 500.00
}
```

### Create a Wedding Event
```json
{
  "hotel_id": 1,
  "title": "Sarah & Mike Wedding",
  "description": "Wedding ceremony and reception",
  "event_type": "wedding",
  "start_date": "2024-06-15T16:00:00.000Z",
  "end_date": "2024-06-15T23:00:00.000Z",
  "capacity": 150,
  "location": "Grand Ballroom",
  "organizer_name": "Sarah Johnson",
  "organizer_email": "sarah.johnson@email.com",
  "organizer_phone": "+1987654321",
  "catering_required": true,
  "special_requirements": "Floral arrangements, DJ, Photography setup",
  "budget": 15000.00,
  "deposit_paid": true,
  "deposit_amount": 3000.00
}
```

### Check Room Availability
```
GET /api/public/meetings/availability?hotel_id=1&location=Conference%20Room%20A&start_date=2024-03-28T09:00:00.000Z&end_date=2024-03-28T11:00:00.000Z
```

Response:
```json
{
  "available": false,
  "conflicting_meetings": [
    {
      "id": 5,
      "title": "Team Standup",
      "start_date": "2024-03-28T08:00:00.000Z",
      "end_date": "2024-03-28T10:00:00.000Z",
      "status": "confirmed"
    }
  ]
}
```

## Frontend Integration

The frontend includes a comprehensive meetings management interface with:

- Meeting list with filtering and sorting
- Add/Edit meeting modal with form validation
- Status management and approval workflow
- Conflict detection and warnings
- Public booking form for guests
- Availability checker

## Security Features

- Authentication required for all management operations
- Public routes for guest bookings
- Input validation and sanitization
- Conflict detection to prevent double bookings
- Approval workflow for public submissions

## Future Enhancements

Potential future features:
- Calendar integration
- Email notifications
- Payment processing
- Resource inventory management
- Recurring meetings
- Meeting templates
- Analytics and reporting 