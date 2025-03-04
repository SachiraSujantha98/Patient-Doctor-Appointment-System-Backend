# Patient-Doctor Appointment System Backend

A robust Node.js backend service for managing patient-doctor appointments, built with Express, TypeScript, and PostgreSQL.

## Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Patient/Doctor/Admin)
  - Google OAuth integration
  - Refresh token mechanism
  
- 👨‍⚕️ **Doctor Management**
  - List all doctors with pagination
  - Filter available doctors by date
  - Doctor profile management
  
- 📅 **Appointment Management**
  - Create and manage appointments
  - Status tracking (Pending/Accepted/Completed/Cancelled)
  - Prescription management
  - Email notifications for status changes
  
- 🗃️ **Category Management**
  - CRUD operations for medical specialties
  - Category-based doctor filtering

## Tech Stack

- Node.js (18+)
- TypeScript
- Express.js
- PostgreSQL
- Sequelize ORM
- Jest for testing
- Swagger for API documentation
- Nodemailer for email notifications
- Passport.js for authentication

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 15 or higher
- npm or yarn package manager

## Environment Setup

1. Clone the repository
2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
3. Update the following environment variables:
   ```
   # Server
   PORT=4000
   NODE_ENV=development
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=patient_doctor_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   
   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1h
   REFRESH_TOKEN_EXPIRES_IN=7d
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
   
   # Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email
   SMTP_PASS=your_app_password
   ```

## Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate

# Seed initial data (optional)
npm run seed

# Start development server
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with initial data
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middlewares/    # Custom middlewares
├── models/         # Sequelize models
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── app.ts          # Express app setup
```

## API Documentation

API documentation is available at `/api-docs` when the server is running. It includes:

- Detailed endpoint descriptions
- Request/response schemas
- Authentication requirements
- Query parameters
- Error responses

## Testing

The project uses Jest for testing. Tests are located in the `__tests__` directory.

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- users.test.ts
```

## Database Migrations

```bash
# Create a new migration
npx sequelize-cli migration:generate --name migration-name

# Run migrations
npm run migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

## Deployment

The application uses GitLab CI/CD for automated deployment:

- `dev` branch deploys to development environment
- `test` branch deploys to testing environment
- `main` branch deploys to production environment

Each environment has its own database and configuration.

## Contributing

1. Create a feature branch from `dev`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass and coverage is maintained
5. Submit a merge request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 