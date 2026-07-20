const AGE_BANDS = [
  { max: 17, label: "13-17" },
  { max: 24, label: "18-24" },
  { max: 34, label: "25-34" },
  { max: 44, label: "35-44" },
  { max: 54, label: "45-54" },
  { max: 200, label: "55+" },
];

export function ageBand(age) {
  const numeric = Number(age);
  if (!numeric) return "Unknown";
  return AGE_BANDS.find((band) => numeric <= band.max)?.label || "Unknown";
}

export function mapCustomer(raw) {
  if (!raw) return null;

  const age = Number(raw.Age) || null;

  return {
    id: String(raw.id),
    name: raw.Name || "Unknown",
    email: raw.email || "",
    age,
    ageBand: ageBand(age),
    gender: raw.Gender || "Unknown",
    device: raw.spotify_listening_device || "Unknown",
    company: raw.spotify_listening_device || "Unknown",
    plan: raw.spotify_subscription_plan || "N/A",
    status: raw.status || "Active",
    segment: raw.segment || "Unknown",
    risk: raw.risk_level || "Unknown",
    healthScore: raw.health_score ?? 0,
    churnProbability: raw.churn_probability ?? 0,
    usageTenure: raw.spotify_usage_period || "Unknown",
    favGenre: raw.fav_music_genre || "N/A",
    listeningTime: raw.music_time_slot || "N/A",
    listeningFrequency: raw.music_lis_frequency || "N/A",
    listeningMood: raw.music_Influencial_mood || "N/A",
    explorationMethod: raw.music_expl_method || "N/A",
    recommendationRating: raw.music_recc_rating ? Number(raw.music_recc_rating) : null,
    podcastFrequency: raw.pod_lis_frequency || "N/A",
    favPodGenre: raw.fav_pod_genre || "N/A",
    podFormat: raw.preffered_pod_format || "N/A",
    podHost: raw.pod_host_preference || "N/A",
    podDuration: raw.preffered_pod_duration || "N/A",
    contentSatisfaction: raw.pod_variety_satisfaction || "N/A",
    premiumWillingness: raw.premium_sub_willingness || "N/A",
    preferredPlan: raw.preffered_premium_plan || "N/A",
    preferredContent: raw.preferred_listening_content || "N/A",
    recommendation: raw.recommendation || null,
  };
}