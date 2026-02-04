import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';

export default function App({ apiKey, initialHistory, onHistoryChange, useMarkdown, customQuery, userName, aiContext }) {
  const [messages, setMessages] = useState(initialHistory || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true); // Internal UI Toggle
  const lastProcessedRef = useRef(null);
  const scrollRef = useRef(null);

  const getMessageText = (parts) => parts.find(p => p.text)?.text || "";
  const hasFileData = (parts) => parts.some(p => p.inline_data);

  useEffect(() => {
    if (initialHistory) setMessages(initialHistory);
    const syncToggle = async () => {
      if (customQuery) {
        const externalState = await customQuery();
        setIsAiEnabled(externalState);
      }
    };
    syncToggle();
  }, [initialHistory, customQuery]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Inside App.jsx - Update the trigger useEffect
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    
    // Trigger if message is local, AI is enabled, and not currently loading
    if (lastMsg?.role === 'user' && lastMsg.isLocal && isAiEnabled && !loading) {
      const msgText = getMessageText(lastMsg.parts); 
      if (msgText !== lastProcessedRef.current || hasFileData(lastMsg.parts)) {
        triggerGemini(messages);
      }
    }
  }, [messages, isAiEnabled]);

  const triggerGemini = async (history) => {
    setLoading(true);
    const lastMsg = history[history.length - 1];
    lastProcessedRef.current = getMessageText(lastMsg.parts);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          system_instruction: {
            parts: [{ text: aiContext || "You are a helpful assistant in a group chat. Analyze any uploaded files and answer the user's prompt." }]
          },
          // Send all parts (text + inline_data) to the API
          contents: history.map(({role, parts}) => ({role, parts})) 
        })
      });

      const data = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (botText) {
        const finalHistory = [...history, { role: 'model', parts: [{ text: botText }], isLocal: true }];
        setMessages(finalHistory); 
        onHistoryChange(finalHistory);
      }
    } catch (error) {
      console.error("Gemini Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const formattedText = `${userName}: ${input}`;
    const updatedHistory = [...messages, { role: 'user', parts: [{ text: formattedText }], isLocal: true }];
    setMessages(updatedHistory);
    setInput('');
    onHistoryChange(updatedHistory);
  };

  return (
    <div className="fixed bottom-5 right-5 w-96 max-h-[600px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[9999] font-sans">
      {/* Modern Header with Toggle */}
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm">AI Assistant</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Group Session</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
          <input 
            type="checkbox" 
            id="widget-ai"
            checked={isAiEnabled}
            onChange={(e) => setIsAiEnabled(e.target.checked)}
            className="w-3 h-3 accent-blue-500 cursor-pointer"
          />
          <label htmlFor="widget-ai" className="text-[10px] font-bold cursor-pointer select-none">ASK AI</label>
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {/* Inside the message mapping in your return block */}
        {messages.map((m, i) => {
          const isBot = m.role === 'model';
          const alignRight = m.isLocal && !isBot;
          
          // Use helpers to extract content from multi-part messages
          const text = getMessageText(m.parts);
          const hasFile = hasFileData(m.parts);

          return (
            <div key={i} className={`flex ${alignRight ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                alignRight 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
              }`}>
                {/* Visual indicator for attachments */}
                {hasFile && (
                  <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1 italic">
                    <span>📎 Attachment processed</span>
                  </div>
                )}
                {isBot && useMarkdown ? (
                  <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(text) }} />
                ) : (
                  text
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Modern Input */}
      <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
          placeholder="Type a message..."
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()} 
        />
        <button 
          onClick={handleSend} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-blue-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  );
}