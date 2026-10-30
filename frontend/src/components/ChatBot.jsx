import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  BrainCircuit, 
  Bot, 
  User, 
  RefreshCw, 
  Flame, 
  TrendingDown, 
  ShieldCheck,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { api } from '../api';

export default function ChatBot({ projectId = 'nexus-college' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your local **ClickTrace UX Copilot** powered by Gemma 2B. Ask me anything about your website's rage clicks, conversion funnels, visitor drop-offs, or UI recommendations."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    "🔥 What are the biggest rage clicks?",
    "📉 Where is the biggest funnel drop-off?",
    "💡 Top 3 actionable UX recommendations",
    "📊 Summarize visitor behavior"
  ];

  const handleSend = async (messageToSend) => {
    const text = messageToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-4).map(m => ({ role: m.role, content: m.content }));
      const res = await api.chatWithAi(text, history, projectId);
      
      const botMsg = {
        role: 'assistant',
        content: res.reply || "I analyzed your telemetry, but couldn't formulate a response. Please check your data.",
        model: res.model,
        telemetry: res.telemetry_used
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "Sorry, I encountered an issue connecting to the local AI engine. " + err.message,
          isError: true 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! How can I help analyze your website's visitor interactions today?"
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Floating Toggle Pill / Launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-xs shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200 border border-blue-400/30"
          title="Open AI UX Copilot"
        >
          <div className="relative">
            <BrainCircuit className="w-4 h-4 text-white" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <span>UX Copilot</span>
          <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-extrabold uppercase">
            Gemma 2B
          </span>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/90 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/30">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight text-white leading-tight">UX Copilot</h3>
                  <span className="text-[9px] bg-blue-500/30 text-blue-300 font-extrabold px-1.5 py-0.5 rounded border border-blue-400/30">
                    Gemma 2B
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Grounded in SQLite Telemetry</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition"
                title="Clear conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition"
                title="Minimize chat"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isUser 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-900 text-white shadow-2xs'
                  }`}>
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-blue-300" />}
                  </div>

                  <div className={`max-w-[80%] rounded-2xl p-3 leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                      : m.isError
                      ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {!isUser && m.model && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Model: {m.model}</span>
                        {m.telemetry && (
                          <span className="font-semibold text-slate-500">
                            {m.telemetry.friction_signals} obstacles • {m.telemetry.conversion_rate}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-blue-300" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]"></span>
                    <span className="ml-1 text-[11px] font-semibold text-slate-500">Gemma is analyzing telemetry...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Queries Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickPrompts.map((q, qidx) => (
              <button
                key={qidx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-semibold transition shrink-0 border border-slate-200/60"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-blue-500 focus-within:bg-white transition shadow-2xs">
              <input
                type="text"
                placeholder="Ask about rage clicks, funnel drop-offs, or UX fixes..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className={`p-1.5 rounded-lg transition ${
                  input.trim() && !loading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
