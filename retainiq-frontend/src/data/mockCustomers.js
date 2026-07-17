// Placeholder data — swap for real API responses from FastAPI once connected
export const customers = [
  { id: "CUS-1042", name: "Aiko Tanaka", company: "Northwind Retail", plan: "Pro", healthScore: 88, risk: "Healthy", churnProbability: 6, segment: "Loyal" },
  { id: "CUS-1043", name: "Marcus Lee", company: "Bluepeak Logistics", plan: "Enterprise", healthScore: 41, risk: "High Risk", churnProbability: 74, segment: "At-Risk" },
  { id: "CUS-1044", name: "Priya Nair", company: "Solace Health", plan: "Growth", healthScore: 63, risk: "Moderate Risk", churnProbability: 38, segment: "VIP" },
  { id: "CUS-1045", name: "Daniel Cruz", company: "Fernway Studio", plan: "Starter", healthScore: 92, risk: "Healthy", churnProbability: 3, segment: "New" },
  { id: "CUS-1046", name: "Hana Kim", company: "Orbital Freight", plan: "Pro", healthScore: 28, risk: "High Risk", churnProbability: 81, segment: "At-Risk" },
  { id: "CUS-1047", name: "Sofia Rossi", company: "GreenLeaf Foods", plan: "Growth", healthScore: 55, risk: "Moderate Risk", churnProbability: 44, segment: "Inactive" },
];

export const healthDistribution = [
  { name: "Healthy", value: 52, color: "var(--color-risk-low)" },
  { name: "Moderate Risk", value: 31, color: "var(--color-risk-mid)" },
  { name: "High Risk", value: 17, color: "var(--color-risk-high)" },
];

export const churnTrend = [
  { month: "Feb", predicted: 5.1 },
  { month: "Mar", predicted: 5.6 },
  { month: "Apr", predicted: 6.4 },
  { month: "May", predicted: 6.0 },
  { month: "Jun", predicted: 7.2 },
  { month: "Jul", predicted: 6.8 },
];

export const segments = [
  { name: "Loyal", value: 120 },
  { name: "VIP", value: 34 },
  { name: "At-Risk", value: 58 },
  { name: "New", value: 76 },
  { name: "Inactive", value: 29 },
];
