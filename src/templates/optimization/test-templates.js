const fs = require('fs');
const path = require('path');

// Simple test script to verify templates
const templatesDir = path.join(__dirname);
const jsonFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.json'));

console.log('🔍 Testing Template System');
console.log('========================');

// Test 1: Check if all JSON files are valid
console.log('\n1. Validating JSON files...');
let validTemplates = 0;

jsonFiles.forEach(file => {
  try {
    const filePath = path.join(templatesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const template = JSON.parse(content);
    
    // Basic validation
    const requiredFields = ['template_id', 'name', 'description', 'problem_type', 'sense', 'variables', 'constraints', 'objective', 'metadata'];
    const missingFields = requiredFields.filter(field => !template[field]);
    
    if (missingFields.length === 0) {
      console.log(`✅ ${file}: Valid template`);
      validTemplates++;
    } else {
      console.log(`❌ ${file}: Missing fields: ${missingFields.join(', ')}`);
    }
  } catch (error) {
    console.log(`❌ ${file}: Invalid JSON - ${error.message}`);
  }
});

// Test 2: Check for duplicate template IDs
console.log('\n2. Checking for duplicate template IDs...');
const templateIds = new Set();
let duplicates = 0;

jsonFiles.forEach(file => {
  try {
    const filePath = path.join(templatesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const template = JSON.parse(content);
    
    if (template.template_id) {
      if (templateIds.has(template.template_id)) {
        console.log(`❌ Duplicate template ID: ${template.template_id} in ${file}`);
        duplicates++;
      } else {
        templateIds.add(template.template_id);
      }
    }
  } catch (error) {
    // Skip invalid files
  }
});

if (duplicates === 0) {
  console.log('✅ No duplicate template IDs found');
}

// Test 3: Check template structure consistency
console.log('\n3. Checking template structure...');
let structureIssues = 0;

jsonFiles.forEach(file => {
  try {
    const filePath = path.join(templatesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const template = JSON.parse(content);
    
    // Check variables structure
    if (template.variables && Array.isArray(template.variables)) {
      template.variables.forEach((variable, index) => {
        if (!variable.name || !variable.type || !variable.bounds) {
          console.log(`❌ ${file}: Variable ${index} missing required fields`);
          structureIssues++;
        }
      });
    }
    
    // Check constraints structure
    if (template.constraints) {
      const { dense, sense, rhs } = template.constraints;
      if (!dense || !sense || !rhs) {
        console.log(`❌ ${file}: Constraints missing required arrays`);
        structureIssues++;
      } else if (dense.length !== sense.length || dense.length !== rhs.length) {
        console.log(`❌ ${file}: Constraints arrays have different lengths`);
        structureIssues++;
      }
    }
    
    // Check objective structure
    if (template.objective) {
      const { linear, quadratic } = template.objective;
      if (!linear && !quadratic) {
        console.log(`❌ ${file}: Objective missing coefficients`);
        structureIssues++;
      }
    }
    
  } catch (error) {
    // Skip invalid files
  }
});

if (structureIssues === 0) {
  console.log('✅ All templates have consistent structure');
}

// Summary
console.log('\n📊 Summary');
console.log('==========');
console.log(`Total JSON files: ${jsonFiles.length}`);
console.log(`Valid templates: ${validTemplates}`);
console.log(`Duplicate IDs: ${duplicates}`);
console.log(`Structure issues: ${structureIssues}`);

if (validTemplates === jsonFiles.length && duplicates === 0 && structureIssues === 0) {
  console.log('\n🎉 All tests passed! Template system is ready.');
} else {
  console.log('\n⚠️  Some issues found. Please fix before using templates.');
} 