"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = void 0;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_1.PrismaClient; } });
// Create a single instance of PrismaClient
const prisma = new client_1.PrismaClient();
// Export the instance
exports.default = prisma;
