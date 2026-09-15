import React, { useState } from "react";
import axios from "axios";
import {
  Shield,
  Activity,
  UserCheck,
  AlertTriangle,
  FileSpreadsheet,
  HeartHandshake,
  Moon,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const BACKEND_URL = "https://swasth-bal-back.onrender.com";

export default function App() {
  const [activeTab, setActiveTab] = useState("commander"); // 'commander', 'welfare', 'jawan', 'batch'

  // Jawan Form State
  const [formData, setFormData] = useState({
    personnel_id: "P10001",
    age: 32,
    duty_hours_per_day: 10.5,
    consecutive_duty_days: 22,
    night_shifts_30d: 8,
    deployment_days: 75,
    days_since_last_leave: 80,
    leave_days_90d: 2,
    transfer_count_2y: 2,
    training_hours_30d: 15,
    workload_score: 82.0,
    sleep_hours: 5.2,
    fatigue_score: 55.0,
    self_reported_stress: 65.0,
    wellness_score: 42.0,
  });

  const [individualResult, setIndividualResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  // Handle Form Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        isNaN(value) || name === "personnel_id" ? value : parseFloat(value),
    }));
  };

  // Submit Individual Prediction (Sanitized Payload)
  const handleIndividualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Empty string ya NaN ko safe numbers me convert karna
    const duty = Number(formData.duty_hours_per_day) || 8.0;
    const consec = Number(formData.consecutive_duty_days) || 10;
    const nights = Number(formData.night_shifts_30d) || 0;
    const autoWorkload = Math.min(100, Math.max(10, (duty * 4.5) + consec + (nights * 2.0)));

    const sanitizedData = {
      personnel_id: String(formData.personnel_id || "P10001"),
      age: Number(formData.age) || 30,
      duty_hours_per_day: duty,
      consecutive_duty_days: consec,
      night_shifts_30d: nights,
      deployment_days: Number(formData.days_since_last_leave) > 60 ? 85 : 30,
      days_since_last_leave: Number(formData.days_since_last_leave) || 30,
      leave_days_90d: Number(formData.days_since_last_leave) > 60 ? 1 : 10,
      transfer_count_2y: 2,
      training_hours_30d: 15,
      workload_score: autoWorkload,
      sleep_hours: Number(formData.sleep_hours) || 7.0,
      fatigue_score: Number(formData.fatigue_score) || 20.0,
      self_reported_stress: Number(formData.self_reported_stress) || 30.0,
      wellness_score: Number(formData.wellness_score) || 70.0,
    };

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/v1/predict/individual`,
        sanitizedData,
      );
      setIndividualResult(res.data);
    } catch (err) {
      console.error(err);
      alert(
        "Error: " +
          (err.response?.data?.detail ||
            "Could not connect to backend server."),
      );
    }
    setLoading(false);
  };

  // Submit Batch CSV
  const handleBatchUpload = async () => {
    if (!uploadFile) return alert("Please select a CSV file first!");
    setLoading(true);
    const data = new FormData();
    data.append("file", uploadFile);

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/v1/predict/batch`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setBatchResult(res.data);
    } catch (err) {
      alert(
        "Error analyzing batch CSV: " +
          (err.response?.data?.detail || err.message),
      );
    }
    setLoading(false);
  };

  // Sample aggregate data for commander view
  const riskDistribution = [
    { name: "Low Risk (Fit)", value: 52, color: "#10B981" },
    { name: "Moderate Stress", value: 43, color: "#F59E0B" },
    { name: "High Burnout Risk", value: 5, color: "#EF4444" },
  ];

  const dutyStressData = [
    { range: "1-7 Days", avgStress: 22 },
    { range: "8-14 Days", avgStress: 36 },
    { range: "15-21 Days", avgStress: 51 },
    { range: "22-28 Days", avgStress: 68 },
    { range: "28+ Days", avgStress: 84 },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 px-6 py-3 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">
              SWASTH-BAL
            </h1>
            <p className="text-xs text-slate-400">
              AI Predictive Personnel Welfare & Stress Monitoring (CAPFs & Armed
              Forces)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> DPDP Act 2023 Compliant
          </span>
          <span className="px-3 py-1 text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800 rounded-full">
            Unit: 14-Rashtriya Rifles
          </span>
        </div>
      </header>

      {/* Portal Tabs Navigation */}
      <div className="bg-slate-800/60 border-b border-slate-700 px-6 flex space-x-1 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("commander")}
          className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === "commander"
              ? "border-indigo-500 text-indigo-400 bg-slate-800"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="w-4 h-4" /> Commander Dashboard
        </button>
        <button
          onClick={() => setActiveTab("welfare")}
          className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === "welfare"
              ? "border-indigo-500 text-indigo-400 bg-slate-800"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <HeartHandshake className="w-4 h-4" /> Welfare Officer Portal
        </button>
        <button
          onClick={() => setActiveTab("jawan")}
          className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === "jawan"
              ? "border-indigo-500 text-indigo-400 bg-slate-800"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <UserCheck className="w-4 h-4" /> Jawan Self-Assessment
        </button>
        <button
          onClick={() => setActiveTab("batch")}
          className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === "batch"
              ? "border-indigo-500 text-indigo-400 bg-slate-800"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Battalion CSV Simulator
        </button>
      </div>

      {/* Main Content Area */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* ==================================================== */}
        {/* TAB 1: COMMANDER DASHBOARD                          */}
        {/* ==================================================== */}
        {activeTab === "commander" && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-semibold">
                  Total Personnel Monitored
                </p>
                <h3 className="text-3xl font-bold text-white mt-1">10,000</h3>
                <p className="text-xs text-emerald-400 mt-2">
                  ● 100% Active Duty Roster Synced
                </p>
              </div>
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-semibold">
                  Force Operational Readiness
                </p>
                <h3 className="text-3xl font-bold text-emerald-400 mt-1">
                  87.4%
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  Optimal deployment capability
                </p>
              </div>
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-semibold">
                  Moderate Operational Fatigue
                </p>
                <h3 className="text-3xl font-bold text-amber-400 mt-1">871</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Under continuous shift monitoring
                </p>
              </div>
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-semibold">
                  High Burnout Alerts
                </p>
                <h3 className="text-3xl font-bold text-rose-400 mt-1">77</h3>
                <p className="text-xs text-rose-300 mt-2">
                  Recommended for immediate rest
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h4 className="text-sm font-semibold text-slate-200 mb-4">
                  Unit Fatigue by Consecutive Duty Days
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dutyStressData}>
                      <XAxis dataKey="range" stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1E293B",
                          borderColor: "#334155",
                        }}
                      />
                      <Bar
                        dataKey="avgStress"
                        fill="#6366F1"
                        radius={[4, 4, 0, 0]}
                        name="Fatigue Risk Score"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h4 className="text-sm font-semibold text-slate-200 mb-4">
                  Battalion Stress Risk Breakdown
                </h4>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1E293B",
                          borderColor: "#334155",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Commander Directive Recommendations */}
            <div className="bg-indigo-950/40 border border-indigo-800/80 rounded-xl p-5">
              <h4 className="text-md font-bold text-indigo-300 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" /> AI Automated
                Roster & Workload Balancing Directives
              </h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>
                  • <b>Alpha Company (77 Jawans):</b> 24+ continuous deployment
                  days detected. Rotate out of forward post by Tuesday.
                </li>
                <li>
                  • <b>Night Patrol Redistribution:</b> 12 jawans have &gt;11
                  night shifts in 30 days. Transfer to day perimeter monitoring.
                </li>
                <li>
                  • <b>Leave Sanction Queue:</b> 48 jawans exceed 90 days
                  without casual leave. Approve backlog to prevent burnout
                  spike.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: WELFARE & MEDICAL OFFICER PORTAL              */}
        {/* ==================================================== */}
        {activeTab === "welfare" && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Critical Welfare Action Roster
                  </h3>
                  <p className="text-xs text-slate-400">
                    Showing personnel identified by AI engine for proactive
                    medical & welfare intervention.
                  </p>
                </div>
                <span className="text-xs bg-rose-950 text-rose-400 border border-rose-800 px-3 py-1 rounded-full font-medium">
                  77 Cases Pending Review
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-700/50 text-slate-400 text-xs uppercase">
                    <tr>
                      <th className="p-3">Personnel ID</th>
                      <th className="p-3">Consecutive Duty</th>
                      <th className="p-3">Sleep Avg</th>
                      <th className="p-3">Fatigue Score</th>
                      <th className="p-3">AI Prediction</th>
                      <th className="p-3">Recommended Action</th>
                      <th className="p-3">Intervention Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr className="hover:bg-slate-750">
                      <td className="p-3 font-semibold text-white">P00041</td>
                      <td className="p-3">28 Days</td>
                      <td className="p-3 text-rose-400">4.5 Hrs</td>
                      <td className="p-3">72.9 / 100</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-xs bg-rose-950 text-rose-300 rounded border border-rose-800">
                          High Burnout
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        Mandatory 5-Day Stand-down
                      </td>
                      <td className="p-3">
                        <button className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded">
                          Sanction Leave
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-750">
                      <td className="p-3 font-semibold text-white">P00068</td>
                      <td className="p-3">27 Days</td>
                      <td className="p-3 text-rose-400">4.7 Hrs</td>
                      <td className="p-3">69.5 / 100</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-xs bg-rose-950 text-rose-300 rounded border border-rose-800">
                          High Burnout
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        Relief from Night Patrolling
                      </td>
                      <td className="p-3">
                        <button className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded">
                          Reassign Shift
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-750">
                      <td className="p-3 font-semibold text-white">P00139</td>
                      <td className="p-3">30 Days</td>
                      <td className="p-3 text-amber-400">5.2 Hrs</td>
                      <td className="p-3">69.7 / 100</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-xs bg-amber-950 text-amber-300 rounded border border-amber-800">
                          Moderate Stress
                        </span>
                      </td>
                      <td className="p-3 text-xs">1-on-1 Counseling Session</td>
                      <td className="p-3">
                        <button className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded">
                          Schedule Meet
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: JAWAN CONFIDENTIAL SELF-ASSESSMENT           */}
        {/* ==================================================== */}
        {activeTab === "jawan" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-1">
                Confidential Personnel Check-in
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Your responses are securely processed by the AI engine strictly
                for welfare management.
              </p>

              <form onSubmit={handleIndividualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Personnel ID
                    </label>
                    <input
                      type="text"
                      name="personnel_id"
                      value={formData.personnel_id}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Daily Duty Hours (Avg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="duty_hours_per_day"
                      value={formData.duty_hours_per_day}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Consecutive Duty Days
                    </label>
                    <input
                      type="number"
                      name="consecutive_duty_days"
                      value={formData.consecutive_duty_days}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Night Shifts (Last 30 Days)
                    </label>
                    <input
                      type="number"
                      name="night_shifts_30d"
                      value={formData.night_shifts_30d}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sleep Hours (Last 24h)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="sleep_hours"
                      value={formData.sleep_hours}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Days Since Last Leave
                    </label>
                    <input
                      type="number"
                      name="days_since_last_leave"
                      value={formData.days_since_last_leave}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Subjective Fatigue Score (0-100)
                    </label>
                    <input
                      type="number"
                      name="fatigue_score"
                      value={formData.fatigue_score}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Self-Reported Stress: {formData.self_reported_stress} /
                      100
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      name="self_reported_stress"
                      value={formData.self_reported_stress}
                      onChange={handleInputChange}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Overall Wellness Feel: {formData.wellness_score} / 100
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      name="wellness_score"
                      value={formData.wellness_score}
                      onChange={handleInputChange}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg text-white transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    "Run AI Wellness & Risk Analysis"
                  )}
                </button>
              </form>
            </div>

           {/* Live Result Display with XAI */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-white mb-4">Assessment Evaluation</h3>
                {individualResult ? (
                  <div className="space-y-4">
                    {/* Risk Level Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-3 rounded-lg border ${
                        individualResult.assessment.stress_risk_level === 'High' ? 'bg-rose-950/70 border-rose-800' :
                        individualResult.assessment.stress_risk_level === 'Moderate' ? 'bg-amber-950/70 border-amber-800' : 'bg-emerald-950/70 border-emerald-800'
                      }`}>
                        <p className="text-xs text-slate-300">Stress Risk</p>
                        <h4 className="text-xl font-bold text-white">{individualResult.assessment.stress_risk_level}</h4>
                        <p className="text-xs text-slate-400 mt-1">{individualResult.assessment.stress_confidence}</p>
                      </div>

                      <div className={`p-3 rounded-lg border ${
                        individualResult.assessment.burnout_risk_level === 'High' ? 'bg-rose-950/70 border-rose-800' :
                        individualResult.assessment.burnout_risk_level === 'Moderate' ? 'bg-amber-950/70 border-amber-800' : 'bg-emerald-950/70 border-emerald-800'
                      }`}>
                        <p className="text-xs text-slate-300">Burnout Risk</p>
                        <h4 className="text-xl font-bold text-white">{individualResult.assessment.burnout_risk_level}</h4>
                        <p className="text-xs text-slate-400 mt-1">{individualResult.assessment.burnout_confidence}</p>
                      </div>
                    </div>

                    {/* Explainable AI (Top 3 Risk Factors) */}
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-700">
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Key Diagnostic Factors (Explainable AI):
                      </p>
                      <div className="space-y-2">
                        {individualResult.top_risk_drivers?.map((driver, idx) => (
                          <div key={idx} className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-slate-200">{driver.factor}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                driver.severity === 'CRITICAL' ? 'bg-rose-900 text-rose-200' :
                                driver.severity === 'HIGH' ? 'bg-amber-900 text-amber-200' : 'bg-emerald-900 text-emerald-200'
                              }`}>{driver.severity}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">{driver.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="p-4 rounded-lg bg-indigo-950/60 border border-indigo-800">
                      <p className="text-xs font-semibold text-indigo-300 mb-2">Automated Welfare Directives:</p>
                      <ul className="text-xs space-y-1 text-slate-300">
                        {individualResult.welfare_recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Enter jawan operational metrics and click "Run AI Analysis"
                    to see live results.
                  </div>
                )}
              </div>

              {/* SOS Helpline Banner */}
              <div className="mt-6 pt-4 border-t border-slate-700 text-xs text-slate-400">
                <p className="font-semibold text-slate-300">
                  Military Psychological Support Line:
                </p>
                <p className="mt-1 text-emerald-400 font-mono">
                  Toll Free: 1800-11-2522 (Confidential 24/7)
                </p>
              </div>
            </div>
          </div>
        )}

       {/* TAB 4: BATTALION CSV SIMULATOR */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-1">Battalion Roster CSV Analysis</h3>
              <p className="text-xs text-slate-400 mb-6">Select your <code>personnel_wellness_dataset.csv</code> file to generate whole-unit stress heatmaps and prioritize interventions.</p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
                <button 
                  onClick={handleBatchUpload}
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-md text-white whitespace-nowrap transition flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Process 10,000 Records"}
                </button>
              </div>
            </div>

            {batchResult && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400">Total Monitored</p>
                    <h5 className="text-2xl font-bold text-white mt-1">{batchResult.total_evaluated}</h5>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400">Force Readiness (Fit)</p>
                    <h5 className="text-2xl font-bold text-emerald-400 mt-1">{batchResult.percentages.fit_readiness}</h5>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400">Moderate Watchlist</p>
                    <h5 className="text-2xl font-bold text-amber-400 mt-1">{batchResult.percentages.moderate_stress}</h5>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400">Critical High Risk</p>
                    <h5 className="text-2xl font-bold text-rose-400 mt-1">{batchResult.percentages.high_stress}</h5>
                  </div>
                </div>

                {/* Table of Top High Risk Cases */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                  <h5 className="text-md font-bold text-white mb-3">Critical Personnel Requiring Medical Interventions (Top Cases)</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 uppercase">
                        <tr>
                          <th className="p-2.5">Personnel ID</th>
                          <th className="p-2.5">Continuous Duty</th>
                          <th className="p-2.5">Sleep (Avg)</th>
                          <th className="p-2.5">Leave Gap</th>
                          <th className="p-2.5">Stress Level</th>
                          <th className="p-2.5">Burnout Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {batchResult.flagged_personnel.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-750">
                            <td className="p-2.5 font-mono text-white font-bold">{p.personnel_id}</td>
                            <td className="p-2.5">{p.consecutive_duty} days</td>
                            <td className="p-2.5 text-rose-400">{p.sleep} hrs</td>
                            <td className="p-2.5">{p.leave_gap} days</td>
                            <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">{p.stress}</span></td>
                            <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">{p.burnout}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
