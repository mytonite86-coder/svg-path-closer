import { refreshSession } from "./modules/auth.js";
import { initializeCurvePage } from "./curve-repair.js";

initializeCurvePage({ refreshSession });
