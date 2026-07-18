import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import api from "../lib/api";

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! I am RetainIQ AI. How can I help you analyze the customer dataset today?" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await api.post('/api/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { sender: "ai", text: res.data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: "ai", text: "Error connecting to AI. Please ensure the backend API is running." }]);
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
        <div className="fixed bottom-24 right-8 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[var(--color-border)] flex flex-col overflow-hidden z-50">
          <div className="bg-[var(--color-brand)] text-white p-4 flex items-center gap-3">
            <Bot size={24} />
            <div>
              <h3 className="font-bold font-display">Ask RetainIQ AI</h3>
              <p className="text-xs text-blue-100">Powered by Backend Models</p>
            </div>
          </div>
          
          <div className="flex-1 p-4 h-80 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "user" ? "bg-gray-200 text-gray-700" : "bg-blue-100 text-[var(--color-brand)]"}`}>
                  {msg.sender === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-3 rounded-xl text-sm font-medium shadow-sm ${msg.sender === "user" ? "bg-[var(--color-brand)] text-white rounded-tr-none" : "bg-white border border-[var(--color-border)] text-ink rounded-tl-none"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="self-start flex gap-2 max-w-[85%]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-[var(--color-brand)]">
                  <Bot size={16} />
                </div>
                <div className="p-3 rounded-xl text-sm font-medium shadow-sm bg-white border border-[var(--color-border)] text-ink rounded-tl-none flex items-center">
                  <Loader2 size={16} className="animate-spin text-ink/40" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask AI anything..." 
                className="flex-1 border-2 border-[var(--color-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]"
              />
              <button 
                onClick={handleSend}
                disabled={isTyping}
                className="p-2 bg-[var(--color-brand)] text-white rounded-xl hover:bg-[var(--color-brand-dark)] transition-colors disabled:opacity-50"
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