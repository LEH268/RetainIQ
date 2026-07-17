import { CheckSquare, Clock } from "lucide-react";
import { tasks } from "../data/mockCustomers";

export default function TaskCenter() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <h1 className="font-display text-3xl font-bold">Task Center</h1>
        <p className="text-sm text-ink/60 mt-1 font-medium">Track operational tasks generated from AI recommendations.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] bg-gray-50 flex items-center gap-2">
          <CheckSquare className="text-[var(--color-brand)]" />
          <h2 className="font-bold font-display text-lg">Action Items</h2>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {tasks.map((task, i) => (
            <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-black text-lg mb-1">{task.task}</p>
                <p className="text-sm font-bold text-ink/60">For Customer: <span className="text-[var(--color-brand)]">{task.customer}</span></p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-bold text-ink/60">
                  <Clock size={16} /> {task.due}
                </div>
                <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border ${
                  task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {task.status}
                </span>
                {task.status !== 'Completed' && (
                  <button className="px-4 py-2 bg-[var(--color-ink)] text-white text-sm font-bold rounded-xl shadow-sm hover:bg-opacity-90">Mark Done</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}