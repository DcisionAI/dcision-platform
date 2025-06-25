# Corrected Optimization Prompt Examples

## **Best Practice Optimization Prompts**

### **1. Crew Assignment with Cost Minimization (Recommended)**
```
"Create an optimization model for crew allocation at a construction site. We need:
- Carpenters: minimum 5 workers at $25/hour
- Electricians: minimum 3 workers at $30/hour  
- Plumbers: minimum 2 workers at $28/hour
- HVAC technicians: minimum 2 workers at $32/hour

Total crew size must be exactly 15 workers. Minimize total labor cost while meeting all minimum requirements."
```

**Expected Solution:**
- Carpenters: 5 (minimum required)
- Electricians: 3 (minimum required)
- Plumbers: 2 (minimum required) 
- HVAC: 5 (remaining to reach 15 total)
- Total Cost: 5×$25 + 3×$30 + 2×$28 + 5×$32 = $125 + $90 + $56 + $160 = $431/hour

### **2. Multi-Phase Project Scheduling**
```
"Create an optimization model for a 4-phase construction project:
- Foundation: 3 weeks, needs 2+ carpenters, $15K/week
- Framing: 4 weeks, needs 3+ carpenters, $20K/week
- Electrical: 2 weeks, needs 2+ electricians, $25K/week  
- Finishing: 3 weeks, needs 2+ carpenters, $18K/week

Available: 5 carpenters ($25/hr), 3 electricians ($30/hr)
Budget: $200K, Timeline: 12 weeks maximum
Precedence: Foundation → Framing → Electrical → Finishing

Minimize total project cost while meeting all constraints."
```

### **3. Resource Allocation Across Projects**
```
"Optimize project selection from 4 potential construction projects:
- Project A: $100K value, needs 5 workers, 2 weeks, $50K cost
- Project B: $150K value, needs 8 workers, 3 weeks, $80K cost
- Project C: $80K value, needs 3 workers, 1 week, $40K cost
- Project D: $120K value, needs 6 workers, 2 weeks, $60K cost

Available: 20 workers, 8 weeks timeline, $200K budget
Which projects should we select to maximize net profit (value - cost)?"
```

### **4. Supply Chain Optimization**
```
"Optimize material procurement for a construction project requiring:
- Concrete: 1000 units needed
- Steel: 500 units needed
- Lumber: 800 units needed

Suppliers available:
- Supplier A: concrete $50/unit, steel $100/unit, lumber $30/unit, 2-day delivery, 95% quality
- Supplier B: concrete $45/unit, steel $110/unit, lumber $35/unit, 1-day delivery, 90% quality
- Supplier C: concrete $55/unit, steel $95/unit, lumber $25/unit, 3-day delivery, 98% quality

Minimize total cost while ensuring average quality ≥ 93% and delivery within 2.5 days."
```

## **Key Principles for Valid Optimization Prompts**

### **1. Clear Variable Definitions**
- Define what each variable represents
- Specify variable types (integer, continuous, binary)
- Set appropriate bounds (lower and upper limits)

### **2. Consistent Constraints**
- Avoid conflicting constraints (e.g., x ≤ 10 AND x ≥ 15)
- Ensure constraints are mathematically feasible
- Use proper constraint types (≤, ≥, =)

### **3. Meaningful Objective Function**
- Use actual cost coefficients, not arbitrary weights
- Ensure objective aligns with business goals
- Avoid unbounded objectives

### **4. Realistic Parameters**
- Use industry-standard rates and requirements
- Ensure problem size is reasonable for solver
- Include all necessary constraints

## **Common Mistakes to Avoid**

### **❌ Incorrect: Conflicting Constraints**
```
"Total crew ≤ 12 AND Total crew = 15"  // Impossible!
```

### **❌ Incorrect: Missing Minimum Requirements**
```
"Need carpenters, electricians, plumbers"  // No minimums specified
```

### **❌ Incorrect: Arbitrary Objective Coefficients**
```
"Minimize: -3×carpenters - 4×electricians"  // What do these coefficients mean?
```

### **✅ Correct: Feasible Problem**
```
"Minimize: 25×carpenters + 30×electricians + 28×plumbers
Subject to: carpenters ≥ 5, electricians ≥ 3, plumbers ≥ 2
           carpenters + electricians + plumbers = 15"
```

## **Testing Your Optimization Model**

Before running complex problems, test with simple cases:

1. **Feasibility Check**: Ensure all constraints can be satisfied simultaneously
2. **Bounds Check**: Verify variable bounds are reasonable
3. **Objective Check**: Confirm objective coefficients represent actual costs/values
4. **Solution Validation**: Verify the solution makes business sense

## **Example Validation**

For the crew assignment problem:
- **Feasibility**: 5+3+2+2 = 12 ≤ 15 ✓
- **Bounds**: All minimums are reasonable ✓  
- **Objective**: Coefficients are actual hourly rates ✓
- **Solution**: Assigns minimum required workers, fills remaining slots with lowest-cost option ✓ 