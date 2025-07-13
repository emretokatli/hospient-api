# Hotel Offers System

This document describes the hotel offers system that allows hotels to create and manage various types of offers for their guests and walk-in customers.

## Overview

The offers system supports different types of hotel offers including:
- **Spa offers** - Discounts on spa services
- **Restaurant offers** - Special menus, discounts, or featured products
- **Pool offers** - Pool-related activities or services
- **Activity offers** - Various hotel activities and experiences
- **Room offers** - Room-related promotions
- **Other offers** - Any other type of hotel offer

## Database Structure

### Offers Table

The `offers` table contains the following fields:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | INTEGER | Auto-increment primary key | Yes |
| `hotel_id` | INTEGER | Foreign key to hotels table | Yes |
| `title` | VARCHAR(255) | Offer title | Yes |
| `description` | TEXT | Detailed description | No |
| `type` | ENUM | Offer type (spa, restaurant, pool, activity, room, other) | Yes |
| `discount_percentage` | DECIMAL(5,2) | Percentage discount (0-100) | No |
| `discount_amount` | DECIMAL(10,2) | Fixed discount amount | No |
| `original_price` | DECIMAL(10,2) | Original price before discount | No |
| `discounted_price` | DECIMAL(10,2) | Price after discount | No |
| `valid_from` | DATETIME | Start date of offer validity | Yes |
| `valid_until` | DATETIME | End date of offer validity | Yes |
| `is_active` | BOOLEAN | Whether offer is currently active | No (default: true) |
| `terms_conditions` | TEXT | Terms and conditions | No |
| `image_url` | VARCHAR(500) | URL to offer image | No |
| `max_uses` | INTEGER | Maximum number of uses | No |
| `current_uses` | INTEGER | Current number of uses | No (default: 0) |
| `applicable_for` | ENUM | Target audience (guests, walkin, both) | No (default: both) |
| `priority` | INTEGER | Display priority order | No (default: 0) |
| `created_at` | DATETIME | Creation timestamp | Auto |
| `updated_at` | DATETIME | Last update timestamp | Auto |

## API Endpoints

### Base URL: `/api/offers`

#### 1. Get All Offers
```
GET /api/offers
```

**Query Parameters:**
- `hotel_id` (integer) - Filter by hotel ID
- `type` (string) - Filter by offer type
- `is_active` (boolean) - Filter by active status
- `applicable_for` (string) - Filter by target audience
- `page` (integer) - Page number for pagination
- `limit` (integer) - Items per page

**Response:**
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### 2. Get Offer by ID
```
GET /api/offers/{id}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "hotel_id": 1,
    "title": "Spa Relaxation Package",
    "type": "spa",
    "discount_percentage": 15.00,
    "valid_from": "2024-01-01T00:00:00.000Z",
    "valid_until": "2024-12-31T23:59:59.000Z",
    "is_active": true,
    "Hotel": {
      "id": 1,
      "name": "Grand Hotel",
      "hotel_slug": "grand-hotel"
    }
  }
}
```

#### 3. Create New Offer
```
POST /api/offers
```

**Request Body:**
```json
{
  "hotel_id": 1,
  "title": "Spa Relaxation Package",
  "description": "Enjoy 15% off on all spa treatments",
  "type": "spa",
  "discount_percentage": 15.00,
  "original_price": 100.00,
  "discounted_price": 85.00,
  "valid_from": "2024-01-01T00:00:00.000Z",
  "valid_until": "2024-12-31T23:59:59.000Z",
  "terms_conditions": "Valid for hotel guests only",
  "applicable_for": "guests",
  "priority": 1
}
```

#### 4. Update Offer
```
PUT /api/offers/{id}
```

**Request Body:** Same as create, but all fields are optional

#### 5. Delete Offer
```
DELETE /api/offers/{id}
```

#### 6. Get Hotel Offers
```
GET /api/offers/hotel/{hotelId}
```

**Query Parameters:**
- `type` (string) - Filter by offer type
- `applicable_for` (string) - Filter by target audience

## Setup Instructions

### 1. Run the Migration

To create the offers table in your database, run:

```bash
cd api
node run-offer-migration.js
```

### 2. Verify Installation

After running the migration, you can test the API:

```bash
# Get all offers
curl http://localhost:3000/api/offers

# Create a test offer
curl -X POST http://localhost:3000/api/offers \
  -H "Content-Type: application/json" \
  -d '{
    "hotel_id": 1,
    "title": "Test Spa Offer",
    "type": "spa",
    "discount_percentage": 10.00,
    "valid_from": "2024-01-01T00:00:00.000Z",
    "valid_until": "2024-12-31T23:59:59.000Z"
  }'
```

## Usage Examples

### Creating Different Types of Offers

#### 1. Spa Offer
```json
{
  "hotel_id": 1,
  "title": "Relaxing Spa Package",
  "description": "15% off on all spa treatments for hotel guests",
  "type": "spa",
  "discount_percentage": 15.00,
  "valid_from": "2024-01-01T00:00:00.000Z",
  "valid_until": "2024-12-31T23:59:59.000Z",
  "applicable_for": "guests"
}
```

#### 2. Restaurant Offer
```json
{
  "hotel_id": 1,
  "title": "Weekend Brunch Special",
  "description": "Fixed menu brunch at discounted price",
  "type": "restaurant",
  "original_price": 45.00,
  "discounted_price": 35.00,
  "valid_from": "2024-01-01T00:00:00.000Z",
  "valid_until": "2024-12-31T23:59:59.000Z",
  "applicable_for": "both"
}
```

#### 3. Pool Activity Offer
```json
{
  "hotel_id": 1,
  "title": "Poolside Yoga Classes",
  "description": "Free yoga classes by the pool",
  "type": "activity",
  "discount_percentage": 100.00,
  "valid_from": "2024-01-01T00:00:00.000Z",
  "valid_until": "2024-12-31T23:59:59.000Z",
  "applicable_for": "both"
}
```

## Features

### Automatic Filtering
- Offers are automatically filtered to show only currently valid offers (within date range)
- Inactive offers are excluded from public endpoints
- Offers are ordered by priority and creation date

### Validation
- Date range validation (valid_until must be after valid_from)
- Hotel existence validation
- Discount percentage validation (0-100%)
- Required field validation

### Performance
- Database indexes on frequently queried fields
- Efficient pagination support
- Optimized queries with proper joins

### Flexibility
- Support for both percentage and fixed amount discounts
- Multiple target audiences (guests, walk-in, both)
- Priority-based ordering
- Usage tracking capabilities

## Swagger Documentation

Complete API documentation is available at:
```
http://localhost:3000/api-docs
```

The offers endpoints are automatically included in the Swagger documentation with full schema definitions and examples. 