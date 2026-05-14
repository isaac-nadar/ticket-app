// apps/web/seed.ts
import prisma from "@/lib/db";
import bcrypt from "bcrypt";

async function main() {
  const password = "password"; // Change this
  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@company.com",
      password: hash,
      role: "ADMIN",
    },
  });

  console.log("Admin user created:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
