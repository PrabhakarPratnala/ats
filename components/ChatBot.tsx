import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Minimize2, Bot, Sparkles, Trash2, RefreshCw } from 'lucide-react';
import { createChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I\'m your AI career assistant. I can help you tailor your resume, write cover letters, or answer interview questions. How can I help today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session on mount
    startNewSession();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change or chat opens
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen, isLoading]);

  const startNewSession = () => {
    try {
      chatSessionRef.current = createChatSession();
    } catch (e) {
      console.error("Failed to init chat session", e);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Start a new conversation? This will clear current history.")) {
      setMessages([{ role: 'model', text: 'Conversation reset. What would you like to discuss next?' }]);
      startNewSession();
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Safety check: Re-init session if missing
    if (!chatSessionRef.current) {
        startNewSession();
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) throw new Error("Chat session not initialized");

      const response = await chatSessionRef.current.sendMessageStream({ message: userMessage });
      
      // Add placeholder for model response
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      let fullText = '';
      for await (const chunk of response) {
         const c = chunk as GenerateContentResponse;
         if (c.text) {
             fullText += c.text;
             setMessages(prev => {
                 const newMessages = [...prev];
                 const lastMsg = newMessages[newMessages.length - 1];
                 // Ensure we update the last model message
                 if (lastMsg.role === 'model') {
                    lastMsg.text = fullText;
                 }
                 return newMessages;
             });
         }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an connection error. Please try again.' }]);
      // Try to recover session
      startNewSession();
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] flex flex-col items-end print:hidden font-sans">
      {isOpen && (
        <div className="bg-[#1e293b]/95 backdrop-blur-xl w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden mb-4 animate-scaleIn origin-bottom-right ring-1 ring-black/40">
          {/* Header */}
          <div className="p-4 bg-indigo-600/90 backdrop-blur-md flex justify-between items-center text-white shadow-lg z-10 border-b border-indigo-500/50">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-white/20 rounded-xl shadow-inner">
                 <Bot size={20} className="text-white" />
               </div>
               <div>
                 <span className="font-bold text-sm block tracking-wide">Resume Architect AI</span>
                 <span className="text-[10px] text-indigo-100 flex items-center gap-1 opacity-90"><Sparkles size={8} /> Powered by Gemini 3.0</span>
               </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleClearChat} 
                className="hover:bg-white/10 p-2 rounded-lg transition-colors text-indigo-100 hover:text-white"
                title="Clear Chat"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/10 p-2 rounded-lg transition-colors text-indigo-100 hover:text-white"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#0f172a]/50 custom-scrollbar scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn group`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-md transition-all ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-[#1e293b] text-slate-200 rounded-bl-none border border-slate-700/60 ring-1 ring-white/5'
                  }`}
                >
                  <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert text-white' : 'prose-invert text-slate-200'} prose-p:leading-relaxed prose-p:my-1 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-inherit`}>
                    <ReactMarkdown
                      components={{
                        a: ({node, ...props}) => <a {...props} className="text-indigo-300 underline hover:text-indigo-200" target="_blank" rel="noopener noreferrer" />,
                        code: ({node, ...props}) => <code {...props} className="bg-black/30 px-1 py-0.5 rounded font-mono text-[0.9em]" />,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
               <div className="flex justify-start animate-fadeIn">
                 <div className="bg-[#1e293b] rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700/60 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-indigo-400" />
                    <span className="text-xs text-slate-400 font-medium">Thinking...</span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#1e293b] border-t border-white/5 backdrop-blur-xl">
             <div className="relative flex items-end bg-[#0f172a] rounded-xl border border-slate-700/60 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me how to improve your resume..."
                  className="w-full bg-transparent text-sm text-white px-4 py-3.5 outline-none placeholder:text-slate-500 resize-none max-h-[100px] custom-scrollbar"
                  disabled={isLoading}
                  rows={1}
                  style={{ minHeight: '46px' }}
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="mb-1.5 mr-1.5 p-2 text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all disabled:opacity-50 disabled:bg-transparent disabled:text-slate-500 shadow-lg shadow-indigo-500/20 disabled:shadow-none"
                >
                  <Send size={16} strokeWidth={2.5} />
                </button>
             </div>
             <div className="text-[10px] text-center text-slate-600 mt-2 font-medium">
               AI can make mistakes. Please double check important info.
             </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-600/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/10 z-[100]"
        aria-label="Toggle Chat"
      >
        {isOpen ? (
            <Minimize2 size={24} className="transition-transform duration-300 group-hover:rotate-90" />
        ) : (
            <div className="relative">
                <MessageCircle size={28} className="transition-transform duration-300" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-400 border-2 border-[#0f172a]"></span>
                </span>
            </div>
        )}
      </button>
    </div>
  );
};

export default ChatBot;