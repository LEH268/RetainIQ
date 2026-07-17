import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

app = FastAPI(title="RetainIQ AI Engine")

# Allow your React frontend to communicate with this backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure your Gemini API Key
# Replace "YOUR_FREE_GEMINI_API_KEY" with your actual key from Google AI Studio
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "YOUR_FREE_GEMINI_API_KEY"))

# Mock database of raw customer metrics 
MOCK_DATABASE = {
    "CUS-1042": {
        "id": "CUS-1042",
        "name": "Sarah Lim",
        "company": "Lim & Co",
        "plan": "Pro",
        "status": "Active",
        "login_frequency": "Low",
        "feature_usage": "35%",
        "payment_history": "On Time",
        "support_tickets": "2 Complaints"
    },
    "CUS-1043": {
        "id": "CUS-1043",
        "name": "Jason Tan",
        "company": "Tech Corp",
        "plan": "Enterprise",
        "status": "Cancelled",
        "login_frequency": "Very Low",
        "feature_usage": "15%",
        "payment_history": "Late 10 days",
        "support_tickets": "4 Complaints"
    }
}

def calculate_metrics(customer_data):
    """
    Traditional baseline formula to simulate ML outputs for Health Score and Churn Probability.
    """
    score = 100
    if customer_data["login_frequency"] in ["Low", "Very Low"]: score -= 30
    if int(customer_data["feature_usage"].replace("%","")) < 50: score -= 25
    if "Late" in customer_data["payment_history"]: score -= 15
    if "Complaints" in customer_data["support_tickets"]: score -= 10
    
    churn_prob = 100 - score + 10
    if churn_prob > 100: churn_prob = 98
    if churn_prob < 5: churn_prob = 5
    
    risk = "Healthy"
    if 50 <= score <= 79: risk = "Moderate Risk"
    elif score < 50: risk = "High Risk"
    
    return score, churn_prob, risk

@app.get("/api/customers/{customer_id}")
async def get_customer_analysis(customer_id: str):
    if customer_id not in MOCK_DATABASE:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    raw_data = MOCK_DATABASE[customer_id]
    
    # 1. Run traditional ML algorithm logic to calculate scores
    health_score, churn_prob, risk = calculate_metrics(raw_data)
    
    # 2. Call Large Language Model (Gemini API) for Explainable AI Insights & Recommendations
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an advanced B2B SaaS Churn Prediction AI. 
        Analyze this customer data:
        Name: {raw_data['name']}
        Login Frequency: {raw_data['login_frequency']}
        Feature Usage: {raw_data['feature_usage']}
        Payment History: {raw_data['payment_history']}
        Support Tickets: {raw_data['support_tickets']}
        Calculated Churn Risk: {churn_prob}%
        
        Provide the output strictly in the following JSON format:
        {{
            "insights": ["bullet point 1 explaining prediction why risk is high or healthy based on logic", "bullet point 2", "bullet point 3"],
            "action": "Single clear recommendation sentence like 'Upgrade to Pro Plan' or 'Offer a 15% renewal discount'",
            "reason": "Brief reason sentence why this action helps based on their specific issue"
        }}
        """
        
        response = model.generate_content(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )
        import json
        ai_result = json.loads(response.text)
    except Exception as e:
        # Fallback simulated AI data if the API Key is missing or invalid
        ai_result = {
            "insights": ["Login frequency dropped severely.", "Customer metrics show under-utilization."],
            "action": "Schedule an onboarding and training session.",
            "reason": "Low feature engagement indicates user is stuck."
        }

    # 3. Assemble the advanced JSON structure required by the React frontend
    return {
      "id": raw_data["id"],
      "name": raw_data["name"],
      "company": raw_data["company"],
      "plan": raw_data["plan"],
      "status": raw_data["status"],
      "healthScore": health_score,
      "risk": risk,
      "churnProbability": churn_prob,
      "segment": "At Risk" if risk == "High Risk" else "Loyal",
      "indicators": [
        { "name": "Login Frequency", "value": raw_data["login_frequency"], "status": "success" if raw_data["login_frequency"]=="High" else "danger" },
        { "name": "Feature Usage", "value": raw_data["feature_usage"], "status": "success" if int(raw_data["feature_usage"].replace("%","")) > 70 else "danger" },
        { "name": "Payment History", "value": raw_data["payment_history"], "status": "success" if raw_data["payment_history"]=="On Time" else "warning" },
        { "name": "Support Tickets", "value": raw_data["support_tickets"], "status": "success" if "0" in raw_data["support_tickets"] else "danger" }
      ],
      "churnAnalysis": ai_result["insights"][:2],
      "insights": ai_result["insights"],
      "aiDetection": [f"Usage: {raw_data['feature_usage']}", f"Tickets: {raw_data['support_tickets']}"],
      "recommendation": {
        "action": ai_result["action"],
        "reason": ai_result["reason"]
      },
      "simulations": [
        { "action": "Offer 20% Discount", "predictedChurn": int(churn_prob * 0.65) },
        { "action": "Assign Customer Success Manager", "predictedChurn": int(churn_prob * 0.45) },
        { "action": "Free Product Training", "predictedChurn": int(churn_prob * 0.30) },
        { "action": "No Action", "predictedChurn": churn_prob }
      ],
      "bestSimulation": "Free Product Training"
    }