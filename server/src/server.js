import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { seedDatabase } from "./services/seed.service.js";

async function start() {
  await connectDatabase();
  await seedDatabase();

  app.listen(env.port, () => {
    console.log(`SolanaBlocks API running on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
