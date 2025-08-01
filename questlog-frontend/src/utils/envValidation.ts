/**
 * Environment Variables Validation
 * Ensures frontend and backend have compatible environment setup
 */

// Required environment variables for the frontend
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_DISCORD_CLIENT_ID',
  'VITE_PINATA_JWT'
];

// Optional but recommended environment variables
const OPTIONAL_ENV_VARS = [
  'VITE_QUESTLOG_CONTRACT_ADDRESS',
  'VITE_QUEST_MINTER_CONTRACT_ADDRESS'
];

function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!import.meta.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional variables  
  for (const envVar of OPTIONAL_ENV_VARS) {
    if (!import.meta.env[envVar]) {
      warnings.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('Please check your .env file and ensure all required variables are set');
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Optional environment variables not set:', warnings);
    console.warn('Some features may not work correctly');
  }

  console.log('✅ Environment validation passed');
}

// Run validation on import
validateEnvironment();

export { validateEnvironment };
