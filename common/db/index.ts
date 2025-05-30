import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
export { PrismaClient }; // Re-export PrismaClient type 