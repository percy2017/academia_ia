import { PrismaClient } from '@prisma/client';

// PrismaClient is instantiated once per application,
// recommended by Prisma documentation.
const prisma = new PrismaClient();

export default prisma;
