import Layout from '@/components/Layout';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Employee = {
  id: number;
  name: string;
  skills: string[];
  max_hours: number;
  hourly_rate: number;
  availability: any[];
};

type Shift = {
  id: number;
  name: string;
};

export default function WorkforceScheduling() {
  // Initial sample data
  const initialEmployees: Employee[] = [
    { id: 1, name: 'Alice', skills: ['driver'], max_hours: 40, hourly_rate: 20, availability: [] },
    { id: 2, name: 'Bob', skills: ['loader'], max_hours: 40, hourly_rate: 18, availability: [] }
  ];
  const initialShifts: Shift[] = [
    { id: 1, name: 'Morning' },
    { id: 2, name: 'Evening' }
  ];
  const initialTimeHorizon = 7;
  const initialMinRestHours = 8;
  const initialMaxConsecutiveHours = 8;
  const initialCoverageRequirements: { [key: string]: number } = { '1': 1, '2': 1 };
  const initialSkillRequirements: { [key: string]: string[] } = { '1': ['driver'], '2': ['loader'] };
  const initialObjective = 'minimize_cost';

  // Wizard state
  const [step, setStep] = useState<number>(0);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [timeHorizon, setTimeHorizon] = useState<number>(initialTimeHorizon);
  const [minRestHours, setMinRestHours] = useState<number>(initialMinRestHours);
  const [maxConsecutiveHours, setMaxConsecutiveHours] = useState<number>(initialMaxConsecutiveHours);
  const [coverageRequirements, setCoverageRequirements] = useState<{ [key: string]: number }>(initialCoverageRequirements);
  const [skillRequirements, setSkillRequirements] = useState<{ [key: string]: string[] }>(initialSkillRequirements);
  const [objective, setObjective] = useState<string>(initialObjective);

  // Solve state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [reviewTab, setReviewTab] = useState<'dashboard' | 'tabular' | 'mcp'>('dashboard');

  // Navigation handlers
  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  // Employee handlers
  const addEmployee = () => {
    const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
    setEmployees([...employees, { id: newId, name: '', skills: [], max_hours: 8, hourly_rate: 0, availability: [] }]);
  };
  const removeEmployee = (id: number) => setEmployees(employees.filter(e => e.id !== id));
  const updateEmployee = (id: number, field: keyof Employee, value: any) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Shift handlers
  const addShift = () => {
    const newId = shifts.length > 0 ? Math.max(...shifts.map(s => s.id)) + 1 : 1;
    setShifts([...shifts, { id: newId, name: '' }]);
  };
  const removeShift = (id: number) => {
    setShifts(shifts.filter(s => s.id !== id));
    const key = id.toString();
    const newCov = { ...coverageRequirements }; delete newCov[key];
    setCoverageRequirements(newCov);
    const newReq = { ...skillRequirements }; delete newReq[key];
    setSkillRequirements(newReq);
  };
  const updateShift = (id: number, name: string) =>
    setShifts(shifts.map(s => s.id === id ? { ...s, name } : s));

  // Constraint handlers
  const updateCoverage = (id: number, value: number) =>
    setCoverageRequirements({ ...coverageRequirements, [id]: value });
  const updateSkillReq = (id: number, text: string) => {
    const arr = text.split(',').map(v => v.trim()).filter(v => v);
    setSkillRequirements({ ...skillRequirements, [id]: arr });
  };

  // Solve
  const handleSolve = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const model = {
        employees,
        shifts,
        time_horizon: timeHorizon,
        constraints: {
          min_rest_hours: minRestHours,
          max_consecutive_hours: maxConsecutiveHours,
          coverage_requirements: coverageRequirements,
          skill_requirements: skillRequirements
        },
        objective
      };
      const mcpConfig = {
        sessionId: 'labor-scheduling-session-001',
        protocol: { steps: [{ id: 'solve_step', action: 'solve_model', description: 'Solve workforce schedule', required: true }] },
        context: { problemType: 'labor_scheduling' },
        model: { problemType: 'labor_scheduling', ...model }
      };
      const res = await fetch('https://mcp.dcisionai.com/mcp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcpConfig)
      });
      const data = await res.json();
      setResult(data);
    } catch (err:any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            {employees.map(emp => (
              <div key={emp.id} className="flex space-x-2 items-center">
                <input
                  className="flex-1 bg-gray-900 text-gray-100 border border-gray-700 p-1 rounded placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  type="text" placeholder="Name"
                  value={emp.name}
                  onChange={e => updateEmployee(emp.id, 'name', e.target.value)}
                />
                <input
                  className="flex-1 bg-gray-900 text-gray-100 border border-gray-700 p-1 rounded placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  type="text" placeholder="Skills (comma-separated)"
                  value={emp.skills.join(', ')}
                  onChange={e => updateEmployee(emp.id, 'skills', e.target.value.split(',').map(s => s.trim()))}
                />
                <input
                  className="w-20 bg-gray-900 text-gray-100 border border-gray-700 p-1 rounded placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  type="number" placeholder="Max hrs"
                  value={emp.max_hours}
                  onChange={e => updateEmployee(emp.id, 'max_hours', Number(e.target.value))}
                />
                <input
                  className="w-20 bg-gray-900 text-gray-100 border border-gray-700 p-1 rounded placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  type="number" placeholder="Rate"
                  value={emp.hourly_rate}
                  onChange={e => updateEmployee(emp.id, 'hourly_rate', Number(e.target.value))}
                />
                <button type="button" onClick={() => removeEmployee(emp.id)} className="text-red-500">×</button>
              </div>
            ))}
            <button type="button" onClick={addEmployee} className="text-blue-600">+ Add Employee</button>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Time Horizon (days):</label>
              <input
                className="w-24 bg-gray-900 text-gray-100 border border-gray-700 p-1 rounded placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                type="number" value={timeHorizon} min={1}
                onChange={e => setTimeHorizon(Number(e.target.value))}
              />
            </div>
            {shifts.map(sh => (
              <div key={sh.id} className="flex space-x-2 items-center">
                <input
                  className="flex-1 bg-gray-900 text-gray-100 border border-gray-700 p-1 rounded placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  type="text" placeholder="Shift Name"
                  value={sh.name}
                  onChange={e => updateShift(sh.id, e.target.value)}
                />
                <button type="button" onClick={() => removeShift(sh.id)} className="text-red-500">×</button>
              </div>
            ))}
            <button type="button" onClick={addShift} className="text-blue-600">+ Add Shift</button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div>
                <label className="block mb-1">Min Rest Hours:</label>
                <input
                  className="w-24 bg-gray-900 text-gray-100 border border-gray-700 p-1 rounded placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" type="number"
                  value={minRestHours} onChange={e => setMinRestHours(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block mb-1">Max Consecutive Hours:</label>
                <input
                  className="w-24 bg-gray-900 text-gray-100 border border-gray-700 p-1 rounded placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" type="number"
                  value={maxConsecutiveHours} onChange={e => setMaxConsecutiveHours(Number(e.target.value))}
                />
              </div>
            </div>
            {shifts.map(sh => (
              <div key={sh.id} className="border p-2 rounded">
                <div className="flex items-center mb-1">
                  <strong className="flex-1">{sh.name}</strong>
                </div>
                <div className="flex space-x-4">
                  <div>
                    <label className="block mb-1">Coverage Req:</label>
                    <input
                      className="w-20 bg-gray-900 text-gray-100 border border-gray-700 p-1 rounded placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" type="number"
                      value={coverageRequirements[sh.id]}
                      onChange={e => updateCoverage(sh.id, Number(e.target.value))}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1">Skill Req (csv):</label>
                    <input
                      className="w-full bg-gray-900 text-gray-100 border border-gray-700 p-1 rounded placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" type="text"
                      value={(skillRequirements[sh.id] || []).join(', ')}
                      onChange={e => updateSkillReq(sh.id, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div>
              <label className="block mb-1">Objective:</label>
              <select
                className="bg-gray-900 text-gray-100 border border-gray-700 p-1 rounded placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                value={objective}
                onChange={e => setObjective(e.target.value)}
              >
                <option value="minimize_cost">Minimize Cost</option>
                <option value="maximize_coverage">Maximize Coverage</option>
              </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
           
            {/* Tabs for review */}
            <div className="flex space-x-4 mb-4">
              {['dashboard', 'tabular', 'mcp'].map(tab => {
                const label = tab === 'dashboard' ? 'Dashboard' : tab === 'tabular' ? 'Tabular View' : 'Review MCP';
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setReviewTab(tab as any)}
                    className={`px-3 py-1 rounded ${reviewTab === tab ? 'bg-blue-600 text-white' : 'text-docs-text hover:bg-docs-section-dark'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {/* Tab Panels */}
            {reviewTab === 'dashboard' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                  <strong>Employees:</strong> {employees.length}
                </div>
                <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                  <strong>Shifts:</strong> {shifts.length}
                </div>
                <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                  <strong>Time Horizon:</strong> {timeHorizon} days
                </div>
                <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                  <strong>Min Rest Hours:</strong> {minRestHours}
                </div>
                <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                  <strong>Max Consecutive Hours:</strong> {maxConsecutiveHours}
                </div>
                <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                  <strong>Objective:</strong> {objective}
                </div>
              </div>
            )}
            {reviewTab === 'tabular' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Employees</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-docs-section-border-dark">
                          <th className="p-2 text-left">ID</th>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Skills</th>
                          <th className="p-2 text-left">Max Hours</th>
                          <th className="p-2 text-left">Hourly Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map(emp => (
                          <tr key={emp.id} className="odd:bg-docs-section-dark">
                            <td className="p-2">{emp.id}</td>
                            <td className="p-2">{emp.name}</td>
                            <td className="p-2">{emp.skills.join(', ')}</td>
                            <td className="p-2">{emp.max_hours}</td>
                            <td className="p-2">{emp.hourly_rate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Shifts</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-docs-section-border-dark">
                          <th className="p-2 text-left">ID</th>
                          <th className="p-2 text-left">Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shifts.map(sh => (
                          <tr key={sh.id} className="odd:bg-docs-section-dark">
                            <td className="p-2">{sh.id}</td>
                            <td className="p-2">{sh.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {reviewTab === 'mcp' && (
              <div className="overflow-auto">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto">
                  {JSON.stringify({ employees, shifts, time_horizon: timeHorizon, constraints: { min_rest_hours: minRestHours, max_consecutive_hours: maxConsecutiveHours, coverage_requirements: coverageRequirements, skill_requirements: skillRequirements }, objective }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-docs-body py-8">
        <div className="max-w-8xl mx-auto px-4">
          <div className="bg-docs-section-dark rounded-xl p-8 shadow-lg border border-docs-section-border-dark text-docs-text">
            <h1 className="text-2xl font-bold mb-4">Workforce Scheduling Wizard</h1>
            {/* Use Case Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-docs-section border border-docs-section-border p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">What</h3>
                <p className="text-docs-muted text-sm">Define employees, shifts, and constraints to automatically generate an optimal staff schedule.</p>
              </div>
              <div className="bg-docs-section border border-docs-section-border p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">How</h3>
                <p className="text-docs-muted text-sm">Leverage OR-Tools CP-SAT solver via our MCP service to balance cost, coverage, and rest requirements.</p>
              </div>
              <div className="bg-docs-section border border-docs-section-border p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Why</h3>
                <p className="text-docs-muted text-sm">Ensure fair workload distribution, reduce understaffing, and comply with labor rules.</p>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-sm text-docs-muted">
                {['Employees','Shifts','Constraints','Review'].map((label,i) => (
                  <div key={i} className={`px-2 py-1 rounded ${i===step?'bg-blue-600 text-white':'bg-docs-section-border-dark'}`}>
                    {label}
                  </div>
                ))}
              </div>
            </div>
            {renderStep()}
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={step===0}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
              >
                Back
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSolve}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                >
                  {loading?'Solving...':'Solve'}
                </button>
              )}
            </div>
            {error && <div className="mt-4 text-red-500">Error: {error}</div>}
            {result && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-4">Solution Visualization</h2>
                {(() => {
                  // 1) Check for MCP-style results with 'schedule' array
                  if (Array.isArray(result.results)) {
                    const stepRes = result.results[0]?.result;
                    const schedule = stepRes?.solution?.schedule;
                    if (Array.isArray(schedule)) {
                      // Build data per employee per shift type for a stacked bar chart
                      const shiftIds = Array.from(new Set(schedule.map((e: any) => e.shift_id || e.shiftId))).sort();
                      const chartData = employees.map(emp => {
                        const base: any = { name: emp.name || `#${emp.id}` };
                        shiftIds.forEach((sid) => {
                          const count = schedule.filter((e: any) =>
                            (e.employee_id === emp.id || e.employeeId === emp.id) && (e.shift_id === sid || e.shiftId === sid)
                          ).length;
                          base[`shift_${sid}`] = count;
                        });
                        return base;
                      });
                      // Pastel color palette for modern enterprise feel
                      const colors = ['#AEC6CF', '#77DD77', '#FFB347', '#FF6961', '#CDA4DE', '#FDFD96'];
                      return (
                        <div className="w-full h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                              <Tooltip />
                              {shiftIds.map((sid, idx) => (
                                <Bar
                                  key={sid}
                                  dataKey={`shift_${sid}`}
                                  stackId="a"
                                  name={`Shift ${sid}`}
                                  fill={colors[idx % colors.length]}
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    }
                  }
                  // 2) Legacy 'assignments' array
                  if (result.assignments && Array.isArray(result.assignments)) {
                    const arr = result.assignments;
                    const chartData = employees.map(emp => ({
                      name: emp.name || `#${emp.id}`,
                      shifts: arr.filter((a: any) =>
                        a.employee_id === emp.id || a.employeeId === emp.id
                      ).length,
                    }));
                    return (
                      <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="shifts" fill="#4f46e5" name="Shifts" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  }
                  // 3) CP-SAT variableValues map
                  const sol = (result.solution || result) as any;
                  if (sol.variableValues && typeof sol.variableValues === 'object') {
                    const vars: Record<string, number> = sol.variableValues;
                    const records = Object.entries(vars)
                      .filter(([k, v]) => k.startsWith('nurse_assignments[') && v === 1)
                      .map(([k]) => {
                        const inside = k.slice(k.indexOf('[') + 1, k.indexOf(']'));
                        const parts = inside.split(',').map(s => s.trim());
                        return Number(parts[0]);
                      });
                    const chartData = employees.map(emp => ({
                      name: emp.name || `#${emp.id}`,
                      shifts: records.filter(id => id === emp.id).length,
                    }));
                    return (
                      <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="shifts" fill="#4f46e5" name="Shifts" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  }
                  // Fallback: raw JSON
                  return (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Raw Response</h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}