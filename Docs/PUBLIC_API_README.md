# Hospient Public API Documentation

This document describes the public API endpoints that can be accessed without authentication for the Customer-UI.

## Overview

The public API provides read-only access to hotel, restaurant, and menu information. These endpoints are designed for customer-facing applications and do not require JWT authentication.

## Base URL

- Development: `http://localhost:3000`
- Production: `https://your-production-domain.com`

## Rate Limiting

Public endpoints are rate-limited to 100 requests per 15 minutes per IP address to prevent abuse.

## Authentication

**No authentication required** for public endpoints. Simply make HTTP requests without including any authorization headers.

## Endpoints

### Hotels

#### Get All Public Hotels
```
GET /api/public/hotels
```

Returns a list of all active hotels with their organization information.

**Response:**
```json
[
  {
    "id": 1,
    "organization_id": 1,
    "name": "Grand Hotel",
    "address": "123 Main St",
    "city": "New York",
    "country": "USA",
    "web_address": "https://grandhotel.com",
    "social_media_links": "https://facebook.com/grandhotel",
    "logo_url": "/uploads/logo.png",
    "banner_url": "/uploads/banner.jpg",
    "has_fb": true,
    "has_spa": true,
    "isMultiImages": true,
    "specials": "Free breakfast included",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "Organization": {
      "name": "Grand Hotel Group",
      "org_slug": "ABC123"
    }
  }
]
```

#### Get Hotel by Organization Slug
```
GET /api/public/hotels/{slug}
```

Returns detailed hotel information including restaurants and menus for a specific organization.

**Parameters:**
- `slug` (string, required): Organization slug

**Response:**
```json
{
  "id": 1,
  "organization_id": 1,
  "name": "Grand Hotel",
  "address": "123 Main St",
  "city": "New York",
  "country": "USA",
  "web_address": "https://grandhotel.com",
  "social_media_links": "https://facebook.com/grandhotel",
  "logo_url": "/uploads/logo.png",
  "banner_url": "/uploads/banner.jpg",
  "has_fb": true,
  "has_spa": true,
  "isMultiImages": true,
  "specials": "Free breakfast included",
  "Restaurants": [
    {
      "id": 1,
      "name": "Main Restaurant",
      "service_type": "Fine Dining",
      "working_hours": {
        "monday": {"open": "07:00", "close": "22:00"},
        "tuesday": {"open": "07:00", "close": "22:00"}
      },
      "Menus": [
        {
          "id": 1,
          "name": "Breakfast Menu",
          "description": "Delicious breakfast options",
          "menu_items": [...]
        }
      ]
    }
  ]
}
```

### Restaurants

#### Get Restaurants by Organization
```
GET /api/public/restaurants/{orgSlug}
```

Returns all restaurants for a specific organization.

**Parameters:**
- `orgSlug` (string, required): Organization slug

**Response:**
```json
[
  {
    "id": 1,
    "name": "Main Restaurant",
    "service_type": "Fine Dining",
    "working_hours": {
      "monday": {"open": "07:00", "close": "22:00"},
      "tuesday": {"open": "07:00", "close": "22:00"}
    },
    "Hotel": {
      "name": "Grand Hotel",
      "address": "123 Main St"
    },
    "Menus": [
      {
        "id": 1,
        "name": "Breakfast Menu",
        "description": "Delicious breakfast options"
      }
    ]
  }
]
```

#### Get Specific Restaurant
```
GET /api/public/restaurants/{orgSlug}/{restaurantId}
```

Returns detailed information about a specific restaurant including its menus.

**Parameters:**
- `orgSlug` (string, required): Organization slug
- `restaurantId` (integer, required): Restaurant ID

**Response:**
```json
{
  "id": 1,
  "name": "Main Restaurant",
  "service_type": "Fine Dining",
  "working_hours": {
    "monday": {"open": "07:00", "close": "22:00"},
    "tuesday": {"open": "07:00", "close": "22:00"}
  },
  "Hotel": {
    "name": "Grand Hotel",
    "address": "123 Main St"
  },
  "Menus": [
    {
      "id": 1,
      "name": "Breakfast Menu",
      "description": "Delicious breakfast options",
      "menu_items": [...]
    }
  ]
}
```

### Menus

#### Get All Menus by Organization
```
GET /api/public/menus/{orgSlug}
```

Returns all active menus for a specific organization.

**Parameters:**
- `orgSlug` (string, required): Organization slug

**Response:**
```json
[
  {
    "id": 1,
    "name": "Breakfast Menu",
    "description": "Delicious breakfast options",
    "menu_items": [...],
    "Restaurant": {
      "name": "Main Restaurant",
      "service_type": "Fine Dining"
    }
  }
]
```

#### Get Specific Menu
```
GET /api/public/menus/{orgSlug}/{menuId}
```

Returns detailed information about a specific menu.

**Parameters:**
- `orgSlug` (string, required): Organization slug
- `menuId` (integer, required): Menu ID

**Response:**
```json
{
  "id": 1,
  "name": "Breakfast Menu",
  "description": "Delicious breakfast options",
  "menu_items": [...],
  "Restaurant": {
    "name": "Main Restaurant",
    "service_type": "Fine Dining",
    "working_hours": {
      "monday": {"open": "07:00", "close": "22:00"}
    }
  }
}
```

## Error Responses

### 404 Not Found
```json
{
  "message": "Organization not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error fetching hotels"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```

## Usage Examples

### JavaScript/Fetch
```javascript
// Get all hotels
const response = await fetch('http://localhost:3000/api/public/hotels');
const hotels = await response.json();

// Get hotel by organization slug
const hotelResponse = await fetch('http://localhost:3000/api/public/hotels/ABC123');
const hotel = await hotelResponse.json();

// Get restaurants for an organization
const restaurantsResponse = await fetch('http://localhost:3000/api/public/restaurants/ABC123');
const restaurants = await restaurantsResponse.json();
```

### cURL
```bash
# Get all hotels
curl -X GET http://localhost:3000/api/public/hotels

# Get hotel by organization slug
curl -X GET http://localhost:3000/api/public/hotels/ABC123

# Get restaurants for an organization
curl -X GET http://localhost:3000/api/public/restaurants/ABC123
```

## Security Considerations

1. **Rate Limiting**: All public endpoints are rate-limited to prevent abuse
2. **Read-Only Access**: Public endpoints only provide read access to data
3. **Organization Isolation**: Data is filtered by organization to prevent cross-organization access
4. **No Sensitive Data**: Personal information and administrative data are not exposed

## Integration Notes

- Use the organization slug to identify which hotel/restaurant data to display
- All image URLs are relative paths that should be prefixed with the base URL
- Working hours are provided in 24-hour format
- Menu items structure may vary based on your specific implementation 