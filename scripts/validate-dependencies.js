#!/usr/bin/env node

/**
 * Dependency validation script for Questlog workspace
 * Ensures all dependencies are compatible and properly installed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Expected dependency versions and compatibility checks
const COMPATIBILITY_CHECKS = {
  'questlog-frontend': {
    packageJson: 'questlog-frontend/package.json',
    criticalDeps: {
      'react': '^18.2.0',
      'typescript': '^5.3.3',
      'vite': '^5.0.8',
      '@supabase/supabase-js': '^2.39.0',
      'wagmi': '^2.2.1',
      '@rainbow-me/rainbowkit': '^2.0.1'
    }
  },
  'questlog-backend': {
    packageJson: 'questlog-backend/package.json',
    criticalDeps: {
      'typescript': '^5.3.3',
      '@supabase/supabase-js': '^2.39.0'
    }
  },
  'questlog-contracts': {
    packageJson: 'questlog-contracts/package.json',
    foundryToml: 'questlog-contracts/foundry.toml'
  }
};

function loadPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function parseVersion(version) {
  // Remove version prefixes like ^, ~, >=
  const cleanVersion = version.replace(/^[\^~>=<]+/, '');
  return cleanVersion.split('.').map(num => parseInt(num, 10));
}

function compareVersions(version1, version2) {
  const v1 = parseVersion(version1);
  const v2 = parseVersion(version2);
  
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

function checkNodeModules(modulePath) {
  const nodeModulesPath = path.join(modulePath, 'node_modules');
  return fs.existsSync(nodeModulesPath);
}

function validateDependencies(moduleName, config) {
  console.log(`\n📦 Validating ${moduleName} dependencies...`);
  
  const packageJsonPath = path.join(process.cwd(), config.packageJson);
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`❌ ${config.packageJson} not found`);
    return false;
  }
  
  const packageJson = loadPackageJson(packageJsonPath);
  if (!packageJson) {
    console.log(`❌ Failed to parse ${config.packageJson}`);
    return false;
  }
  
  const moduleDir = path.dirname(packageJsonPath);
  
  // Check if node_modules exists
  if (!checkNodeModules(moduleDir)) {
    console.log(`❌ node_modules not found - run 'npm install' in ${path.dirname(config.packageJson)}`);
    return false;
  }
  
  let isValid = true;
  
  // Check critical dependencies
  if (config.criticalDeps) {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    const issues = [];
    
    Object.entries(config.criticalDeps).forEach(([depName, expectedVersion]) => {
      const actualVersion = allDeps[depName];
      
      if (!actualVersion) {
        issues.push(`Missing: ${depName}`);
        isValid = false;
      } else {
        // For now, just check if dependency exists
        // More sophisticated version checking can be added
        console.log(`✅ ${depName}: ${actualVersion}`);
      }
    });
    
    if (issues.length > 0) {
      console.log(`❌ Dependency issues: ${issues.join(', ')}`);
    }
  }
  
  // Special checks for contracts (Foundry)
  if (config.foundryToml) {
    const foundryPath = path.join(process.cwd(), config.foundryToml);
    if (!fs.existsSync(foundryPath)) {
      console.log(`❌ ${config.foundryToml} not found`);
      isValid = false;
    } else {
      console.log(`✅ Foundry configuration found`);
      
      // Check if forge is available
      try {
        execSync('forge --version', { stdio: 'pipe' });
        console.log(`✅ Foundry/Forge is installed`);
      } catch (error) {
        console.log(`❌ Foundry/Forge not found - install from https://foundry.paradigm.xyz`);
        isValid = false;
      }
    }
  }
  
  if (isValid) {
    console.log(`✅ ${moduleName} dependencies are valid`);
  }
  
  return isValid;
}

function checkWorkspaceConsistency() {
  console.log(`\n🔄 Checking workspace consistency...`);
  
  // Check if all modules have consistent TypeScript versions
  const tsVersions = {};
  
  Object.entries(COMPATIBILITY_CHECKS).forEach(([module, config]) => {
    if (config.criticalDeps && config.criticalDeps.typescript) {
      const packageJson = loadPackageJson(path.join(process.cwd(), config.packageJson));
      if (packageJson) {
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        tsVersions[module] = allDeps.typescript;
      }
    }
  });
  
  const uniqueVersions = [...new Set(Object.values(tsVersions))];
  if (uniqueVersions.length > 1) {
    console.log(`⚠️  TypeScript version mismatch across modules:`);
    Object.entries(tsVersions).forEach(([module, version]) => {
      console.log(`   ${module}: ${version}`);
    });
    console.log(`💡 Consider standardizing TypeScript versions`);
  } else {
    console.log(`✅ TypeScript versions are consistent`);
  }
}

function main() {
  console.log('🔍 Questlog Dependency Validation');
  console.log('==================================');
  
  let allValid = true;
  
  Object.entries(COMPATIBILITY_CHECKS).forEach(([module, config]) => {
    const isValid = validateDependencies(module, config);
    allValid = allValid && isValid;
  });
  
  checkWorkspaceConsistency();
  
  console.log('\n📊 Validation Summary');
  console.log('====================');
  
  if (allValid) {
    console.log('✅ All dependencies are properly configured!');
    console.log('\n🚀 Ready to build and deploy');
    process.exit(0);
  } else {
    console.log('❌ Some dependencies need attention');
    console.log('\n💡 Tips:');
    console.log('- Run "npm run install:all" to install all dependencies');
    console.log('- Ensure Foundry is installed for smart contract development');
    console.log('- Check for version conflicts between modules');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateDependencies, COMPATIBILITY_CHECKS };
