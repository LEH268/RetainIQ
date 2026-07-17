export const customers = [
  { 
    id: "CUS-1042", name: "Amy Tan", email: "amy.tan@example.com", company: "Retail Co", plan: "Premium", status: "Active", 
    healthScore: 35, risk: "High Risk", churnProbability: 91, segment: "At Risk",
    indicators: [
      { name: "Login Frequency", value: "Very Low", status: "danger" },
      { name: "Feature Usage", value: "20%", status: "danger" },
      { name: "Payment History", value: "Late 28 Days", status: "danger" },
      { name: "Support Tickets", value: "3 Complaints", status: "danger" }
    ],
    churnAnalysis: ["Login decreased", "Payment overdue", "Support complaints", "Unused features"],
    insights: ["Login frequency decreased significantly over 30 days", "Last payment was 28 days ago", "Multiple support complaints logged"],
    aiDetection: ["Price-sensitive customer", "Low product usage"],
    recommendation: { action: "Customer Success Call", reason: "Direct intervention required to resolve complaints." },
    simulations: [
      { action: "Discount 20%", predictedChurn: 65 },
      { action: "Training", predictedChurn: 42 },
      { action: "Training + Discount", predictedChurn: 18 },
      { action: "Free Trial", predictedChurn: 50 },
      { action: "Customer Success Call", predictedChurn: 22 }
    ],
    bestSimulation: "Training + Discount",
    timeline: [
      { date: "June 15", event: "Upgraded to Premium", type: "success" },
      { date: "July 02", event: "Submitted 3 Complaints", type: "danger" },
      { date: "July 15", event: "Late Payment Triggered", type: "warning" },
      { date: "Today", event: "Marked as High Risk (91%)", type: "danger" }
    ],
    recentActivity: { lastLogin: "20 days ago", sessions: 3, featureUsage: "20%" }
  },
  { 
    id: "CUS-1043", name: "John Lee", email: "john.lee@techcorp.com", company: "Tech Corp", plan: "Enterprise", status: "Active", 
    healthScore: 82, risk: "Healthy", churnProbability: 12, segment: "Loyal",
    indicators: [
      { name: "Login Frequency", value: "High", status: "success" },
      { name: "Feature Usage", value: "85%", status: "success" },
      { name: "Payment History", value: "On Time", status: "success" }
    ],
    churnAnalysis: ["Consistent platform usage", "Zero payment issues"],
    insights: ["Platform dependency is high", "Zero support tickets in 3 months"],
    aiDetection: ["High API dependency"],
    recommendation: { action: "Offer Enterprise Add-on", reason: "Customer is engaged and ready for upselling." },
    simulations: [
      { action: "Offer Add-on", predictedChurn: 5 },
      { action: "No Action", predictedChurn: 12 }
    ],
    bestSimulation: "Offer Add-on",
    timeline: [
      { date: "Jan 10", event: "Onboarded", type: "success" },
      { date: "Mar 05", event: "Added 10 team members", type: "success" },
      { date: "Today", event: "Healthy Engagement", type: "success" }
    ],
    recentActivity: { lastLogin: "Today", sessions: 45, featureUsage: "85%" }
  }
];

export const healthDistribution = [
  { name: "Healthy", value: 1800, color: "var(--color-risk-low)" },
  { name: "Moderate Risk", value: 438, color: "var(--color-risk-mid)" },
  { name: "High Risk", value: 212, color: "var(--color-risk-high)" },
];

export const churnTrend = [
  { month: "Jan", predicted: 12 }, { month: "Feb", predicted: 14 }, { month: "Mar", predicted: 15 },
  { month: "Apr", predicted: 16 }, { month: "May", predicted: 18 }, { month: "Jun", predicted: 18 },
];

export const engagementTrend = [
  { name: "Logins", value: 85 }, { name: "Features", value: 62 }, { name: "Support", value: 24 }
];

export const recentAlerts = [
  { customer: "John Lee", risk: "High Risk", issue: "Payment Failed" },
  { customer: "Amy Tan", risk: "Inactive", issue: "No login for 15 Days" },
  { customer: "Tech Corp", risk: "Moderate Risk", issue: "Downgrade Request" }
];

export const segments = [
  { name: "VIP", value: 215 }, { name: "Loyal", value: 540 }, { name: "New", value: 124 },
  { name: "At Risk", value: 290 }, { name: "Inactive", value: 79 },
];

export const tasks = [
  { customer: "Amy Tan", task: "Schedule Success Call", due: "Tomorrow", status: "Pending" },
  { customer: "John Lee", task: "Offer 20% Discount", due: "Today", status: "Completed" },
  { customer: "Michael Cho", task: "Send Renewal Reminder", due: "In 3 Days", status: "Pending" }
];