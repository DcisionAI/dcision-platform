/**
 * Generates a Mermaid diagram string from an MCPConfig object.
 * @param mcpConfig The MCPConfig object from the model builder.
 * @returns A string representing the Mermaid diagram.
 */
export function generateMermaidFromMCP(mcpConfig: any): string {
  if (!mcpConfig) {
    return 'graph TD;\n  subgraph "Error"\n    A["No model configuration provided."]\n  end';
  }

  let mermaidString = 'graph TD;\n';

  // Objective
  const objective = mcpConfig.objective;
  if (objective) {
    mermaidString += `  subgraph "Objective: ${objective.sense || 'N/A'}";\n`;
    mermaidString += `    objective_node["${objective.name || 'Objective'}<br/>${objective.description || ''}"];\n`;
    mermaidString += '  end;\n\n';
  }

  // Variables
  const variables = mcpConfig.variables;
  if (variables && variables.length > 0) {
    mermaidString += '  subgraph "Variables";\n';
    variables.forEach((v: any) => {
      const bounds = `(${v.lower_bound} to ${v.upper_bound})`;
      mermaidString += `    ${v.name}["${v.name} | ${v.type}<br/>${bounds}"];\n`;
    });
    mermaidString += '  end;\n\n';
  }

  // Constraints
  const constraints = mcpConfig.constraints?.dense;
  if (constraints && constraints.length > 0) {
    mermaidString += '  subgraph "Constraints";\n';
    constraints.forEach((c: any, i: number) => {
      const constraintName = c.name || `constraint_${i}`;
      const constraintLabel = `${constraintName}<br/>${c.operator} ${c.rhs}`;
      mermaidString += `    ${constraintName}["${constraintLabel}"];\n`;
    });
    mermaidString += '  end;\n\n';
  }

  // Relationships
  if (variables && constraints) {
    constraints.forEach((c: any, i: number) => {
      const constraintName = c.name || `constraint_${i}`;
      if (c.variables && Array.isArray(c.variables)) {
        c.variables.forEach((varName: string, j: number) => {
          // Check if the coefficient is non-zero to draw a link
          if (c.coefficients && c.coefficients[j] !== 0) {
            const varNode = variables.find((v: any) => v.name === varName);
            if(varNode) {
              mermaidString += `  ${varNode.name} -->|"${c.coefficients[j]}"| ${constraintName};\n`;
            }
          }
        });
      }
    });
  }
  
  if (objective && variables) {
     if (objective.variables && Array.isArray(objective.variables)) {
        objective.variables.forEach((varName: string, j: number) => {
          if (objective.coefficients && objective.coefficients[j] !== 0) {
            const varNode = variables.find((v: any) => v.name === varName);
            if(varNode) {
              mermaidString += `  ${varNode.name} -->|"Objective Coeff: ${objective.coefficients[j]}"| objective_node;\n`;
            }
          }
        });
     }
  }


  return mermaidString;
} 