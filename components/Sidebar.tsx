'use client';

import React, { useState } from 'react';
import { Upload, Plus, FileText, ChevronLeft, ChevronRight, MessageSquare, Briefcase, Linkedin } from 'lucide-react';
import { KnowledgeBaseEntry } from '@/lib/types';

interface SidebarProps {
  onFileUpload: (file: File) => void;
  knowledgeBase: KnowledgeBaseEntry[];
  onPromptClick: (prompt: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onFileUpload, knowledgeBase, onPromptClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const quickPrompts = [
    { icon: <Briefcase className="w-4 h-4" />, text: "Find 50 SaaS companies in Europe" },
    { icon: <FileText className="w-4 h-4" />, text: "Write a proposal for a Fintech redesign" },
    { icon: <Linkedin className="w-4 h-4" />, text: "Post about AI in Sales trends" },
  ];

  return (
    <div className={`h-screen bg-slate-900 border-r border-slate-700 transition-all duration-300 relative ${isCollapsed ? 'w-16' : 'w-72'}`}>
      <div className="flex flex-col h-full p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">SalesCo-Pilot</h1>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-slate-800 rounded">
            {isCollapsed ? <ChevronRight className="w-5 h-5 text-slate-400" /> : <ChevronLeft className="w-5 h-5 text-slate-400" />}
          </button>
        </div>

        <div className="mb-8">
          <label className={`flex items-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
            <Upload className="w-5 h-5 text-white" />
            {!isCollapsed && <span className="text-white font-medium">Add Knowledge</span>}
            <input type="file" className="hidden" onChange={(e) => e.target.files && onFileUpload(e.target.files[0])} accept=".pdf,.txt,.csv" />
          </label>
        </div>

        {!isCollapsed && (
          <>
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Quick Prompts</h2>
              <div className="space-y-2">
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => onPromptClick(p.text)}
                    className="flex items-center gap-3 w-full p-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-md transition-colors text-left"
                  >
                    {p.icon}
                    <span className="truncate">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Knowledge Base</h2>
              <div className="space-y-2">
                {knowledgeBase.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No documents uploaded yet.</p>
                ) : (
                  knowledgeBase.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 text-sm text-slate-400 bg-slate-800/50 rounded-md">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
