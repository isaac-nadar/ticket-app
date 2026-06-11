// // Import side-effect listeners here
// import "@/domain/audit/audit.listener";
// import "@/domain/notification/notification.listener";

// // Later you’ll add:
// // import "@/domain/analytics/analytics.listener";

// Import the actual functions now, not just the files!
import { registerAuditListeners } from "./audit/audit.listener";
import { registerRealtimeListeners } from "./events/handlers/realtime.handler";
import { registerNotificationListeners } from "./notification/notification.listener";

// The Lock
let isBootstrapped = false;

export function bootstrap() {
  // If we already ran this, abort immediately! (Prevents memory leaks)
  if (isBootstrapped) return;

  console.log("🚀 [Bootstrap] Waking up Domain Event Listeners...");

  // Call the functions explicitly to attach them to the Bus
  registerAuditListeners();
  registerNotificationListeners();
  registerRealtimeListeners();

  // Lock the door behind us
  isBootstrapped = true;
}

// Execute it!
bootstrap();
