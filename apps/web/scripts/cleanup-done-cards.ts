import "dotenv/config";
import { cleanupDoneCards } from "@/domain/jobs/cleanup-done-cards.job";

async function main() {
  await cleanupDoneCards();
  process.exit(0);
}

main().catch((err) => {
  console.error("Cleanup job failed", err);
  process.exit(1);
});
