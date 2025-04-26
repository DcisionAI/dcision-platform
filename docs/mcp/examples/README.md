# MCP Usage Examples

## Overview

This section provides practical examples of how to define and submit optimization problems using the Model Context Protocol (MCP) on the DcisionAI platform.

---

## Example 1: Vehicle Routing Problem (VRP)

### Problem Statement
Assign a fleet of vehicles to deliver goods to customers while minimizing total distance.

### MCP Model
```json
{
  "variables": [
    {
      "name": "route_assignment",
      "type": "binary",
      "dimensions": ["vehicle", "customer"]
    }
  ],
  "constraints": [
    {
      "type": "mathematical",
      "expression": "sum(route_assignment[v,c] for v in vehicles) == 1",
      "operator": "eq",
      "rhs": 1
    }
  ],
  "objectives": [
    {
      "type": "minimize",
      "expression": "total_distance"
    }
  ],
  "metadata": {
    "problemType": "vehicle_routing",
    "complexity": "intermediate",
    "version": "1.0.0"
  }
}
```

---

## Example 2: Nurse Scheduling

### Problem Statement
Schedule nurses to shifts ensuring coverage and rest requirements.

### MCP Model
```json
{
  "variables": [
    {
      "name": "nurse_shift_assignment",
      "type": "binary",
      "dimensions": ["nurse", "shift"]
    }
  ],
  "constraints": [
    {
      "type": "mathematical",
      "expression": "sum(nurse_shift_assignment[n,s] for s in shifts) <= max_shifts_per_nurse",
      "operator": "lte",
      "rhs": 5
    }
  ],
  "objectives": [
    {
      "type": "maximize",
      "expression": "total_coverage"
    }
  ],
  "metadata": {
    "problemType": "nurse_scheduling",
    "complexity": "intermediate",
    "version": "1.0.0"
  }
}
```

---

## Example 3: Bin Packing

### Problem Statement
Pack items into bins minimizing the number of bins used.

### MCP Model
```json
{
  "variables": [
    {
      "name": "item_bin_assignment",
      "type": "binary",
      "dimensions": ["item", "bin"]
    }
  ],
  "constraints": [
    {
      "type": "mathematical",
      "expression": "sum(item_bin_assignment[i,b] * item_size[i] for i in items) <= bin_capacity",
      "operator": "lte",
      "rhs": 100
    }
  ],
  "objectives": [
    {
      "type": "minimize",
      "expression": "number_of_bins_used"
    }
  ],
  "metadata": {
    "problemType": "bin_packing",
    "complexity": "basic",
    "version": "1.0.0"
  }
}
```

---

## More Examples
- Job Shop Scheduling
- Project Scheduling
- Resource Allocation

For more advanced examples, see the [API Reference](../api/README.md) and [Interface Definitions](../interfaces.md). 