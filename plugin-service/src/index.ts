import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DcisionAIDataService } from './core/service';
import { DataSourceConfig, DataDestinationConfig } from './api/models';

dotenv.config();

const app = express();
const port = process.env.PORT || 8002;

app.use(cors());
app.use(express.json());

const service = new DcisionAIDataService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'DcisionAI Data Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Create data pipeline
app.post('/pipelines', async (req, res) => {
  try {
    const { source, destination } = req.body;
    const pipeline = await service.createPipeline(
      source as DataSourceConfig,
      destination as DataDestinationConfig
    );
    res.json(pipeline);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

// Sync pipeline
app.post('/pipelines/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    const syncResult = await service.syncPipeline(id);
    res.json(syncResult);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

// Get pipeline status
app.get('/pipelines/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = await service.getPipelineStatus(id);
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

// Test Vercel ignore - this change should not trigger a Vercel deployment
app.listen(port, () => {
  console.log(`DcisionAI Data Service listening at http://localhost:${port}`);
}); 