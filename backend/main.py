from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict
import pandas as pd
import numpy as np
import joblib
import io

app = FastAPI(
    title="AI-Based Personnel Stress & Welfare Monitoring System",
    description="CAPFs & Armed Forces early stress detection and Explainable AI welfare engine.",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Models Load Karna
try:
    stress_model = joblib.load("stress_model.pkl")
    burnout_model = joblib.load("burnout_model.pkl")
    model_features = joblib.load("model_features.pkl")
    print("✅ ML Models loaded successfully!")
except Exception as e:
    print(f"⚠️ Warning: Model loading failed: {e}")

LABEL_MAP = {0: "Low", 1: "Moderate", 2: "High"}

def to_safe_label(val):
    if str(val) in ["Low", "Moderate", "High"]:
        return str(val)
    try:
        return LABEL_MAP.get(int(val), str(val))
    except Exception:
        return str(val)

# 2. Pydantic Input Schema
class PersonnelData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    personnel_id: Optional[str] = "P10001"
    age: Optional[float] = 32.0
    duty_hours_per_day: Optional[float] = 8.0
    consecutive_duty_days: Optional[float] = 15.0
    night_shifts_30d: Optional[float] = 5.0
    deployment_days: Optional[float] = 45.0
    days_since_last_leave: Optional[float] = 30.0
    leave_days_90d: Optional[float] = 10.0
    transfer_count_2y: Optional[float] = 1.0
    training_hours_30d: Optional[float] = 10.0
    workload_score: Optional[float] = 60.0
    sleep_hours: Optional[float] = 7.0
    fatigue_score: Optional[float] = 25.0
    self_reported_stress: Optional[float] = 35.0
    wellness_score: Optional[float] = 65.0

# 3. EXPLAINABLE AI (XAI) ENGINE: Top 3 Contributing Risk Drivers
def explain_risk_factors(data: dict, stress_level: str) -> List[Dict]:
    drivers = []
    
    consec = float(data.get("consecutive_duty_days") or 0)
    sleep = float(data.get("sleep_hours") or 7.0)
    days_leave = float(data.get("days_since_last_leave") or 0)
    nights = float(data.get("night_shifts_30d") or 0)
    duty_hrs = float(data.get("duty_hours_per_day") or 8.0)
    stress_val = float(data.get("self_reported_stress") or 30.0)
    fatigue_val = float(data.get("fatigue_score") or 20.0)
    wellness_val = float(data.get("wellness_score") or 70.0)

    if stress_level in ["High", "Moderate"]:
        if consec >= 18:
            drivers.append({
                "factor": "Consecutive Duty Days",
                "detail": f"{int(consec)} continuous days on duty (Threshold: >21 days is severe)",
                "severity": "CRITICAL" if consec >= 24 else "HIGH",
                "impact_score": round((consec / 30.0) * 35, 1)
            })
        if sleep <= 5.5:
            drivers.append({
                "factor": "Sleep Deficit / Deprivation",
                "detail": f"Only {sleep:.1f} hrs/day (Critical circadian threshold is <5 hrs)",
                "severity": "CRITICAL" if sleep < 4.8 else "HIGH",
                "impact_score": round(((8.0 - sleep) / 4.0) * 30, 1)
            })
        if days_leave >= 60:
            drivers.append({
                "factor": "Prolonged Leave Deprivation",
                "detail": f"{int(days_leave)} days without home visit (Isolation threshold: >90 days)",
                "severity": "CRITICAL" if days_leave >= 90 else "HIGH",
                "impact_score": round((days_leave / 120.0) * 20, 1)
            })
        if nights >= 8:
            drivers.append({
                "factor": "Night Patrolling Overload",
                "detail": f"{int(nights)} night rosters in last 30 days",
                "severity": "HIGH" if nights >= 10 else "MODERATE",
                "impact_score": round((nights / 12.0) * 15, 1)
            })
        if stress_val >= 60 or fatigue_val >= 60:
            drivers.append({
                "factor": "Elevated Subjective Distress",
                "detail": f"Fatigue Index: {fatigue_val:.0f}/100, Self-Reported Stress: {stress_val:.0f}/100",
                "severity": "HIGH",
                "impact_score": round((fatigue_val / 100.0) * 20, 1)
            })
    else:
        # For Low Risk: Show Positive Protective Factors
        drivers.append({
            "factor": "Optimal Sleep Hygiene",
            "detail": f"{sleep:.1f} hours healthy rest restored circadian baseline",
            "severity": "HEALTHY",
            "impact_score": 0.0
        })
        drivers.append({
            "factor": "Balanced Duty Cycle",
            "detail": f"Only {int(consec)} consecutive days on duty with manageable roster",
            "severity": "HEALTHY",
            "impact_score": 0.0
        })
        drivers.append({
            "factor": "High Wellness Mindset",
            "detail": f"Positive wellness self-rating of {wellness_val:.0f}/100",
            "severity": "HEALTHY",
            "impact_score": 0.0
        })

    # Sort descending by impact score and take Top 3
    drivers.sort(key=lambda x: x["impact_score"], reverse=True)
    return drivers[:3]

# 4. Clinical Recommendations Engine
def generate_recommendations(data: dict, stress_level: str, burnout_level: str):
    recommendations = []
    consec = float(data.get("consecutive_duty_days") or 0)
    nights = float(data.get("night_shifts_30d") or 0)
    sleep = float(data.get("sleep_hours") or 7.0)
    days_leave = float(data.get("days_since_last_leave") or 0)

    if consec >= 21:
        recommendations.append("Immediate 3-5 days mandatory operational stand-down / rest cycle.")
    if nights >= 10:
        recommendations.append("Temporary relief from night patrolling roster for the next 14 days.")
    if sleep < 5.5:
        recommendations.append("Fatigue protocol: Enforce non-disturbed 8-hour sleep schedule.")
    if days_leave > 60:
        recommendations.append("Prioritize casual/annual leave approval on urgent welfare grounds.")
    if stress_level == "High" or burnout_level == "High":
        recommendations.append("URGENT: Schedule confidential 1-on-1 session with Unit Medical Officer.")
    elif stress_level == "Moderate" or burnout_level == "Moderate":
        recommendations.append("Encourage peer-support buddy check-in and app-guided mindfulness.")
        
    if not recommendations:
        recommendations.append("All indicators within normal operational parameters. Regular duty approved.")
        
    return recommendations

# 5. API Endpoints
@app.post("/api/v1/predict/individual")
def predict_individual(data: PersonnelData):
    try:
        input_dict = data.model_dump()
        
        # Auto-calculate Workload Score realistically
        duty = float(input_dict.get("duty_hours_per_day") or 8.0)
        consec = float(input_dict.get("consecutive_duty_days") or 10.0)
        nights = float(input_dict.get("night_shifts_30d") or 2.0)
        input_dict["workload_score"] = min(100.0, max(10.0, (duty * 4.5) + consec + (nights * 2.0)))
        
        if float(input_dict.get("days_since_last_leave") or 0) > 60:
            input_dict["deployment_days"] = 80.0
            input_dict["leave_days_90d"] = 1.0

        df_input = pd.DataFrame([input_dict])[model_features]
        
        # Predictions
        stress_pred_label = to_safe_label(stress_model.predict(df_input)[0])
        stress_probs = {to_safe_label(c): round(float(p), 3) for c, p in zip(stress_model.classes_, stress_model.predict_proba(df_input)[0])}
        stress_conf = float(stress_probs.get(stress_pred_label, 0.0))
        
        burnout_pred_label = to_safe_label(burnout_model.predict(df_input)[0])
        burnout_probs = {to_safe_label(c): round(float(p), 3) for c, p in zip(burnout_model.classes_, burnout_model.predict_proba(df_input)[0])}
        burnout_conf = float(burnout_probs.get(burnout_pred_label, 0.0))
        
        # Explainable AI & Recommendations
        risk_drivers = explain_risk_factors(input_dict, stress_pred_label)
        recs = generate_recommendations(input_dict, stress_pred_label, burnout_pred_label)
        
        return {
            "personnel_id": str(data.personnel_id),
            "assessment": {
                "stress_risk_level": str(stress_pred_label),
                "stress_confidence": f"{stress_conf * 100:.1f}%",
                "burnout_risk_level": str(burnout_pred_label),
                "burnout_confidence": f"{burnout_conf * 100:.1f}%",
            },
            "top_risk_drivers": risk_drivers,
            "welfare_recommendations": recs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        
        for col in model_features:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Missing column: {col}")
                
        X_batch = df[model_features]
        df["predicted_stress"] = [to_safe_label(x) for x in stress_model.predict(X_batch)]
        df["predicted_burnout"] = [to_safe_label(x) for x in burnout_model.predict(X_batch)]
        
        total = int(len(df))
        low_count = int((df["predicted_stress"] == "Low").sum())
        mod_count = int((df["predicted_stress"] == "Moderate").sum())
        high_count = int((df["predicted_stress"] == "High").sum())
        burnout_high_count = int((df["predicted_burnout"] == "High").sum())
        
        flagged_df = df[(df["predicted_stress"] == "High") | (df["predicted_burnout"] == "High")][
            ["personnel_id", "consecutive_duty_days", "sleep_hours", "days_since_last_leave", "predicted_stress", "predicted_burnout"]
        ].head(20)
        
        flagged_list = [
            {
                "personnel_id": str(r["personnel_id"]),
                "consecutive_duty": int(r["consecutive_duty_days"]),
                "sleep": float(r["sleep_hours"]),
                "leave_gap": int(r["days_since_last_leave"]),
                "stress": str(r["predicted_stress"]),
                "burnout": str(r["predicted_burnout"])
            }
            for _, r in flagged_df.iterrows()
        ]
        
        return {
            "total_evaluated": total,
            "counts": {
                "low": low_count,
                "moderate": mod_count,
                "high": high_count,
                "high_burnout": burnout_high_count
            },
            "percentages": {
                "fit_readiness": f"{(low_count / total) * 100:.1f}%",
                "moderate_stress": f"{(mod_count / total) * 100:.1f}%",
                "high_stress": f"{(high_count / total) * 100:.1f}%",
                "high_burnout": f"{(burnout_high_count / total) * 100:.1f}%"
            },
            "flagged_personnel": flagged_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))