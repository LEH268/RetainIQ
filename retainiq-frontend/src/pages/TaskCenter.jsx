import { useState, useEffect } from "react";
import { CheckSquare, Clock, Filter, CheckCircle2, Loader2 } from "lucide-react";
import api from "../lib/api";

export default function TaskCenter() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    api.get("/api/tasks").then(res => {
      setTasks(res.data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load tasks:", err);
      setLoading(false);
    });
  }, []);

  const toggleTaskStatus = async (id) => {
    try {
      await api.put(`/api/tasks/${id}/toggle`);
      setTasks(tasks.map(t => 
        t.id === id ? { ...t, status: t.status === "Pending" ? "Completed" : "Pending" } : t
      ));
    } catch(e) {
      alert("Failed to update status on server.");
    }
  };

  const filteredTasks = tasks.filter(t => filter === "All" || t.status === filter);
  const pendingCount = tasks.filter(t => t.status === "Pending").length;

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-display text-lg text-ink/50"><Loader2 className="animate-spin mr-2"/> Loading Tasks...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">Task Center</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Track operational tasks generated from AI recommendations.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold border border-amber-200">
             {pendingCount} Pending Tasks
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="text-[var(--color-brand)]" />
            <h2 className="font-bold font-display text-lg">Action Items</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-ink/50" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg text-sm font-bold px-3 py-1.5 outline-none focus:border-[var(--color-brand)] cursor-pointer shadow-sm"
            >
              <option value="All">All Tasks</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center text-ink/50 font-medium">
              No tasks found for this filter.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${task.status === 'Completed' ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}>
                
                <div className="flex items-start gap-4">
                  <button 
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`mt-1 shrink-0 transition-colors ${task.status === 'Completed' ? 'text-emerald-500' : 'text-gray-300 hover:text-[var(--color-brand)]'}`}
                  >
                    <CheckCircle2 size={24} className={task.status === 'Completed' ? 'fill-emerald-50' : ''} />
                  </button>
                  <div>
                    <p className={`font-black text-lg mb-1 transition-colors ${task.status === 'Completed' ? 'text-ink/40 line-through' : 'text-ink'}`}>{task.task}</p>
                    <p className="text-sm font-bold text-ink/60">For Customer: <span className={task.status === 'Completed' ? 'text-ink/40' : 'text-[var(--color-brand)]'}>{task.customer}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-6 ml-10 md:ml-0">
                  <div className={`flex items-center gap-2 text-sm font-bold ${task.due === 'Today' || task.due === 'Yesterday' ? 'text-rose-500' : 'text-ink/60'} ${task.status === 'Completed' ? 'opacity-50' : ''}`}>
                    <Clock size={16} /> {task.due}
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border w-28 text-center ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {task.status}
                  </span>
                  
                  {task.status !== 'Completed' ? (
                    <button onClick={() => toggleTaskStatus(task.id)} className="px-4 py-2 bg-[var(--color-ink)] text-white text-sm font-bold rounded-xl shadow-sm hover:bg-opacity-90 w-28">
                      Mark Done
                    </button>
                  ) : (
                    <button onClick={() => toggleTaskStatus(task.id)} className="px-4 py-2 bg-white border border-gray-200 text-ink/60 text-sm font-bold rounded-xl shadow-sm hover:bg-gray-50 w-28">
                      Undo
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}