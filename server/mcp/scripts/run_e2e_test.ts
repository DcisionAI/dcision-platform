import { runEndToEndTest } from '../tests/end_to_end.test';
import { MCP } from '../types/core';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    console.log('Starting end-to-end test...');
    
    // Load MCP configuration
    const configPath = path.join(__dirname, '../configs/sample_fleetops.mcp.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const mcp = config as MCP;

    // Run the test
    await runEndToEndTest(mcp);
    
    console.log('End-to-end test completed successfully!');
  } catch (error) {
    console.error('End-to-end test failed:', error);
    process.exit(1);
  }
}

main(); 