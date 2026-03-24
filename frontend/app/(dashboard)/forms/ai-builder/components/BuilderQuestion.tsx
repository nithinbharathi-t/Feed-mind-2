'use client';

import { Question, QuestionType } from '../page';

interface BuilderQuestionProps {
  question: Question;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  text: 'Short Text',
  textarea: 'Long Text',
  mc: 'Multiple Choice',
  checkbox: 'Checkboxes',
  rating: 'Star Rating',
  nps: 'NPS Score',
  yesno: 'Yes / No',
  dropdown: 'Dropdown',
};

export default function BuilderQuestion({
  question,
  index,
  isActive,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
}: BuilderQuestionProps) {
  const renderPreview = () => {
    if (question.type === 'text') {
      return (
        <input
          type="text"
          placeholder="Short answer…"
          disabled
          className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-muted-foreground text-sm pointer-events-none"
        />
      );
    }

    if (question.type === 'textarea') {
      return (
        <textarea
          placeholder="Long answer…"
          disabled
          className="w-full h-14 px-3 py-2 bg-muted/30 border border-border rounded-lg text-muted-foreground text-sm pointer-events-none resize-none"
        />
      );
    }

    if (question.type === 'rating') {
      return (
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`text-2xl ${n <= 3 ? 'text-amber-400' : 'text-white/20'}`}
            >
              ★
            </span>
          ))}
        </div>
      );
    }

    if (question.type === 'nps') {
      return (
        <>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 11 }, (_, i) => (
              <div
                key={i}
                className="w-7 h-7 flex items-center justify-center border border-border rounded text-xs font-semibold text-muted-foreground"
              >
                {i}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Not at all</span>
            <span>Extremely likely</span>
          </div>
        </>
      );
    }

    if (question.type === 'mc' || question.type === 'yesno') {
      const opts = question.opts.length ? question.opts : ['Option 1', 'Option 2'];
      return (
        <div className="space-y-2">
          {opts.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full border border-muted-foreground/50" />
              {opt}
            </div>
          ))}
        </div>
      );
    }

    if (question.type === 'checkbox') {
      const opts = question.opts.length ? question.opts : ['Option 1', 'Option 2'];
      return (
        <div className="space-y-2">
          {opts.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded border border-muted-foreground/50" />
              {opt}
            </div>
          ))}
        </div>
      );
    }

    if (question.type === 'dropdown') {
      const opts = question.opts.length ? question.opts : ['Option 1', 'Option 2'];
      return (
        <select
          disabled
          className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-muted-foreground text-sm pointer-events-none"
        >
          <option>Select an option</option>
          {opts.map((opt, i) => (
            <option key={i}>{opt}</option>
          ))}
        </select>
      );
    }

    return null;
  };

  return (
    <div
      onClick={onSelect}
      className={`p-5 border rounded-2xl cursor-pointer transition-all ${
        isActive
            ? 'border-primary/40 bg-primary/5'
            : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      <div className="flex items-start gap-2.5 mb-3">
        {/* Index */}
        <div className="w-5.5 h-5.5 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">
          {index}
        </div>

        {/* Question Text */}
        <input
          type="text"
          value={question.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Type your question…"
          className="flex-1 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        {/* Type Badge & Required */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {question.required && (
            <div className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" title="Required" />
          )}
          <div className="px-2 py-1 bg-muted/30 border border-border rounded text-xs font-bold text-muted-foreground">
            {TYPE_LABELS[question.type]}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mb-3 text-sm">{renderPreview()}</div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-border">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ required: !question.required });
          }}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted/30 border border-border rounded hover:border-primary/30 transition-all"
        >
          {question.required ? '⚑ Required' : '○ Optional'}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted/30 border border-border rounded hover:border-primary/30 transition-all"
        >
          📋 Duplicate
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMove(-1);
          }}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted/30 border border-border rounded hover:border-primary/30 transition-all"
        >
          ↑
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMove(1);
          }}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted/30 border border-border rounded hover:border-primary/30 transition-all"
        >
          ↓
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="px-2 py-1 ml-auto text-xs text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 rounded transition-all"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}
