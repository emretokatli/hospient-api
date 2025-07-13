# Gastlook Backoffice API

This is the administrative API for the Gastlook Hotel Management System. It provides endpoints for managing members, organizations, and hotels.

## Features

- Member registration and authentication
- Organization management
- Hotel management
- JWT-based authentication
- Input validation
- Error handling

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new member
- POST `/api/auth/login` - Login member

### Members
- GET `/api/members/profile` - Get member profile
- PUT `/api/members/profile` - Update member profile
- PUT `/api/members/change-password` - Change password

### Organizations
- GET `/api/organizations` - Get organization details
- PUT `/api/organizations` - Update organization

### Hotels
- GET `/api/hotels` - Get all hotels for an organization
- GET `/api/hotels/:id` - Get a specific hotel
- POST `/api/hotels` - Create a new hotel
- PUT `/api/hotels/:id` - Update a hotel
- DELETE `/api/hotels/:id` - Delete a hotel

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Set up the database using the schema in `database/schema.sql`

### Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRES_IN` - JWT expiration time
- `CORS_ORIGIN` - Allowed CORS origin

## Error Handling

The API uses a consistent error response format:
```json
{
  "status": "error",
  "message": "Error message"
}
```

## Security

- Password hashing using bcrypt
- JWT-based authentication
- Input validation
- CORS protection
- Error handling