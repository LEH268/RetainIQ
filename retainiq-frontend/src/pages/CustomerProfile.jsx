import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Zap, CheckCircle2, AlertTriangle, Brain, Sparkles, Loader2, User, Music, Headphones } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import api from "../lib/api";
import { mapCustomer } from "../utils/dataMapper";

export default function CustomerProfile() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [simulatedChurn, setSimulatedChurn] = useState(null);
  const [simulationOptions, setSimulationOptions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState("");

  useEffect(() => {
      api.get(`/api/customers/${id}`).then(res => {
        setCustomer(mapCustomer(res.data));
        
        api.get(`/api/ai/simulate-options/${id}`).then(simRes => {
            setSimulationOptions(simRes.data.options || []);
        }).catch(() => {
            setSimulationOptions([]);
        });
        
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    setInsightsLoading(true);
    setInsightsError("");
    api.get(`/api/ai/explain/${id}`)
      .then(res => setInsights(res.data.insights || []))
      .catch(err => {
        setInsightsError(
          err.response?.status === 503 
             ? "AI service isn't configured on the backend (missing ANTHROPIC_API_KEY)." 
             : "Failed to generate AI insights. Check the backend logs."
        );
      })
      .finally(() => setInsightsLoading(false));
  }, [id]);

  const handleSimulate = async (action) => {
    setSelectedAction(action.name);
    setIsSimulating(true);
    try {
        const res = await api.post('/api/ai/simulate', { customerId: id, action: action.name });
        setSimulatedChurn(res.data.newChurnProbability);
    } catch (err) {
        alert("Simulation API failed. Make sure backend /api/ai/simulate is configured.");
    } finally {
        setIsSimulating(false);
    }
  };

  const handleApplyAction = async () => {
    try {
        await api.post(`/api/recommendations/${id}/action`, { 
            type: 'apply',
            action: selectedAction || customer?.recommendation?.action 
        });
        alert(`Action triggered successfully for ${customer.name}!`);
    } catch (e) {
        alert("Failed to apply action.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-display text-lg text-ink/50">
        <Loader2 className="animate-spin mr-2"/> Processing AI Profile...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-ink/30">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-display font-bold">Customer Not Found</h2>
        <p className="text-sm font-medium text-ink/60">The customer ID "{id}" does not exist in the database.</p>
        <Link to="/customers" className="mt-4 px-6 py-2.5 bg-[var(--color-brand)] text-white font-bold rounded-xl shadow-sm hover:bg-[var(--color-brand-dark)] transition-colors">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <Link to="/customers" className="flex w-fit items-center gap-1.5 text-sm font-bold text-ink/60 hover:text-[var(--color-brand)] transition-colors">
        <ArrowLeft size={16} /> Back to Customers
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">{customer.name}</h1>
          <p className="text-sm text-ink/60 font-medium mt-1">{customer.company} • {customer.email}</p>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-sm font-bold bg-gray-100 px-3 py-1 rounded-lg text-gray-700 shadow-sm">{customer.plan}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-[var(--color-brand)]" />
            <h3 className="font-bold font-display">Profile</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink/50 font-medium">Age Group</dt><dd className="font-bold">{customer.age}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50 font-medium">Gender</dt><dd className="font-bold">{customer.gender}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50 font-medium">Device</dt><dd className="font-bold">{customer.company}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50 font-medium">Account Tenure</dt><dd className="font-bold">{customer.usageTenure}</dd></div>
          </dl>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Music size={18} className="text-[var(--color-brand)]" />
            <h3 className="font-bold font-display">Music Habits</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink/50 font-medium">Favorite Genre</dt><dd className="font-bold">{customer.favGenre}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50 font-medium">Usual Listening Time</dt><dd className="font-bold">{customer.listeningTime}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50 font-medium">Listening Frequency</dt><dd className="font-bold">{customer.listeningFrequency}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50 font-medium">Recommendation Rating</dt><dd className="font-bold">{customer.recommendationRating != null ? `${customer.recommendationRating}/5` : "N/A"}</dd></div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Headphones size={18} className="text-[var(--color-brand)]" />
            <h3 className="font-bold font-display">Podcast Habits</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink/50 font-medium">Listening Frequency</dt><dd className="font-bold">{customer.podcastFrequency}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50 font-medium">Favorite Genre</dt><dd className="font-bold">{customer.favPodGenre}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50 font-medium">Content Satisfaction</dt><dd className="font-bold">{customer.contentSatisfaction}</dd></div>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm text-center">
            <h2 className="text-lg font-bold font-display mb-4">Health Score</h2>
            <div className={`w-32 h-32 mx-auto rounded-full border-8 flex items-center justify-center mb-4 ${customer.healthScore > 60 ? 'border-emerald-500 text-emerald-600' : 'border-rose-500 text-rose-600'}`}>
              <span className="text-4xl font-display font-bold">{customer.healthScore}</span>
            </div>
            <p className={`text-sm font-bold inline-block px-3 py-1 rounded-lg mb-4 ${customer.healthScore > 60 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
               {customer.healthScore > 60 ? 'Healthy' : 'Poor'}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm text-center">
            <h2 className="text-lg font-bold font-display mb-4">Churn Prediction</h2>
            <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
              <div className={`h-4 rounded-full ${customer.churnProbability > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${customer.churnProbability}%` }}></div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className={`text-4xl font-display font-bold ${customer.churnProbability > 50 ? 'text-rose-600' : 'text-emerald-600'}`}>{customer.churnProbability}%</span>
              <RiskBadge risk={customer.risk} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
            <h2 className="text-lg font-bold font-display mb-4 flex items-center gap-2">
              <Brain className="text-[var(--color-accent)]"/> Explainable AI Insights
            </h2>
            {insightsLoading && (
              <div className="flex items-center gap-2 text-sm font-bold text-ink/50 py-4">
                <Loader2 size={16} className="animate-spin" /> AI is analyzing this customer...
              </div>
            )}
            {!insightsLoading && insightsError && (
              <p className="text-sm font-bold text-rose-600 bg-rose-50 p-3 rounded-xl">{insightsError}</p>
            )}
            {!insightsLoading && !insightsError && (
              <ul className="space-y-3">
                {insights.length > 0 ? insights.map((analysis, index) => (
                  <li key={index} className="bg-gray-50 p-3 rounded-xl flex items-start gap-3 border border-gray-100">
                    <span className={`${customer.risk === 'High Risk' ? 'text-rose-500' : 'text-[var(--color-brand)]'} font-bold mt-0.5`}>•</span>
                    <span className="text-sm font-bold">{analysis}</span>
                  </li>
                )) : (
                  <p className="text-sm text-ink/50 italic">No insights returned.</p>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-[var(--color-brand)] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[var(--color-brand)] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg tracking-wider">
              Simulation Engine
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-amber-500" />
              <h2 className="text-xl font-bold font-display">AI Action Simulator</h2>
            </div>
            
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200">
               <div className="text-center">
                 <p className="text-xs font-bold text-ink/50 uppercase">Current Churn</p>
                 <p className="text-2xl font-black font-display text-rose-600">{customer.churnProbability}%</p>
               </div>
               <div className="text-ink/30 font-black text-xl">→</div>
               <div className="text-center">
                 <p className="text-xs font-bold text-ink/50 uppercase">Expected</p>
                 <p className={`text-2xl font-black font-display transition-colors ${simulatedChurn ? 'text-emerald-600' : 'text-ink/30'} ${isSimulating ? 'animate-pulse' : ''}`}>
                   {isSimulating ? '...' : simulatedChurn ? `${simulatedChurn}%` : '--'}
                 </p>
               </div>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-xs font-bold text-ink/50 uppercase mb-3">Test Retention Strategies</p>
              {simulationOptions.length > 0 ? simulationOptions.map((action, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSimulate(action)}
                  className={`w-full flex items-center justify-between p-3 border-2 rounded-xl text-sm font-bold transition-all ${
                    selectedAction === action.name 
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-dark)]' 
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {action.name}
                  {selectedAction === action.name && <CheckCircle2 size={16} />}
                </button>
              )) : (
                 <div className="text-xs font-medium text-ink/50 bg-gray-50 p-3 rounded">Requires backend /api/ai/simulate-options to populate.</div>
              )}
            </div>

            <div className="bg-[var(--color-ink)] p-5 rounded-xl border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-amber-400" size={16} />
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">AI Best Option</p>
              </div>
              <p className="text-lg font-black text-white mb-4">{customer.recommendation?.action || "N/A"}</p>
              <button onClick={handleApplyAction} className="w-full py-2.5 bg-[var(--color-brand)] text-white rounded-lg text-sm font-bold hover:bg-[var(--color-brand-dark)] transition-colors shadow-sm">
                Apply Action
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}