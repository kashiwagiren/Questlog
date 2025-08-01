#!/usr/bin/env node

/**
 * Environment validation script for Questlog workspace
 * Validates all environment variables across frontend, backend, and contracts
 */

const fs = require('fs');
const path = require('path');

// Required environment variables by module
const ENV_REQUIREMENTS = {
  frontend: {
    file: 'questlog-frontend/.env',
    required: [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_DISCORD_CLIENT_ID',
      'VITE_DISCORD_REDIRECT_URI',
      'VITE_PINATA_JWT',
      'VITE_QUESTLOG_CONTRACT_ADDRESS',
      'VITE_QUEST_MINTER_CONTRACT_ADDRESS'
    ]
  },
  backend: {
    file: 'questlog-backend/.env',
    required: [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY',
      'DISCORD_CLIENT_ID',
      'DISCORD_CLIENT_SECRET',
      'DISCORD_BOT_TOKEN',
      'PINATA_JWT',
      'PINATA_API_KEY',
      'PINATA_SECRET_KEY'
    ]
  },
  contracts: {
    file: 'questlog-contracts/.env',
    required: [
      'PRIVATE_KEY',
      'LISK_SEPOLIA_RPC_URL',
      'INITIAL_OWNER'
    ]
  }
};

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    return null;
  }
}

function validateModule(moduleName, config) {
  console.log(`\n📋 Validating ${moduleName} environment...`);
  
  const envPath = path.join(process.cwd(), config.file);
  const examplePath = envPath + '.example';
  
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.log(`❌ ${config.file} not found`);
    if (fs.existsSync(examplePath)) {
      console.log(`💡 Copy ${config.file}.example to ${config.file} and fill in values`);
    }
    return false;
  }
  
  // Load environment variables
  const env = loadEnvFile(envPath);
  if (!env) {
    console.log(`❌ Failed to parse ${config.file}`);
    return false;
  }
  
  // Check required variables
  let isValid = true;
  const missing = [];
  const empty = [];
  
  config.required.forEach(key => {
    if (!(key in env)) {
      missing.push(key);
      isValid = false;
    } else if (!env[key] || env[key].trim() === '') {
      empty.push(key);
      isValid = false;
    }
  });
  
  if (missing.length > 0) {
    console.log(`❌ Missing variables: ${missing.join(', ')}`);
  }
  
  if (empty.length > 0) {
    console.log(`❌ Empty variables: ${empty.join(', ')}`);
  }
  
  if (isValid) {
    console.log(`✅ ${moduleName} environment is valid (${config.required.length} variables)`);
  }
  
  return isValid;
}

function main() {
  console.log('🔍 Questlog Environment Validation');
  console.log('==================================');
  
  let allValid = true;
  
  Object.entries(ENV_REQUIREMENTS).forEach(([module, config]) => {
    const isValid = validateModule(module, config);
    allValid = allValid && isValid;
  });
  
  console.log('\n📊 Validation Summary');
  console.log('====================');
  
  if (allValid) {
    console.log('✅ All environments are properly configured!');
    process.exit(0);
  } else {
    console.log('❌ Some environments need attention');
    console.log('\n💡 Tips:');
    console.log('- Copy .env.example files to .env in each module');
    console.log('- Fill in all required environment variables');
    console.log('- Check documentation for obtaining API keys');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateModule, ENV_REQUIREMENTS };
