import { MCP, Variable, Constraint, Objective, VariableType } from '../MCPTypes';
import { FleetConstraintFactory } from '../constraints/FleetConstraints';

interface Item {
  id: string;
  width: number;
  height: number;
  depth?: number;
  weight: number;
  value?: number;
  rotatable?: boolean;
  stackable?: boolean;
  fragile?: boolean;
}

interface Bin {
  id: string;
  width: number;
  height: number;
  depth?: number;
  maxWeight: number;
  cost?: number;
  features?: string[];
}

interface BPPConfig {
  items: Item[];
  bins: Bin[];
  is3D?: boolean;
  constraints?: {
    maxBinsUsed?: number;
    binFeatureRequirements?: Record<string, string[]>;
    stackingRules?: Array<{
      topItem: string;
      bottomItem: string;
      allowed: boolean;
    }>;
    weightDistribution?: {
      maxImbalance: number;
      referenceAxis: 'x' | 'y' | 'z';
    };
  };
  objectives?: {
    minimizeBins?: boolean;
    minimizeCost?: boolean;
    maximizeValue?: boolean;
    balanceWeight?: boolean;
  };
}

export class BinPackingTemplate {
  private config: BPPConfig;
  public readonly complexity = 'intermediate';

  constructor(config: BPPConfig) {
    this.config = config;
  }

  private createVariables(): Variable[] {
    const variables: Variable[] = [
      {
        name: 'item_assignments',
        type: 'array',
        description: 'Assignment of items to bins with position and orientation',
        metadata: {
          itemType: 'object',
          properties: {
            itemId: 'string',
            binId: 'string',
            position: 'object',
            orientation: 'string',
            rotation: 'object'
          }
        }
      },
      {
        name: 'bin_utilization',
        type: 'array',
        description: 'Utilization metrics for each bin',
        metadata: {
          itemType: 'object',
          properties: {
            binId: 'string',
            volumeUsed: 'number',
            weightUsed: 'number',
            remainingSpace: 'number',
            valueStored: 'number'
          }
        }
      }
    ];

    if (this.config.is3D) {
      variables.push({
        name: 'stacking_order',
        type: 'array',
        description: 'Stacking sequence of items in each bin',
        metadata: {
          itemType: 'object',
          properties: {
            binId: 'string',
            layerNumber: 'integer',
            items: 'array'
          }
        }
      });
    }

    return variables;
  }

  private createConstraints(): Constraint[] {
    const constraints: Constraint[] = [
      // Bin capacity constraints
      ...this.config.bins.map(bin => ({
        type: 'capacity',
        description: `Weight capacity constraint for bin ${bin.id}`,
        field: 'bin_weight',
        operator: 'lte' as const,
        value: bin.maxWeight,
        priority: 'must' as const
      })),

      // Dimensional constraints
      ...this.config.bins.map(bin => ({
        type: 'dimension',
        description: `Volume constraint for bin ${bin.id}`,
        field: 'bin_volume',
        operator: 'lte' as const,
        value: bin.width * bin.height * (bin.depth || 1),
        priority: 'must' as const
      }))
    ];

    // Add stacking constraints if 3D
    if (this.config.is3D && this.config.constraints?.stackingRules) {
      this.config.constraints.stackingRules.forEach(rule => {
        constraints.push({
          type: 'stacking',
          description: `Stacking rule for ${rule.topItem} on ${rule.bottomItem}`,
          field: 'stacking_order',
          operator: rule.allowed ? 'follows' as const : 'non_concurrent' as const,
          value: {
            top: rule.topItem,
            bottom: rule.bottomItem
          },
          priority: 'must' as const
        });
      });
    }

    // Add weight distribution constraints
    if (this.config.constraints?.weightDistribution) {
      constraints.push({
        type: 'weight_balance',
        description: 'Weight distribution constraint',
        field: 'weight_imbalance',
        operator: 'lte' as const,
        value: this.config.constraints.weightDistribution.maxImbalance,
        priority: 'should' as const
      });
    }

    return constraints;
  }

  private createObjectives(): Objective[] {
    const objectives: Objective[] = [];
    const {
      minimizeBins = true,
      minimizeCost = false,
      maximizeValue = false,
      balanceWeight = false
    } = this.config.objectives || {};

    if (minimizeBins) {
      objectives.push({
        type: 'minimize',
        field: 'bins_used',
        description: 'Minimize number of bins used',
        weight: 0.4
      });
    }

    if (minimizeCost) {
      objectives.push({
        type: 'minimize',
        field: 'total_cost',
        description: 'Minimize total bin cost',
        weight: 0.3
      });
    }

    if (maximizeValue) {
      objectives.push({
        type: 'maximize',
        field: 'total_value',
        description: 'Maximize total packed value',
        weight: 0.2
      });
    }

    if (balanceWeight) {
      objectives.push({
        type: 'minimize',
        field: 'weight_variance',
        description: 'Minimize weight distribution variance',
        weight: 0.1
      });
    }

    return objectives;
  }

  public createMCP(): MCP {
    return {
      sessionId: `bpp-${Date.now()}`,
      version: '1.0.0',
      status: 'pending',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      model: {
        variables: this.createVariables(),
        constraints: this.createConstraints(),
        objective: this.createObjectives()
      },
      context: {
        environment: {
          region: 'default',
          timezone: 'UTC',
          parameters: {
            solver_config: {
              type: 'or_tools',
              first_solution_strategy: 'BEST_FIT_DECREASING',
              local_search_metaheuristic: 'GUIDED_LOCAL_SEARCH',
              time_limit_ms: 30000,
              solution_limit: 100,
              log_search: true
            },
            is_3d: this.config.is3D,
            items: this.config.items,
            bins: this.config.bins,
            stacking_rules: this.config.constraints?.stackingRules || [],
            weight_distribution: this.config.constraints?.weightDistribution,
            complexity: this.complexity
          }
        },
        dataset: {
          internalSources: ['items', 'bins'],
          dataQuality: 'good',
          requiredFields: [
            'id',
            'width',
            'height',
            'weight',
            'maxWeight'
          ]
        },
        problemType: 'bin_packing',
        industry: 'logistics'
      },
      protocol: {
        steps: [
          {
            action: 'collect_data',
            description: 'Collect item and bin data',
            required: true
          },
          {
            action: 'validate_constraints',
            description: 'Validate packing constraints',
            required: true,
            parameters: {
              check_dimensions: true,
              validate_weight: true
            }
          },
          {
            action: 'build_model',
            description: 'Build bin packing model',
            required: true,
            parameters: {
              solver_type: 'or_tools_cp',
              use_3d: this.config.is3D,
              consider_rotation: true
            }
          },
          {
            action: 'solve_model',
            description: 'Generate optimal packing solution',
            required: true,
            parameters: {
              solver: 'or_tools',
              timeout: 30000,
              solution_limit: 100
            }
          },
          {
            action: 'explain_solution',
            description: 'Generate packing insights',
            required: true,
            parameters: {
              include_metrics: [
                'bins_used',
                'volume_utilization',
                'weight_distribution',
                'packing_efficiency'
              ]
            }
          }
        ],
        allowPartialSolutions: true,
        explainabilityEnabled: true,
        humanInTheLoop: {
          required: false,
          approvalSteps: []
        }
      }
    };
  }
} 