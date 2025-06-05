import { createClient, solveLaborScheduling, solveResourceAllocation, solveProjectScheduling, solveMaterialDeliveryPlanning, solveRiskSimulation } from './index';
import { DefaultApi } from './generated';

describe('SDK Client', () => {
  it('should create a DefaultApi client instance', () => {
    const apiKey = 'test-key';
    const baseUrl = 'http://localhost';
    const client = createClient(apiKey, baseUrl);
    expect(client).toBeInstanceOf(DefaultApi);
  });
  
  describe('wrapper functions', () => {
    const apiKey = 'abc123';
    beforeEach(() => {
      // @ts-ignore
      global.fetch = jest.fn((url, opts) =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, url, body: opts?.body })
        }) as any
      );
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('solveLaborScheduling sends correct payload', async () => {
      const model = { foo: 'bar' };
      const res = await solveLaborScheduling(apiKey, model, { baseUrl: 'http://host' });
      expect(res).toEqual(expect.objectContaining({ success: true }));
      // verify fetch called on correct endpoint and body contains model
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('http://host/mcp/submit');
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toMatchObject({ problemType: 'labor_scheduling', ...model });
    });

    it('solveResourceAllocation sends correct payload', async () => {
      const model = { a: 1 };
      const res = await solveResourceAllocation(apiKey, model);
      expect(res).toEqual(expect.objectContaining({ success: true }));
      const called = (global.fetch as jest.Mock).mock.calls[0];
      expect(called[0]).toBe('https://mcp.dcisionai.com/mcp/submit');
      const b = JSON.parse(called[1].body);
      expect(b.context.problemType).toBe('equipment_allocation');
      expect(b.model).toMatchObject({ problemType: 'equipment_allocation', ...model });
    });
    
    it('solveProjectScheduling sends correct payload', async () => {
      const model = { x: 42 };
      const res = await solveProjectScheduling(apiKey, model, { baseUrl: 'http://host' });
      expect(res).toEqual(expect.objectContaining({ success: true }));
      const called = (global.fetch as jest.Mock).mock.calls.pop();
      expect(called[0]).toBe('http://host/mcp/submit');
      const body = JSON.parse(called[1].body);
      expect(body.context.problemType).toBe('risk_simulation');
      expect(body.model).toMatchObject({ problemType: 'risk_simulation', ...model });
    });

    it('solveMaterialDeliveryPlanning sends correct payload', async () => {
      const model = { deliveries: [] };
      const res = await solveMaterialDeliveryPlanning(apiKey, model, { baseUrl: 'http://host' });
      expect(res).toEqual(expect.objectContaining({ success: true }));
      const called = (global.fetch as jest.Mock).mock.calls.pop();
      expect(called[0]).toBe('http://host/mcp/submit');
      const body = JSON.parse(called[1].body);
      expect(body.context.problemType).toBe('material_delivery_planning');
    });

    it('solveRiskSimulation sends correct payload', async () => {
      const model = { foo: 'bar' };
      const res = await solveRiskSimulation(apiKey, model, { baseUrl: 'http://host' });
      expect(res).toEqual(expect.objectContaining({ success: true }));
      const called = (global.fetch as jest.Mock).mock.calls.pop();
      expect(called[0]).toBe('http://host/mcp/submit');
      const body = JSON.parse(called[1].body);
      expect(body.context.problemType).toBe('risk_simulation');
    });
  });
});