import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { seedDatabase } from "../services/seed.service.js";

async function run() {
  await connectDatabase();
  await seedDatabase();
  console.log("Database seeded");
  await disconnectDatabase();
}

run().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
