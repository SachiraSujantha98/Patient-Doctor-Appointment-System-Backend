import dotenv from 'dotenv';
import { sequelize } from '../config/database';

// Set test environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

dotenv.config({ path: '.env.test' });

// Mock passport strategies
jest.mock('passport-google-oauth20');
jest.mock('passport-jwt');

beforeAll(async () => {
  // Connect to test database
  await sequelize.authenticate();
  // Sync database (create tables)
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

beforeEach(async () => {
  // Clear all tables before each test
  const tables = Object.values(sequelize.models);
  for (const table of tables) {
    await table.destroy({ truncate: true, cascade: true });
  }
}); 