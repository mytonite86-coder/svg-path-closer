import { refreshSession } from "./modules/auth.js";
import { initializeStrayNodePage } from "./stray-node-cleaner.js";

initializeStrayNodePage({ refreshSession });
