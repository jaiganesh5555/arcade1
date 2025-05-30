"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Create a single instance of PrismaClient
const prisma = new client_1.PrismaClient();
// Export the instance as default
exports.default = prisma;
