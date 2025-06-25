# GPT-4o-mini Integration Guide

## Overview

DcisionAI now uses **GPT-4o-mini** as the default model for the Enhanced Model Builder, providing excellent performance and cost-effectiveness for optimization model generation.

## Why GPT-4o-mini?

### Performance Benefits
- **Speed**: 2x faster than GPT-4o
- **Cost**: 60x cheaper than GPT-4o
- **Accuracy**: Excellent mathematical reasoning capabilities
- **JSON Generation**: Reliable structured output for optimization models

### Optimization Capabilities
- **Mathematical Programming**: Strong understanding of LP, MIP, QP, NLP
- **Constraint Modeling**: Excellent at translating business rules to mathematical constraints
- **Variable Definition**: Precise variable type and bound specification
- **Objective Functions**: Accurate cost/benefit modeling

## Configuration

### Default Setup
The system automatically uses GPT-4o-mini by default:

```typescript
import { getModelConfig } from '../pages/api/_lib/config/modelConfig';

const config = getModelConfig('modelBuilderAgent');
// Returns: { provider: 'openai', modelName: 'gpt-4o-mini', useGPT4oMini: true }
```

### Environment Variables
Override default settings with environment variables:

```bash
# Use GPT-4o-mini (default)
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
USE_GPT4O_MINI=true

# Or use full GPT-4o for complex problems
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o
USE_GPT4O_MINI=false

# Or use Claude for comparison
MODEL_PROVIDER=anthropic
MODEL_NAME=claude-3-5-sonnet-20241022
USE_GPT4O_MINI=false
```

## Usage Examples

### Basic Usage
```typescript
import { EnhancedModelBuilder } from '../pages/api/_lib/dcisionai-agents/modelBuilderAgent/enhancedModelBuilder';

// Uses GPT-4o-mini by default
const builder = new EnhancedModelBuilder();

const result = await builder.buildModel(
  "Minimize cost for 100 units of material A at $50/unit",
  enrichedData,
  intent
);
```

### Explicit Configuration
```typescript
// Explicitly use GPT-4o-mini
const builder = new EnhancedModelBuilder('openai', 'gpt-4o-mini', true);

// Or use full GPT-4o for complex problems
const builder = new EnhancedModelBuilder('openai', 'gpt-4o', false);
```

## Model Performance Comparison

| Model | Speed | Cost | Mathematical Reasoning | JSON Generation |
|-------|-------|------|----------------------|-----------------|
| **GPT-4o-mini** | Fast | Low | Excellent | Reliable |
| GPT-4o | Medium | Medium | Excellent | Very Reliable |
| Claude-3.5 | Medium | Medium | Good | Good |
| Claude-Haiku | Very Fast | Very Low | Fair | Fair |

## Testing

Run the integration test to verify GPT-4o-mini functionality:

```bash
npx ts-node src/scripts/test-gpt4o-mini.ts
```

This test will:
1. Verify configuration setup
2. Test simple optimization problems
3. Test complex optimization problems
4. Compare performance across different models

## Best Practices

### When to Use GPT-4o-mini
- ✅ Most optimization problems
- ✅ Cost optimization
- ✅ Resource allocation
- ✅ Scheduling problems
- ✅ Portfolio optimization
- ✅ Supply chain optimization

### When to Consider GPT-4o
- 🔄 Very complex mathematical models
- 🔄 Multi-objective optimization with trade-offs
- 🔄 Novel optimization formulations
- 🔄 When maximum accuracy is critical

### When to Consider Claude
- 🔄 Alternative perspective needed
- 🔄 Different reasoning approach
- 🔄 Cost comparison analysis

## Error Handling

The Enhanced Model Builder includes robust error handling:

```typescript
try {
  const result = await builder.buildModel(userInput, enrichedData, intent);
  
  if (result.confidence < 0.5) {
    console.warn('Low confidence model generated');
  }
  
  console.log('Model built successfully:', result.approach);
} catch (error) {
  console.error('Model building failed:', error);
  // System will fall back to template-based generation
}
```

## Monitoring

Track model performance and usage:

```typescript
// Log model usage
console.log('Model Builder Result:', {
  approach: result.approach,
  confidence: result.confidence,
  modelType: result.modelType,
  problemComplexity: result.problemComplexity,
  reasoning: result.reasoning
});
```

## Troubleshooting

### Common Issues

1. **API Key Issues**
   ```bash
   # Ensure OpenAI API key is set
   export OPENAI_API_KEY=your_key_here
   ```

2. **Rate Limiting**
   - GPT-4o-mini has higher rate limits than GPT-4o
   - Implement exponential backoff for retries

3. **Model Not Available**
   - Fallback to template-based generation
   - Check model availability in your region

### Performance Optimization

1. **Batch Processing**: Group similar optimization problems
2. **Caching**: Cache common model structures
3. **Parallel Processing**: Run multiple model generations concurrently

## Migration Guide

### From GPT-4o
```typescript
// Old code
const builder = new EnhancedModelBuilder('openai', 'gpt-4o', false);

// New code (automatically uses GPT-4o-mini)
const builder = new EnhancedModelBuilder();
```

### From Claude
```typescript
// Old code
const builder = new EnhancedModelBuilder('anthropic', 'claude-3-5-sonnet-20241022');

// New code
const builder = new EnhancedModelBuilder('openai', 'gpt-4o-mini', true);
```

## Future Enhancements

1. **Model Selection**: Automatic model selection based on problem complexity
2. **Performance Tracking**: Real-time performance monitoring
3. **Cost Optimization**: Dynamic model switching based on cost constraints
4. **Quality Assurance**: Automated model validation and testing

## Support

For issues with GPT-4o-mini integration:
1. Check the test script output
2. Verify API key configuration
3. Review error logs for specific issues
4. Consider fallback to template-based generation 