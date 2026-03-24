'use client';

import { Question } from '../page';
import QuestionCard from './QuestionCard';
import { useMemo } from 'react';

interface ReviewStageProps {
  generatedQuestions: Question[];
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onSelectAll: () => void;
  onAccept: () => void;
  onBack: () => void;
  promptData: any;
  formName: string;
}

export default function ReviewStage({
  generatedQuestions,
  selectedIds,
  onSelectToggle,
  onSelectAll,
  onAccept,
  onBack,
  promptData,
  formName,
}: ReviewStageProps) {
  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);
  const totalCount = generatedQuestions.length;

  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      {/* LEFT: Recap Panel */}
      <div className="w-80 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex-shrink-0">
          <h3 className="font-['Syne'] font-bold text-sm tracking-tight mb-0.5">Your prompt</h3>
          <p className="text-xs text-muted-foreground">AI generated these questions based on your input</p>
        </div>

        {/* Scroll Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Prompt Block */}
          <div className="bg-muted/30 border border-border rounded-2xl p-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Prompt</div>
            <p className="text-sm text-foreground/80 leading-relaxed">{promptData.prompt}</p>
          </div>

          {/* Settings Tags */}
          <div className="bg-muted/30 border border-border rounded-2xl p-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Settings</div>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded-full text-xs font-semibold">
                {promptData.count} questions
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded-full text-xs font-semibold">
                {promptData.tone}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded-full text-xs font-semibold">
                {promptData.audience}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded-full text-xs font-semibold">
                {promptData.language}
              </span>
            </div>
          </div>

          {/* Included Types */}
          <div className="bg-muted/30 border border-border rounded-2xl p-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Included types</div>
            <div className="flex flex-wrap gap-1.5">
              {promptData.extras.map((extra: string) => (
                <span
                  key={extra}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded-full text-xs font-semibold"
                >
                  {extra}
                </span>
              ))}
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={onBack}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
          >
            <span>✏</span>
            <span>Edit prompt & regenerate</span>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3.5 flex flex-col gap-2 flex-shrink-0">
          <div className="text-xs text-muted-foreground text-center">
            {selectedCount} of {totalCount} question{totalCount !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={onAccept}
            disabled={selectedCount === 0}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none text-sm"
          >
            <span>✓</span>
            <span>
              Add {selectedCount > 0 ? selectedCount : 'selected'} question{selectedCount !== 1 ? 's' : ''} to form
            </span>
          </button>
          <button
            onClick={onSelectAll}
            className="w-full py-2 border border-border text-muted-foreground hover:text-foreground font-semibold rounded-lg text-sm hover:bg-muted/30 transition-all"
          >
            Select all
          </button>
        </div>
      </div>

      {/* RIGHT: Generated Questions */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-border px-6 flex items-center justify-between flex-shrink-0 bg-background/70 backdrop-blur">
          <div>
            <h2 className="font-['Syne'] font-bold text-sm tracking-tight">
              {totalCount} questions generated
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Select the ones you want — or accept all</p>
          </div>
        </div>

        {/* Questions Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {generatedQuestions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index + 1}
              isSelected={selectedIds.has(question.id)}
              onToggleSelect={() => onSelectToggle(question.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
