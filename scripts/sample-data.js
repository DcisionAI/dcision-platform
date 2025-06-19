// scripts/generate-demo-xlsx.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const data = {
  projects_tristate: [
    ["project_id", "name", "location", "start_date", "end_date", "status", "budget", "client", "manager"],
    ["P001", "Midtown Tower", "NYC, NY", "2024-01-10", "2025-06-30", "Active", 12000000, "Acme Holdings", "Jane Smith"],
    ["P002", "Riverside Mall", "Jersey City, NJ", "2024-03-01", "2025-12-15", "Planning", 8500000, "Urban Retail", "John Doe"],
    ["P003", "Greenfield Hospital", "Stamford, CT", "2023-09-15", "2025-03-20", "Active", 22000000, "HealthFirst", "Priya Patel"],
    ["P004", "Eastside School", "Newark, NJ", "2024-05-01", "2025-08-30", "Bidding", 6000000, "City Schools", "Mike Johnson"],
    ["P005", "Harbor Bridge", "Brooklyn, NY", "2023-11-01", "2026-04-15", "Active", 35000000, "State DOT", "Maria Garcia"],
    ["P006", "Tech Park Campus", "White Plains, NY", "2024-02-20", "2025-10-10", "Planning", 18000000, "Innovatech", "Alex Lee"],
    ["P007", "Westside Apartments", "Hoboken, NJ", "2023-12-01", "2025-09-01", "Delayed", 15000000, "Sun Properties", "Sarah Kim"],
    ["P008", "Central Library", "New Haven, CT", "2024-04-10", "2025-11-30", "Active", 9000000, "City of New Haven", "David Brown"],
    ["P009", "North Plant Upgrade", "Yonkers, NY", "2023-10-15", "2024-12-20", "Complete", 7000000, "MotorWorks", "Emily Clark"],
    ["P010", "Riverfront Offices", "Stamford, CT", "2024-06-01", "2025-12-01", "Planning", 10500000, "Gateway Partners", "Robert Wilson"]
  ],
  tasks_tristate: [
    ["task_id", "project_id", "name", "description", "start_date", "end_date", "duration", "dependencies", "assigned_crew", "status", "cost_code"],
    ["T001", "P001", "Foundation", "Excavate & pour", "2024-01-15", "2024-02-28", 45, "", "C001", "Complete", 1001],
    ["T002", "P001", "Framing", "Steel structure", "2024-03-01", "2024-04-15", 45, "T001", "C002", "Active", 1002],
    ["T003", "P002", "Site Survey", "Initial site survey", "2024-03-05", "2024-03-10", 5, "", "C003", "Planned", 2001],
    ["T004", "P003", "Excavation", "Site clearing", "2023-09-20", "2023-10-10", 20, "", "C001", "Complete", 3001],
    ["T005", "P003", "Concrete Pour", "Pour main slab", "2023-10-15", "2023-11-10", 26, "T004", "C001", "Active", 3002],
    ["T006", "P005", "Piling", "Bridge piling", "2023-11-10", "2024-01-20", 70, "", "C004", "Active", 5001],
    ["T007", "P005", "Deck Assembly", "Assemble bridge deck", "2024-01-25", "2024-04-15", 80, "T006", "C002", "Planned", 5002],
    ["T008", "P007", "Demolition", "Remove old structure", "2023-12-05", "2024-01-10", 36, "", "C005", "Complete", 7001],
    ["T009", "P008", "Framing", "Library framing", "2024-04-15", "2024-05-30", 45, "", "C002", "Planned", 8001],
    ["T010", "P010", "Site Prep", "Clear and prep site", "2024-06-05", "2024-06-20", 15, "", "C003", "Planned", 10001]
  ],
  crews_tristate: [
    ["crew_id", "name", "skills", "members", "availability"],
    ["C001", "Concrete", "Concrete, Excavation", 8, "2024-01-10:2024-03-01"],
    ["C002", "Steelwork", "Steel, Welding", 6, "2024-02-15:2024-05-01"],
    ["C003", "Surveyors", "Surveying", 3, "2024-03-01:2024-03-15"],
    ["C004", "Piling", "Piling, Drilling", 5, "2023-11-01:2024-02-01"],
    ["C005", "Demolition", "Demolition", 4, "2023-12-01:2024-01-15"]
  ],
  equipment_tristate: [
    ["equipment_id", "type", "capacity", "availability", "assigned_tasks"],
    ["E001", "Crane", "20T", "2024-02-01:2024-04-01", "T002, T007"],
    ["E002", "Excavator", "2m3", "2024-01-10:2024-02-15", "T001, T004"],
    ["E003", "Pile Driver", "10T", "2023-11-10:2024-01-20", "T006"],
    ["E004", "Dump Truck", "10m3", "2023-12-05:2024-01-10", "T008, T010"]
  ],
  materials_tristate: [
    ["material_id", "name", "quantity", "supplier", "delivery_date", "assigned_tasks"],
    ["M001", "Concrete", 500, "BuildSupply", "2024-01-20", "T001, T005"],
    ["M002", "Steel Beams", 100, "SteelWorks", "2024-03-01", "T002, T009"],
    ["M003", "Piles", 50, "PilePro", "2023-11-15", "T006"],
    ["M004", "Bricks", 20000, "BrickCo", "2024-04-20", "T009, T010"]
  ],
  kpis_tristate: [
    ["project_id", "earned_value", "percent_complete", "budget_variance", "safety_incidents", "last_update"],
    ["P001", 2000000, 18, -50000, 0, "2024-03-01"],
    ["P002", 0, 0, 0, 0, "2024-03-01"],
    ["P003", 4500000, 22, 100000, 1, "2024-03-01"],
    ["P005", 7000000, 15, -200000, 2, "2024-03-01"],
    ["P007", 1200000, 10, -80000, 0, "2024-03-01"],
    ["P008", 500000, 5, 0, 0, "2024-03-01"],
    ["P009", 7000000, 100, 0, 0, "2024-03-01"]
  ]
};

for (const [name, rows] of Object.entries(data)) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name.replace('_tristate', ''));
  const outPath = path.join(__dirname, `${name}.xlsx`);
  XLSX.writeFile(wb, outPath);
  console.log(`Wrote ${outPath}`);
}