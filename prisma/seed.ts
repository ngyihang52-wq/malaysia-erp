/**
 * Seed script — creates the default NexaCommerce org + admin user
 * Run with: npx tsx prisma/seed.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Upsert the organisation
  const org = await prisma.organization.upsert({
    where: { slug: "nexacommerce" },
    update: {},
    create: {
      name: "NexaCommerce SEA",
      slug: "nexacommerce",
      isActive: true,
    },
  });
  console.log(`✅ Organisation: ${org.name} (${org.id})`);

  // 2. Upsert the admin user
  const hash = await bcrypt.hash("1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "me@nexa.com" },
    update: { password: hash, role: "ADMIN", name: "Boss" },
    create: {
      email: "me@nexa.com",
      password: hash,
      name: "Boss",
      role: "ADMIN",
      orgId: org.id,
    },
  });
  console.log(`✅ Admin user: ${user.email} (role: ${user.role})`);

  console.log("\n✨ Done! You can now log in with:");
  console.log("   Email:    me@nexa.com");
  console.log("   Password: 1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
