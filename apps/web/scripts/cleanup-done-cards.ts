import "dotenv/config"; // CRITICAL: Loads the DB password!
import { cleanupDoneCards } from "@/domain/jobs/cleanup-done-cards.job";

async function main() {
  await cleanupDoneCards();
  process.exit(0); // Exit successfully
}

main().catch((err) => {
  console.error("Cleanup job failed", err);
  process.exit(1); // Exit with error code
});
