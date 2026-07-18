export function mapCustomer(c) {
  return {
    id: c.id?.toString() || c.index?.toString() || "0",
    name: c.name || `User ${c.id || "0"}`, 
    email: c.email || `user${c.id || "0"}@spotify.example.com`,
    company: c.spotify_listening_device || "Unknown Device",
    plan: c.spotify_subscription_plan || "Free",
    status: c.churn === 1 ? "Cancelled" : "Active",
    healthScore: c.health_score || 0,
    risk: c.risk_level || (c.churn === 1 ? "High Risk" : "Healthy"),
    churnProbability: c.churn_probability || 0,
    segment: c.segment || "Unknown",
    timeline: c.timeline || [], 
    churnAnalysis: c.churn_analysis || [], 
    recommendation: c.recommendation || { action: "Pending AI Analysis", reason: "Data syncing." }
  };
}