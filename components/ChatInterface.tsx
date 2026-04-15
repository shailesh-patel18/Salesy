'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Send, Copy, RotateCcw, Trash2, User, Bot, Loader2, Download, Table } from 'lucide-react';
import { DataTable } from './DataTable';
import { KnowledgeBaseEntry } from '@/lib/types';
import { downloadCSV } from '@/lib/utils/csv';

interface ChatInterfaceProps {
  knowledgeBase: KnowledgeBaseEntry[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ knowledgeBase }) => {
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [lastBatchResult, setLastBatchResult] = useState<any[] | null>(null);

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, reload, stop, setMessages } = useChat({
    api: '/api/chat',
    body: {
      knowledgeBase: knowledgeBase.map(kb => kb.content).join('\n\n'),
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleSetInput = (e: any) => {
      setInput(e.detail);
      // We force a microtask to ensure state is updated
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) form.requestSubmit();
      }, 50);
    };

    window.addEventListener('set-chat-input', (handleSetInput as any));
    return () => window.removeEventListener('set-chat-input', (handleSetInput as any));
  }, [setInput]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const deleteMessage = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  const renderToolResult = (toolInvocation: any) => {
    if (!toolInvocation.result) return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;

    const { leads, jobs, research } = toolInvocation.result;

    if (leads) {
      return (
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Table className="w-4 h-4" /> Found {leads.length} leads
            </h3>
            <button
              onClick={() => downloadCSV(leads, 'leads_export.csv')}
              className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300"
            >
              <Download className="w-3 h-3" /> Download CSV
            </button>
          </div>
          <DataTable data={leads.slice(0, 5)} columns={['company', 'name', 'title', 'employees']} />
          {leads.length > 5 && <p className="text-xs text-slate-500 mt-2 italic text-center">Previewing top 5 results. Download CSV for all {leads.length} rows.</p>}
        </div>
      );
    }

    if (jobs) {
      return (
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Table className="w-4 h-4" /> Relevant Opportunities
            </h3>
          </div>
          <DataTable data={jobs.slice(0, 5)} columns={['title', 'company', 'location', 'type']} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/20 glassmorphism">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
            <Bot className="w-12 h-12 text-slate-700 opacity-50" />
            <p className="text-lg font-medium text-slate-600">How can I help you today?</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] group relative ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-3' : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-700 shadow-xl'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="flex-1 prose prose-invert prose-sm max-w-none">
                  {m.content}
                </div>
              </div>

              {m.role === 'assistant' && (
                <div className="mt-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyToClipboard(m.content)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => reload()} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteMessage(m.id)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              )}

              {m.toolInvocations?.map((ti: any) => (
                <div key={ti.toolCallId}>
                  {renderToolResult(ti)}
                </div>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700 animate-pulse flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="text-sm text-slate-400">Assistant is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900 border-t border-slate-800 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex gap-4 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder="Ask anything (e.g. 'Find 20 design agencies in New York')"
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 rounded-xl text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
