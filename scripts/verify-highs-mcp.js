#!/usr/bin/env node

/**
 * Verification script for highs-mcp installation
 * This script checks if highs-mcp is properly installed and accessible
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying highs-mcp installation...\n');

// Check if highs-mcp is in package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasHighsMcp = packageJson.dependencies && packageJson.dependencies['highs-mcp'];
  
  if (hasHighsMcp) {
    console.log('✅ highs-mcp found in package.json dependencies');
    console.log(`   Version: ${hasHighsMcp}`);
  } else {
    console.log('❌ highs-mcp not found in package.json dependencies');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  process.exit(1);
}

// Check if node_modules/highs-mcp exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules', 'highs-mcp');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ highs-mcp found in node_modules');
  
  // Check package.json in node_modules
  try {
    const highsPackageJson = JSON.parse(fs.readFileSync(path.join(nodeModulesPath, 'package.json'), 'utf8'));
    console.log(`   Installed version: ${highsPackageJson.version}`);
    console.log(`   Package name: ${highsPackageJson.name}`);
    
    // Check if main entry point exists
    if (highsPackageJson.main) {
      const mainPath = path.join(nodeModulesPath, highsPackageJson.main);
      if (fs.existsSync(mainPath)) {
        console.log('✅ Main entry point exists');
      } else {
        console.log('❌ Main entry point not found');
      }
    }
  } catch (error) {
    console.log('❌ Error reading highs-mcp package.json:', error.message);
  }
} else {
  console.log('❌ highs-mcp not found in node_modules');
  console.log('   Run: yarn install or npm install');
  process.exit(1);
}

// Try to require the package
try {
  const highsMcp = require('highs-mcp');
  console.log('✅ highs-mcp can be required successfully');
  
  // Check if it has expected properties/methods
  if (typeof highsMcp === 'object') {
    console.log('✅ highs-mcp exports an object');
    
    // List available properties/methods
    const properties = Object.keys(highsMcp);
    if (properties.length > 0) {
      console.log(`   Available properties: ${properties.join(', ')}`);
    } else {
      console.log('   No properties found (might be a default export)');
    }
  }
} catch (error) {
  console.log('❌ Error requiring highs-mcp:', error.message);
  process.exit(1);
}

console.log('\n🎉 highs-mcp verification completed successfully!');
console.log('\n📋 Summary:');
console.log('• Package is listed in dependencies');
console.log('• Package is installed in node_modules');
console.log('• Package can be required');

console.log('\n🚀 Ready for deployment!'); 