# Optimization Templates

This directory contains pre-built, production-ready optimization templates for construction problems.

## Template Structure

Each template includes:
- **Problem Type**: LP (Linear Programming), MIP (Mixed Integer Programming), QP (Quadratic Programming), etc.
- **Variables**: Pre-defined variable structures with realistic bounds
- **Constraints**: Industry-standard constraints for construction problems
- **Objective**: Common objective functions (minimize cost, duration, etc.)
- **Parameters**: Configurable parameters that can be adjusted based on user input
- **Solver Config**: Optimized solver settings for each problem type
- **Metadata**: Classification and tagging for easy discovery

## Available Templates

### 1. Crew Assignment Templates
- `crew_assignment_basic.json` - Basic crew allocation across phases

### 2. Resource Allocation Templates
- `resource_allocation_basic.json` - Resource allocation across multiple projects

### 3. Cost Optimization Templates
- `cost_optimization_basic.json` - Basic cost minimization with quality constraints

### 4. Supply Chain Templates
- `supply_chain_basic.json` - Supply chain optimization with multiple suppliers

### 5. Risk Management Templates
- `risk_management_basic.json` - Risk mitigation with quadratic objectives

## Template Format

```json
{
  "template_id": "crew_assignment_basic",
  "name": "Basic Crew Assignment",
  "description": "Optimize crew allocation across construction phases",
  "problem_type": "MIP",
  "sense": "minimize",
  "variables": [
    {
      "name": "carpenters",
      "type": "int",
      "category": "worker",
      "description": "Number of carpenters",
      "bounds": {
        "lower": 0,
        "upper": 10
      }
    }
  ],
  "constraints": {
    "dense": [[1, 0, 0, 0]],
    "sense": [">="],
    "rhs": [5],
    "categories": ["capacity"],
    "descriptions": ["Minimum carpenter requirement"]
  },
  "objective": {
    "type": "minimize",
    "target": "total_worker_hours",
    "description": "Minimize total worker hours",
    "linear": [1, 1, 1, 1]
  },
  "parameters": {
    "max_crew_per_skill": 10,
    "min_crew_per_phase": 2
  },
  "solver_config": {
    "time_limit": 300,
    "gap_tolerance": 0.01,
    "construction_heuristics": true
  },
  "metadata": {
    "domain": "construction",
    "complexity": "basic",
    "tags": ["workforce", "scheduling", "crew"]
  }
}
```

## Usage

### Basic Template Loading

```typescript
import { templateLoader } from '@/templates/optimization';

// Get a specific template
const template = templateLoader.getTemplate('crew_assignment_basic');

// Get all templates
const allTemplates = templateLoader.getAllTemplates();

// Get templates by domain
const constructionTemplates = templateLoader.getTemplatesByDomain('construction');
```

### Template Search and Recommendations

```typescript
// Search by tags
const schedulingTemplates = templateLoader.searchTemplatesByTags(['scheduling', 'workforce']);

// Get recommendations based on intent
const recommendations = templateLoader.getTemplateRecommendations('crew assignment', 'construction');

// Search with criteria
const templates = templateLoader.searchTemplates({
  domain: 'construction',
  complexity: 'basic',
  tags: ['cost', 'optimization']
});
```

### Integration with Existing Solvers

```typescript
import { EnhancedConstructionMCPSolver } from '@/templates/optimization/integration-example';

const solver = new EnhancedConstructionMCPSolver();

// Get template-based problem
const template = await solver.getTemplateBasedProblem('crew assignment', {
  budget_limit: 50000,
  time_limit: 30
});

// Convert to MCP format
const mcpProblem = solver.convertTemplateToMCP(template);
```

## API Endpoints

### List Templates
```
GET /api/templates/list
```

### Search Templates
```
GET /api/templates/list?domain=construction&complexity=basic
```

### Get Template Recommendations
```
GET /api/templates/list?intent=crew assignment&domain=construction
```

### Get Specific Template
```
GET /api/templates/list?templateId=crew_assignment_basic
```

## Template Validation

All templates are validated for:
- Required fields presence
- JSON syntax validity
- Constraint matrix consistency
- Variable bounds validity
- Objective function structure

Run validation:
```bash
cd src/templates/optimization
node test-templates.js
```

## Benefits

1. **Reliability**: Pre-tested, production-ready templates
2. **Performance**: Fast template selection vs. generation from scratch
3. **Consistency**: Standardized problem structures
4. **Maintainability**: Easy to update and improve templates
5. **Scalability**: Can add new templates without changing agent logic
6. **Discoverability**: Rich metadata and tagging system
7. **Flexibility**: Parameter customization and intent-based selection

## Adding New Templates

1. Create a new JSON file in the templates directory
2. Follow the template format specification
3. Include comprehensive metadata and tags
4. Test with the validation script
5. Update this README with template description

## Template Categories

- **Workforce**: Crew assignment, scheduling, skill matching
- **Resource**: Equipment allocation, material optimization
- **Cost**: Budget optimization, cost minimization
- **Supply Chain**: Supplier selection, logistics optimization
- **Risk**: Risk mitigation, safety optimization
- **Scheduling**: Project scheduling, timeline optimization 