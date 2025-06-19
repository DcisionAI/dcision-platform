#!/usr/bin/env node

/**
 * Verification script for single service setup
 * Tests both Next.js frontend and Agno backend
 */

const http = require('http');
const https = require('https');

console.log('🔍 Verifying Single Service Setup (Next.js + Agno Backend)\n');

// Configuration
const config = {
  frontend: {
    host: process.env.FRONTEND_HOST || 'localhost',
    port: process.env.FRONTEND_PORT || 8080,
    path: '/api/health'
  },
  agno: {
    host: process.env.AGNO_HOST || 'localhost',
    port: process.env.AGNO_PORT || 8000,
    path: '/health'
  }
};

// Helper function to make HTTP requests
function makeRequest(host, port, path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`${description} failed: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`${description} timed out`));
    });

    req.end();
  });
}

// Test functions
async function testFrontend() {
  console.log('🌐 Testing Next.js Frontend...');
  try {
    const result = await makeRequest(
      config.frontend.host,
      config.frontend.port,
      config.frontend.path,
      'Frontend health check'
    );
    
    if (result.status === 200) {
      console.log('✅ Frontend is responding');
      console.log(`   Status: ${result.status}`);
      return true;
    } else {
      console.log(`❌ Frontend returned status: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Frontend test failed: ${error.message}`);
    return false;
  }
}

async function testAgnoBackend() {
  console.log('🐍 Testing Agno Backend...');
  try {
    const result = await makeRequest(
      config.agno.host,
      config.agno.port,
      config.agno.path,
      'Agno backend health check'
    );
    
    if (result.status === 200) {
      console.log('✅ Agno backend is responding');
      console.log(`   Status: ${result.status}`);
      if (result.data && result.data.status) {
        console.log(`   Backend Status: ${result.data.status}`);
        console.log(`   Anthropic Configured: ${result.data.anthropic_configured ? '✅' : '❌'}`);
        console.log(`   OpenAI Configured: ${result.data.openai_configured ? '✅' : '❌'}`);
        console.log(`   Active Agents: ${result.data.active_agents || 0}`);
      }
      return true;
    } else {
      console.log(`❌ Agno backend returned status: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Agno backend test failed: ${error.message}`);
    return false;
  }
}

async function testIntegration() {
  console.log('🔗 Testing Integration...');
  try {
    // Test if the frontend can communicate with the backend
    const result = await makeRequest(
      config.frontend.host,
      config.frontend.port,
      '/api/agno/health',
      'Frontend-to-backend integration'
    );
    
    if (result.status === 200) {
      console.log('✅ Frontend can communicate with Agno backend');
      return true;
    } else {
      console.log(`❌ Integration test returned status: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Integration test failed: ${error.message}`);
    return false;
  }
}

// Main verification function
async function runVerification() {
  console.log('=' .repeat(60));
  
  const results = {
    frontend: await testFrontend(),
    agno: await testAgnoBackend(),
    integration: false
  };

  // Only test integration if both services are up
  if (results.frontend && results.agno) {
    results.integration = await testIntegration();
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 Verification Results:');
  console.log(`   Frontend (Next.js): ${results.frontend ? '✅' : '❌'}`);
  console.log(`   Agno Backend: ${results.agno ? '✅' : '❌'}`);
  console.log(`   Integration: ${results.integration ? '✅' : '❌'}`);

  const allPassed = results.frontend && results.agno && results.integration;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Single service is working correctly.');
    console.log('\n📋 Service Status:');
    console.log(`   Frontend: http://${config.frontend.host}:${config.frontend.port}`);
    console.log(`   Agno Backend: http://${config.agno.host}:${config.agno.port}`);
    console.log('\n🚀 Ready for production use!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the service configuration.');
    process.exit(1);
  }
}

// Run verification
runVerification().catch(console.error); 