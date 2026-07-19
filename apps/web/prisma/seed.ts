// apps/web/seed.ts
import prisma from "@/lib/db";
import bcrypt from "bcrypt";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@company.com";
  const adminPass = process.env.ADMIN_PASSWORD || "DevPassword123!";
  const hash = await bcrypt.hash(adminPass, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hash,
      role: "ADMIN",
      name: "System Admin"
    },
  });

  console.log("System Admin created:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
