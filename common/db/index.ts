import { PrismaClient } from '@prisma/client';

// Create a single instance of PrismaClient
const prisma = new PrismaClient();

// Export the instance as default
export default prisma;

// Also export the type for type checking
export type { PrismaClient }; 