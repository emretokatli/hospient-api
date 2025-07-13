# Guest Authentication System

This document describes the guest authentication system for the Hospient application, which allows guests to register and sign in to access the mobile app.

## Overview

The guest authentication system is separate from the member authentication system:
- **Members**: Access the admin panel (`/admin`) - hotel staff and administrators
- **Guests**: Access the mobile app (`/app`) - hotel guests and customers

## Database Schema

### Guests Table

```sql
CREATE TABLE `guests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `passport_number` varchar(50) DEFAULT NULL,
  `preferences` json DEFAULT NULL COMMENT 'Guest preferences like room type, dietary restrictions, etc.',
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_last_login` (`last_login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## API Endpoints

### Base URL
```
/api/guest/auth
```

### 1. Guest Registration

**POST** `/api/guest/auth/register`

Register a new guest account.

#### Request Body
```json
{
  "email": "guest@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "nationality": "American",
  "passport_number": "A12345678",
  "preferences": {
    "room_type": "king",
    "dietary_restrictions": ["vegetarian"],
    "language": "en"
  }
}
```

#### Required Fields
- `email` (string, valid email)
- `password` (string, minimum 6 characters)
- `first_name` (string)
- `last_name` (string)

#### Optional Fields
- `phone` (string, valid phone number)
- `date_of_birth` (string, ISO date format)
- `nationality` (string)
- `passport_number` (string)
- `preferences` (object, JSON)

#### Response (201 Created)
```json
{
  "status": "success",
  "message": "Guest registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "guest": {
      "id": 1,
      "email": "guest@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "date_of_birth": "1990-01-01",
      "nationality": "American",
      "passport_number": "A12345678",
      "preferences": {
        "room_type": "king",
        "dietary_restrictions": ["vegetarian"],
        "language": "en"
      }
    }
  }
}
```

### 2. Guest Login

**POST** `/api/guest/auth/login`

Authenticate a guest and receive a JWT token.

#### Request Body
```json
{
  "email": "guest@example.com",
  "password": "password123"
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Guest login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "guest": {
      "id": 1,
      "email": "guest@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "date_of_birth": "1990-01-01",
      "nationality": "American",
      "passport_number": "A12345678",
      "preferences": {
        "room_type": "king",
        "dietary_restrictions": ["vegetarian"],
        "language": "en"
      }
    }
  }
}
```

### 3. Get Guest Profile

**GET** `/api/guest/auth/profile`

Retrieve the current guest's profile information.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "guest": {
      "id": 1,
      "email": "guest@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "date_of_birth": "1990-01-01",
      "nationality": "American",
      "passport_number": "A12345678",
      "preferences": {
        "room_type": "king",
        "dietary_restrictions": ["vegetarian"],
        "language": "en"
      },
      "last_login": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "errors": [
    {
      "type": "field",
      "value": "invalid-email",
      "msg": "Invalid value",
      "path": "email",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Invalid credentials"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Error during guest registration"
}
```

## JWT Token Structure

The JWT token contains the following payload:
```json
{
  "id": 1,
  "email": "guest@example.com",
  "type": "guest",
  "iat": 1642234567,
  "exp": 1642320967
}
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with a salt round of 10
2. **JWT Tokens**: Secure token-based authentication
3. **Input Validation**: Comprehensive validation for all inputs
4. **Rate Limiting**: Applied to prevent abuse
5. **Active Status**: Guests can be deactivated without deletion

## Database Migration

### Using Sequelize Migration
```bash
npx sequelize-cli db:migrate
```

### Using SQL Script
```bash
mysql -u username -p database_name < create-guests-table.sql
```

## Frontend Integration

### React/TypeScript Example

```typescript
// Guest registration
const registerGuest = async (guestData: GuestRegistrationData) => {
  const response = await fetch('/api/guest/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(guestData),
  });
  
  return response.json();
};

// Guest login
const loginGuest = async (credentials: LoginCredentials) => {
  const response = await fetch('/api/guest/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  return response.json();
};

// Get guest profile
const getGuestProfile = async (token: string) => {
  const response = await fetch('/api/guest/auth/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
};
```

## Environment Variables

Make sure these environment variables are set:
```env
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

## Testing

### Using cURL

#### Register a guest
```bash
curl -X POST http://localhost:3000/api/guest/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

#### Login a guest
```bash
curl -X POST http://localhost:3000/api/guest/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Get profile (with token)
```bash
curl -X GET http://localhost:3000/api/guest/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Mobile App Integration

The redesigned Signin and Register screens are optimized for mobile devices with:

1. **Mobile-first design**: Responsive layout that works well on small screens
2. **Touch-friendly inputs**: Larger touch targets and proper spacing
3. **Modern UI**: Gradient backgrounds, rounded corners, and smooth animations
4. **Loading states**: Visual feedback during API calls
5. **Error handling**: Clear error messages and validation
6. **Accessibility**: Proper labels, ARIA attributes, and keyboard navigation

## File Structure

```
api/
├── src/
│   ├── models/
│   │   └── guest.model.js          # Guest model definition
│   ├── routes/
│   │   └── guest.auth.routes.js    # Guest authentication routes
│   ├── migrations/
│   │   └── 20240325000000-create-guests-table.js  # Database migration
│   └── index.js                    # Main app file (updated)
├── create-guests-table.sql         # SQL script for table creation
└── GUEST_AUTH_README.md           # This documentation

app/web/src/pages/auth/
├── Signin.tsx                      # Redesigned signin screen
└── Register.tsx                    # Redesigned register screen
```

## Next Steps

1. **Implement actual API integration** in the frontend components
2. **Add password reset functionality** for guests
3. **Implement email verification** for new registrations
4. **Add social login options** (Google, Facebook, etc.)
5. **Create guest profile management** screens
6. **Add two-factor authentication** for enhanced security
7. **Implement guest session management** and logout functionality 