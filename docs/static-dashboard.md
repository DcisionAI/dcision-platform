# Static Dashboard

The Static Dashboard is a lightweight, efficient alternative to the dynamic LLM-driven dashboard. It extracts specific KPI information directly from structured data files (CSV, XLSX) stored in Pinecone, without using LLM processing.

## Features

### KPI Cards
The dashboard automatically extracts and displays the following KPIs from your data files:

- **Data Files**: Total number of structured data files uploaded
- **Projects**: Number of projects identified in the data
- **Workers**: Number of workers/employees tracked
- **Tasks**: Number of tasks/activities identified
- **Equipment**: Number of equipment/machinery items tracked

### Charts
- **Project Status Distribution**: Bar chart showing the distribution of project statuses
- **Data File Types**: Pie chart showing the distribution of uploaded file types

## How It Works

1. **Data Extraction**: The dashboard queries Pinecone for all structured data files (CSV, XLSX, XLS)
2. **Pattern Recognition**: It uses pattern matching to identify:
   - Project-related data (looks for "project_id", "project", "Project")
   - Worker data (looks for "worker", "employee", "staff")
   - Task data (looks for "task", "activity")
   - Equipment data (looks for "equipment", "machine")
   - Status information (extracts status values from data)
3. **KPI Generation**: Creates KPI cards and charts based on the extracted data
4. **Caching**: Results are cached for 5 minutes to improve performance

## Benefits

- **Token Efficient**: No LLM processing required, saving tokens and costs
- **Fast**: Direct data extraction without AI processing delays
- **Reliable**: Consistent results based on actual data patterns
- **Scalable**: Can handle large datasets efficiently

## Usage

### In Construction Workflow
The static dashboard is available as a tab in the Construction Workflow page (`/construction`).

### Standalone Page
Access the dashboard directly at `/dashboard` for a full-screen view.

### API Endpoint
The dashboard data is available via API at `/api/dashboard/static`.

## Supported File Types

- CSV files
- Excel files (XLSX, XLS)
- JSON files with structured data

## Data Requirements

For best results, ensure your data files contain:
- Clear column headers
- Consistent naming conventions
- Project identifiers
- Status information
- Worker/task/equipment data

## Example Data Structure

```csv
project_id,name,status,workers,tasks,equipment
P001,Midtown Tower,Active,15,25,8
P002,Riverside Mall,Planning,8,12,3
P003,Greenfield Hospital,Active,22,35,12
```

## Testing

Run the test script to verify the dashboard functionality:

```bash
node scripts/test-static-dashboard.js
```

## Configuration

The dashboard can be configured by modifying:
- Cache duration in `/api/dashboard/static.ts`
- KPI extraction patterns
- Chart types and configurations
- File type filters

## Future Enhancements

- Support for more data file types
- Custom KPI definitions
- Advanced pattern matching
- Real-time data updates
- Export functionality 