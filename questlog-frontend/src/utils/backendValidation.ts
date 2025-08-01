/**
 * Path validation for backend imports
 * This file ensures the backend path mapping is working correctly
 */

import { resolve } from "path";
import { existsSync } from "fs";

const BACKEND_PATH = resolve(__dirname, "../questlog-backend");

// Validate that backend directory exists
if (!existsSync(BACKEND_PATH)) {
  throw new Error(`Backend directory not found at: ${BACKEND_PATH}
    
Please ensure:
1. The questlog-backend folder exists at the expected location
2. The frontend and backend are in the same parent directory
3. The path mapping in tsconfig.app.json is correct`);
}

// Validate critical backend files exist
const criticalFiles = [
  "package.json",
  "services/supabase.ts",
  "types/quest.ts",
  "types/badge.ts"
];

for (const file of criticalFiles) {
  const filePath = resolve(BACKEND_PATH, file);
  if (!existsSync(filePath)) {
    throw new Error(`Critical backend file missing: ${filePath}`);
  }
}

console.log("✅ Backend path validation passed");
export { BACKEND_PATH };
