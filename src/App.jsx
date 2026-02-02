import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';

export default function App({ apiKey, initialHistory, onHistoryChange, useMarkdown, customQuery }) {
  const [messages, setMessages] = useState(initialHistory || []);
  const [input, setInput] = useState(''); // RE-ADDED missing state
  const [loading, setLoading] = useState(false);
  const lastProcessedRef = useRef(null);

  useEffect(() => {
    if (initialHistory) setMessages(initialHistory);
  }, [initialHistory]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    
    // Triggers ONLY if the message originated in THIS browser tab
    if (lastMsg?.role === 'user' && lastMsg.isLocal && !loading) {
      const msgContent = lastMsg.parts[0].text;
      if (msgContent !== lastProcessedRef.current) {
        triggerGemini(messages);
      }
    }
  }, [messages]);

  const triggerGemini = async (history) => {
    const isAiEnabled = customQuery ? await customQuery() : false; // Check index.html toggle
    if (!isAiEnabled) return;

    setLoading(true);
    lastProcessedRef.current = history[history.length - 1].parts[0].text;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: history.map(({role, parts}) => ({role, parts})) // Strip isLocal for API
        })
      });

      const data = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (botText) {
        const newMsg = { role: 'model', parts: [{ text: botText }], isLocal: true };
        const finalHistory = [...history, newMsg];
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
    const updatedHistory = [
      ...messages, 
      { role: 'user', parts: [{ text: input }], isLocal: true }
    ];
    setMessages(updatedHistory); // Update local UI
    setInput('');
    onHistoryChange(updatedHistory); // Sync to bridge/socket
  };

  const renderContent = (text, isBot) => {
    return isBot && useMarkdown ? <div dangerouslySetInnerHTML={{ __html: marked.parse(text) }} /> : text;
  };

  return (
    <div className="fixed bottom-5 right-5 w-96 max-h-[600px] bg-white border rounded-2xl shadow-xl flex flex-col overflow-hidden z-[9999]">
      <div className="p-4 text-white font-bold flex justify-between bg-blue-600">
        <span>AI Assistant</span>
        {loading && <span className="text-xs animate-pulse italic">Thinking...</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
              {renderContent(m.parts[0].text, m.role === 'model')}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-white border-t flex gap-2">
        <input 
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()} 
        />
        <button onClick={handleSend} className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  );
}