export function mapCustomer(c) {
  return {
    id: c.id?.toString() || c.index?.toString() || "0",
    name: c.name || `User ${c.id || "0"}`,
    email: c.email || `user${c.id || "0"}@spotify.example.com`,
    age: c.age || "Unknown",
    gender: c.gender || "Unknown",
    company: c.spotify_listening_device || "Unknown Device",
    plan: c.spotify_subscription_plan || "Free",
    usageTenure: c.spotify_usage_period || "Unknown",
    favGenre: c.fav_music_genre || "Unknown",
    listeningTime: c.music_time_slot || "Unknown",
    listeningFrequency: c.music_lis_frequency || "Unknown",
    recommendationRating: c.music_recc_rating ?? null,
    podcastFrequency: c.pod_lis_frequency || "Unknown",
    favPodGenre: c.fav_pod_genre || "Unknown",
    contentSatisfaction: c.pod_variety_satisfaction || "Unknown",
    status: c.churn === 1 ? "Cancelled" : "Active",
    healthScore: c.health_score || 0,
    risk: c.risk_level || (c.churn === 1 ? "High Risk" : "Healthy"),
    churnProbability: c.churn_probability || 0,
    segment: c.segment || "Unknown",
    timeline: c.timeline || [],
    recommendation: c.recommendation || { action: "Pending AI Analysis", reason: "Data syncing." }
  };
}