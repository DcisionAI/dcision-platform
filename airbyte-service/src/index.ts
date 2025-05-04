import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DcisionAIAirbyteService } from './core/service';
import { DEFAULT_WHITE_LABEL_CONFIG } from './config/types';
import { ConnectionConfig } from './api/models';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
// Debug: log key environment variables to help diagnose startup issues
console.log('DcisionAI Airbyte service starting with:');
console.log('  PORT=', process.env.PORT);
console.log('  SUPABASE_URL=', process.env.SUPABASE_URL);
console.log('  SUPABASE_SERVICE_KEY=', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');
console.log('  SUPABASE_KEY=', process.env.SUPABASE_KEY ? 'SET' : 'NOT SET');

app.use(cors());
app.use(express.json());

// Initialize the Airbyte service; prevent startup crashes if configuration is invalid
let service: DcisionAIAirbyteService;
try {
  service = new DcisionAIAirbyteService(DEFAULT_WHITE_LABEL_CONFIG);
} catch (err) {
  console.error('Failed to initialize DcisionAI Airbyte service:', err);
  // Provide a stub implementation so the server still starts; only health and stubbed endpoints work
  service = {
    listConnectors: async () => [],
    createConnection: async () => { throw err; },
    syncConnection: async () => { throw err; },
    getConnectionStatus: async () => { throw err; },
    getDrivers: async () => [],
    getOrders: async () => [],
  } as unknown as DcisionAIAirbyteService;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});
// List all connectors by default at root
app.get('/', async (req, res) => {
  try {
    const connectors = await service.listConnectors();
    res.json({ connectors });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// Create connection
app.post('/connections', async (req, res) => {
  try {
    const config: ConnectionConfig = req.body;
    const connection = await service.createConnection(config);
    res.json(connection);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

// Sync connection
app.post('/connections/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    const syncResult = await service.syncConnection(id);
    res.json(syncResult);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

// Get connection status
app.get('/connections/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = await service.getConnectionStatus(id);
    res.json(status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(404).json({ error: errorMessage });
  }
});

// List connectors
app.get('/connectors', async (req, res) => {
  try {
    const connectors = await service.listConnectors();
    res.json(connectors);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

// Get drivers
app.get('/drivers', async (req, res) => {
  try {
    console.log('Received request for drivers');
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    console.log('Using limit:', limit);
    const drivers = await service.getDrivers(limit);
    res.json(drivers);
  } catch (error) {
    console.error('Error handling drivers request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

// Get orders
app.get('/orders', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const orders = await service.getOrders(limit);
    res.json(orders);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(port, () => {
  console.log(`DcisionAI Airbyte service listening at http://localhost:${port}`);
}); 