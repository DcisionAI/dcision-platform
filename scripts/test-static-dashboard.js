#!/usr/bin/env node

// Test script for the static dashboard API
const fetch = require('node-fetch');

async function testStaticDashboard() {
  console.log('Testing Static Dashboard API...\n');
  
  try {
    // Test the static dashboard endpoint
    const response = await fetch('http://localhost:3000/api/dashboard/static');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Static Dashboard API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    // Validate the response structure
    if (data.kpi_cards && Array.isArray(data.kpi_cards)) {
      console.log('\n✅ KPI Cards found:', data.kpi_cards.length);
      data.kpi_cards.forEach((card, index) => {
        console.log(`  ${index + 1}. ${card.title}: ${card.value} - ${card.description}`);
      });
    }
    
    if (data.charts && Array.isArray(data.charts)) {
      console.log('\n✅ Charts found:', data.charts.length);
      data.charts.forEach((chart, index) => {
        console.log(`  ${index + 1}. ${chart.title} (${chart.type}) - ${chart.description}`);
      });
    }
    
    if (data.lastUpdated) {
      console.log('\n✅ Last Updated:', data.lastUpdated);
    }
    
    console.log('\n🎉 Static Dashboard API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Static Dashboard API:', error.message);
    process.exit(1);
  }
}

// Run the test
testStaticDashboard(); 