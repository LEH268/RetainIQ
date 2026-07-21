import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, AlertTriangle } from "lucide-react";
import api from "../lib/api";

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello. I'm RetainIQ AI, powered by OpenAI. Ask me anything about the customer dataset.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    api
      .get("/ai/status")
      .then((res) => setAiStatus(res.data))
      .catch(() => setAiStatus(null));
  }, [isOpen]);

  useEffect(() => {
    // Scroll the message container itself rather than the page, so opening
    // the panel never yanks the underlying dashboard around.
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);
    try {
      const res = await api.post("/ai/chat", { message: userMsg });
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: res.data.reply, degraded: res.data.aiGenerated === false },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Couldn't reach the backend. Check that it's running on port 8000.",
          degraded: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 p-4 bg-[var(--color-brand)] text-white rounded-full shadow-2xl hover:bg-[var(--color-brand-dark)] transition-all flex items-center justify-center z-50"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {isOpen && (
        <div
          className="fixed bottom-24 right-8 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[var(--color-border)] flex flex-col overflow-hidden z-50"
          style={{ maxHeight: "min(70vh, 640px)" }}
        >
          {/* Pinned header */}
          <div className="bg-[var(--color-brand)] text-white p-4 flex items-center gap-3 shrink-0">
            <Bot size={24} />
            <div className="min-w-0">
              <h3 className="font-bold font-display">Ask RetainIQ AI</h3>
              <p className="text-xs text-blue-100 truncate">
                {aiStatus?.available
                  ? `Powered by ${aiStatus.model}`
                  : aiStatus
                  ? "Degraded — showing raw data"
                  : "Connecting..."}
              </p>
            </div>
          </div>

          {/* Pinned status banner */}
          {aiStatus && !aiStatus.available && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs font-bold text-amber-800 flex items-start gap-2 shrink-0">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{aiStatus.message}</span>
            </div>
          )}

          {/* The only scrolling region */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 max-w-[85%] ${
                  msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.sender === "user"
                      ? "bg-gray-200 text-gray-700"
                      : "bg-blue-100 text-[var(--color-brand)]"
                  }`}
                >
                  {msg.sender === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div
                  className={`p-3 rounded-xl text-sm font-medium shadow-sm whitespace-pre-wrap break-words ${
                    msg.sender === "user"
                      ? "bg-[var(--color-brand)] text-white rounded-tr-none"
                      : msg.degraded
                      ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none"
                      : "bg-white border border-[var(--color-border)] text-ink rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="self-start flex gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-[var(--color-brand)]">
                  <Bot size={16} />
                </div>
                <div className="p-3 rounded-xl bg-white border border-[var(--color-border)] rounded-tl-none flex items-center">
                  <Loader2 size={16} className="animate-spin text-ink/40" />
                </div>
              </div>
            )}
          </div>

          {/* Pinned input */}
          <div className="p-3 bg-white border-t border-[var(--color-border)] shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about churn, segments, revenue..."
                className="flex-1 min-w-0 border-2 border-[var(--color-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]"
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="p-2 bg-[var(--color-brand)] text-white rounded-xl hover:bg-[var(--color-brand-dark)] transition-colors disabled:opacity-50 shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}