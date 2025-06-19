// Test script to verify MCP solver integration
// This tests the highs-mcp server directly

const { spawn } = require('child_process');

async function testHighsMCPServer() {
  console.log('🧪 Testing HiGHS MCP Server Integration\n');

  try {
    console.log('1. Starting HiGHS MCP server...');
    
    // Start the highs-mcp server
    const highsProcess = spawn('npx', ['highs-mcp'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    // Wait a moment for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('2. HiGHS MCP server process started');
    console.log('   PID:', highsProcess.pid);
    console.log('   Status:', highsProcess.killed ? 'killed' : 'running');

    // Check if the process is still running
    if (highsProcess.killed) {
      console.log('❌ HiGHS MCP server failed to start');
      return;
    }

    console.log('✅ HiGHS MCP server is running');
    console.log('\n3. You can now test your construction workflow');
    console.log('   The solver should show "HiGHS" instead of "AI-powered optimization"');
    console.log('\n4. To stop the server, press Ctrl+C');

    // Keep the process running
    highsProcess.on('exit', (code) => {
      console.log(`\nHiGHS MCP server exited with code ${code}`);
    });

    highsProcess.on('error', (error) => {
      console.error('HiGHS MCP server error:', error);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nStopping HiGHS MCP server...');
      highsProcess.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testHighsMCPServer().catch(console.error); 