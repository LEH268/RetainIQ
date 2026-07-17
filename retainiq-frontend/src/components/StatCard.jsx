import { Link } from "react-router-dom"; 
import { ArrowUpRight, ArrowDownRight } from "lucide-react"; 

export default function StatCard({ label, value, delta, deltaTone = "up", to }) {   
  const CardContent = (     
    <div className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-sm hover:shadow-md hover:border-[var(--color-brand)]/30 transition-all duration-300 flex flex-col justify-between relative overflow-hidden h-full cursor-pointer">       
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand)]/0 to-[var(--color-brand)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />              
      <p className="text-sm font-semibold text-ink/60">{label}</p>       
      <div className="mt-4 flex items-end justify-between">         
        <span className="text-4xl font-bold font-display leading-none text-ink group-hover:text-[var(--color-brand)] transition-colors">{value}</span>         
        {delta && (           
          <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-md ${             
            deltaTone === "up" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"           
          }`}>             
            {deltaTone === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}             
            {delta}           
          </span>         
        )}       
      </div>     
    </div>   
  );   
  return to ? <Link to={to} className="block h-full">{CardContent}</Link> : CardContent; 
}