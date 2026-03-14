import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const BCRYPT_ROUNDS = 12;

async function main() {
  if (!ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD environment variable is required for seeding. Set a strong password in your .env file.");
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, isAdmin: true, name: "Admin" },
    create: {
      email: ADMIN_EMAIL,
      name: "Admin",
      passwordHash,
      isAdmin: true,
    },
  });
  console.log(`Admin user ready: ${ADMIN_EMAIL}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
