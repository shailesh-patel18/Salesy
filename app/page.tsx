'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { KnowledgeBaseEntry } from '@/lib/types';
import { parseCSV } from '@/lib/utils/csv';
import { ProgressIndicator } from '@/components/ProgressIndicator';

export default function SalesCoPilot() {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  const handleFileUpload = async (file: File) => {
    if (file.name.endsWith('.csv')) {
      const data = await parseCSV(file);
      
      // If it's a batch personalization CSV (has specific columns)
      if (data[0] && ('Name' in data[0] || 'Company' in data[0])) {
        // Limit to 10 rows for safety
        const subset = data.slice(0, 10);
        setIsBatchProcessing(true);
        setBatchProgress({ current: 0, total: subset.length });
        
        try {
          const response = await fetch('/api/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: subset }),
          });
          const data = await response.json();
          const results = data.results || subset.map((r: any) => ({ ...r, personalized_message: "Demo message generated!" }));
          setKnowledgeBase(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            title: `Batch: ${file.name}`,
            content: `Processed batch of ${results.length} contacts (SIMULATED).`,
            type: 'csv'
          }]);
        } catch (error) {
          console.error("Batch failed", error);
        } finally {
          setIsBatchProcessing(false);
        }
        return;
      }
    }

    // Default: Add to knowledge base as text
    const text = await file.text();
    const newEntry: KnowledgeBaseEntry = {
      id: Math.random().toString(36).substr(2, 9),
      title: file.name,
      content: text,
      type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.csv') ? 'csv' : 'text',
    };
    setKnowledgeBase(prev => [...prev, newEntry]);
  };

  const handlePromptClick = (prompt: string) => {
    // In a real app, this would set the chat input and trigger submit.
    // For now, we'll let ChatInterface handle its own state, but we could sync it here.
    const event = new CustomEvent('set-chat-input', { detail: prompt });
    window.dispatchEvent(event);
  };

  return (
    <main className="flex h-screen w-full bg-slate-950 overflow-hidden">
      <Sidebar 
        onFileUpload={handleFileUpload} 
        knowledgeBase={knowledgeBase} 
        onPromptClick={handlePromptClick}
      />
      
      <div className="flex-1 flex flex-col relative">
        <ChatInterface knowledgeBase={knowledgeBase} />
        
        {isBatchProcessing && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="max-w-md w-full">
              <ProgressIndicator 
                current={batchProgress.current} 
                total={batchProgress.total} 
                status="Personalizing LinkedIn messages..."
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
