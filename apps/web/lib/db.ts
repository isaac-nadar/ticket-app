import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// 1. Initialize the base client
const basePrisma = globalThis.prisma ?? new PrismaClient({ adapter });

// 2. Create the Extension!
// This intercepts every 'findMany' and 'findFirst' call for Cards
const prisma = basePrisma.$extends({
  query: {
    card: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async findMany({ args, query }: any) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async findFirst({ args, query }: any) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
