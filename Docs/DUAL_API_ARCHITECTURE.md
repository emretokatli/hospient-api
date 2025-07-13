# Dual API Architecture Solution

## Overview

This solution implements a dual API architecture that supports both authenticated endpoints (for Backoffice Admin panel) and public endpoints (for Customer-UI) within the same Express.js application.

## Architecture Design

### 1. Route Separation Strategy

The API is organized into two distinct route groups:

#### Public Routes (`/api/public/*`)
- **Purpose**: Customer-facing endpoints that don't require authentication
- **Authentication**: None required
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Access**: Read-only access to hotel, restaurant, and menu data

#### Protected Routes (`/api/*`)
- **Purpose**: Administrative endpoints for Backoffice Admin panel
- **Authentication**: JWT token required via `authMiddleware`
- **Rate Limiting**: 5 authentication attempts per 15 minutes per IP
- **Access**: Full CRUD operations on all data

### 2. File Structure

```
src/
├── routes/
│   ├── public.hotel.routes.js      # Public hotel endpoints
│   ├── public.restaurant.routes.js # Public restaurant endpoints
│   ├── public.menu.routes.js       # Public menu endpoints
│   ├── hotel.routes.js             # Protected hotel endpoints
│   ├── restaurant.routes.js        # Protected restaurant endpoints
│   ├── menu.routes.js              # Protected menu endpoints
│   └── auth.routes.js              # Authentication endpoints
├── middleware/
│   ├── auth.middleware.js          # Required authentication
│   ├── optional-auth.middleware.js # Optional authentication
│   └── rate-limit.middleware.js    # Rate limiting
└── index.js                        # Main application file
```

### 3. Implementation Details

#### Public Endpoints Created

1. **Hotels**
   - `GET /api/public/hotels` - Get all active hotels
   - `GET /api/public/hotels/{slug}` - Get hotel by organization slug

2. **Restaurants**
   - `GET /api/public/restaurants/{orgSlug}` - Get restaurants by organization
   - `GET /api/public/restaurants/{orgSlug}/{restaurantId}` - Get specific restaurant

3. **Menus**
   - `GET /api/public/menus/{orgSlug}` - Get all menus by organization
   - `GET /api/public/menus/{orgSlug}/{menuId}` - Get specific menu

#### Security Features

1. **Rate Limiting**
   - Public endpoints: 100 requests per 15 minutes per IP
   - Auth endpoints: 5 attempts per 15 minutes per IP

2. **Data Filtering**
   - Data is filtered by organization to prevent cross-organization access
   - No sensitive data exposed

3. **Organization Isolation**
   - All public endpoints require organization slug
   - Data is filtered by organization to prevent cross-organization access

## Usage Examples

### Customer-UI Integration

```javascript
// No authentication required
const response = await fetch('http://localhost:3000/api/public/hotels/ABC123');
const hotelData = await response.json();
```

### Backoffice Admin Integration

```javascript
// Authentication required
const response = await fetch('http://localhost:3000/api/hotels', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
const hotels = await response.json();
```

## Benefits of This Approach

### 1. **Security**
- Clear separation between public and private data
- Rate limiting prevents abuse
- No sensitive information exposed in public endpoints

### 2. **Maintainability**
- Single codebase for both APIs
- Shared models and business logic
- Easy to add new public endpoints

### 3. **Performance**
- No authentication overhead for public endpoints
- Efficient database queries with proper filtering
- Caching-friendly structure

### 4. **Scalability**
- Easy to add more public endpoints
- Can implement different rate limits per endpoint type
- Supports future API versioning

## Configuration

### Environment Variables

```env
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### Rate Limiting Configuration

```javascript
// Public endpoints: 100 requests per 15 minutes
const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Auth endpoints: 5 attempts per 15 minutes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});
```

## Deployment Considerations

### 1. **CORS Configuration**
Ensure CORS is properly configured for both Customer-UI and Backoffice Admin domains.

### 2. **Load Balancing**
Consider implementing load balancing for high-traffic public endpoints.

### 3. **Caching**
Implement caching for public endpoints to improve performance:
- Redis for session storage
- CDN for static assets
- Response caching for frequently accessed data

### 4. **Monitoring**
Set up monitoring for:
- Rate limit violations
- API usage patterns
- Error rates for both public and protected endpoints

## Testing

### Public Endpoints
```bash
# Test public hotel endpoint
curl -X GET http://localhost:3000/api/public/hotels

# Test rate limiting
for i in {1..110}; do curl -X GET http://localhost:3000/api/public/hotels; done
```

### Protected Endpoints
```bash
# Test protected endpoint without token
curl -X GET http://localhost:3000/api/hotels

# Test protected endpoint with token
curl -X GET http://localhost:3000/api/hotels \
  -H "Authorization: Bearer your-jwt-token"
```

## Future Enhancements

### 1. **API Versioning**
```javascript
// Future structure
app.use('/api/v1/public/hotels', publicHotelRoutes);
app.use('/api/v2/public/hotels', publicHotelRoutesV2);
```

### 2. **Enhanced Security**
- API key authentication for public endpoints
- IP whitelisting for sensitive operations
- Request signing for critical endpoints

### 3. **Analytics**
- Track usage patterns for public vs protected endpoints
- Monitor performance differences
- Identify popular endpoints for optimization

## Conclusion

This dual API architecture provides a clean, secure, and scalable solution for supporting both authenticated administrative access and public customer access. The separation of concerns, proper security measures, and maintainable code structure make it an ideal solution for the Hospient platform. 