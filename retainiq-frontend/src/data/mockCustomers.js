// /* BACKEND INTEGRATION: Replace this mock data with real API endpoints */

export const customers = [
  { 
    id: "CUS-1042", 
    name: "Sarah Lim", 
    email: "sarah.lim@example.com", 
    company: "Lim & Co", 
    plan: "Pro", 
    status: "Active", // Filterable: Active, New, Cancelled
    healthScore: 42, 
    risk: "High Risk", 
    churnProbability: 88, 
    segment: "At Risk",
    indicators: [
      { name: "Login Frequency", value: "Low", status: "warning" },
      { name: "Feature Usage", value: "35%", status: "danger" },
      { name: "Payment History", value: "On Time", status: "success" },
      { name: "Support Tickets", value: "2 Complaints", status: "danger" }
    ],
    churnAnalysis: [
      "Login frequency dropped by 60%",
      "No activity for the past 14 days"
    ],
    insights: [
      "Login frequency decreased by 60%",
      "Customer has not used premium features",
      "Submitted 2 support complaints recently",
      "Product usage reduced by 40%"
    ],
    aiDetection: ["Very low product usage", "Recently joined"],
    recommendation: {
      action: "Recommend onboarding tutorial and product training.",
      reason: "Highest reduction in churn risk with the lowest business cost."
    },
    simulations: [
      { action: "Offer 20% Discount", predictedChurn: 58 },
      { action: "Assign Customer Success Manager", predictedChurn: 41 },
      { action: "Free Product Training", predictedChurn: 26 },
      { action: "No Action", predictedChurn: 88 }
    ],
    bestSimulation: "Free Product Training"
  },
  { 
    id: "CUS-1043", 
    name: "Jason Tan", 
    email: "jason.tan@techcorp.com", 
    company: "Tech Corp", 
    plan: "Enterprise", 
    status: "Cancelled", 
    healthScore: 21, 
    risk: "High Risk", 
    churnProbability: 91, 
    segment: "Inactive",
    indicators: [
      { name: "Login Frequency", value: "Very Low", status: "danger" },
      { name: "Feature Usage", value: "15%", status: "danger" },
      { name: "Payment History", value: "Late 10 days", status: "warning" },
      { name: "Support Tickets", value: "4 Complaints", status: "danger" }
    ],
    churnAnalysis: [
      "Login frequency dropped by 70%",
      "Subscription usage decreased significantly",
      "No activity for the past 21 days"
    ],
    insights: [
      "Login frequency decreased by 70%",
      "Customer has not used premium features",
      "Submitted 4 support complaints",
      "Product usage reduced by 55%"
    ],
    aiDetection: ["Price-sensitive customer", "Subscription renewal next week"],
    recommendation: {
      action: "Offer a 15% renewal discount.",
      reason: "Customer is highly price-sensitive and at immediate risk of non-renewal."
    },
    simulations: [
      { action: "Offer 15% Discount", predictedChurn: 35 },
      { action: "Send automated email", predictedChurn: 85 },
      { action: "Schedule Call", predictedChurn: 60 },
      { action: "No Action", predictedChurn: 91 }
    ],
    bestSimulation: "Offer 15% Discount"
  },
  { 
    id: "CUS-1044", 
    name: "Emily Chen", 
    email: "emily.c@innovate.net", 
    company: "Innovate Net", 
    plan: "Basic", 
    status: "New", 
    healthScore: 85, 
    risk: "Healthy", 
    churnProbability: 12, 
    segment: "VIP",
    indicators: [
      { name: "Login Frequency", value: "High", status: "success" },
      { name: "Feature Usage", value: "92%", status: "success" },
      { name: "Payment History", value: "On Time", status: "success" },
      { name: "Support Tickets", value: "0", status: "success" }
    ],
    churnAnalysis: [
      "Consistent daily activity",
      "High reliance on core APIs"
    ],
    insights: [
      "Platform dependency is high",
      "Approaching limits on current tier"
    ],
    aiDetection: ["Storage usage: 95%", "API usage: 98%"],
    recommendation: {
      action: "Upgrade to Pro Plan.",
      reason: "Customer is hitting limits and needs more capacity to continue operating smoothly."
    },
    simulations: [
      { action: "Suggest Pro Upgrade", predictedChurn: 2 },
      { action: "Offer Free Storage", predictedChurn: 10 },
      { action: "No Action", predictedChurn: 12 }
    ],
    bestSimulation: "Suggest Pro Upgrade"
  }
];

export const healthDistribution = [
  { name: "Healthy", value: 810, color: "var(--color-risk-low)" },
  { name: "Moderate Risk", value: 310, color: "var(--color-risk-mid)" },
  { name: "High Risk", value: 128, color: "var(--color-risk-high)" },
];

export const churnTrend = [
  { month: "Jan", predicted: 5.1 }, { month: "Feb", predicted: 5.6 }, { month: "Mar", predicted: 6.4 },
  { month: "Apr", predicted: 6.0 }, { month: "May", predicted: 7.2 }, { month: "Jun", predicted: 6.8 },
];

export const segments = [
  { name: "VIP", value: 215 },
  { name: "Loyal", value: 540 },
  { name: "New", value: 124 },
  { name: "At Risk", value: 290 },
  { name: "Inactive", value: 79 },
];