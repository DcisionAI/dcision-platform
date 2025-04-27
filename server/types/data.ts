export interface DataSource {
    id: string;
    type: 'api' | 'database' | 'file';
    name: string;
    description?: string;
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    // Database specific fields
    connectionString?: string;
    query?: string;
    // File specific fields
    filePath?: string;
    fileFormat?: 'csv' | 'json' | 'excel';
}

export interface DataValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata?: {
        rowCount?: number;
        columnCount?: number;
        missingValues?: number;
        duplicateRows?: number;
    };
} 