export interface DatabaseConnector {
  fetchData(source: string, fields: string[]): Promise<Record<string, any>>;
  validateConnection(): Promise<boolean>;
}

// Example implementation for testing
export class MockDatabaseConnector implements DatabaseConnector {
  async fetchData(source: string, fields: string[]): Promise<Record<string, any>> {
    // Mock implementation for testing
    return {
      [fields[0]]: 'mock_value',
      // Add more mock data as needed
    };
  }

  async validateConnection(): Promise<boolean> {
    return true;
  }
} 