'use client';

import { Question, QuestionType } from '../page';

interface QuestionCardProps {
  question: Question;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
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

export default function QuestionCard({
  question,
  index,
  isSelected,
  onToggleSelect,
}: QuestionCardProps) {
  const renderPreview = () => {
    if (question.type === 'rating') {
      return (
        <div className="flex gap-1 text-lg text-white/30">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n <= 3 ? 'text-amber-400' : ''}>
              ★
            </span>
          ))}
        </div>
      );
    }

    if (question.type === 'nps') {
      return (
        <div className="flex gap-1">
          {Array.from({ length: 11 }, (_, i) => (
            <span
              key={i}
              className="w-6 h-6 flex items-center justify-center text-xs font-semibold border border-border rounded text-muted-foreground"
            >
              {i}
            </span>
          ))}
        </div>
      );
    }

    if (question.opts && question.opts.length > 0) {
      const shown = question.opts.slice(0, 3);
      return (
        <div className="flex flex-wrap gap-1.5">
          {shown.map((opt, i) => (
            <div
              key={i}
              className="px-2.5 py-1 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground"
            >
              {opt}
            </div>
          ))}
          {question.opts.length > 3 && (
            <div className="px-2.5 py-1 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground">
              +{question.opts.length - 3} more
            </div>
          )}
        </div>
      );
    }

    if (question.type === 'text' || question.type === 'textarea') {
      return (
        <div className="px-2.5 py-1 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground italic">
          Text answer…
        </div>
      );
    }

    return null;
  };

  return (
    <div
      onClick={onToggleSelect}
      className={`p-4 border rounded-2xl cursor-pointer transition-all ${
        isSelected
            ? 'border-primary/40 bg-primary/5'
            : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Checkbox */}
        <div
          className={`w-5.5 h-5.5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-all ${
            isSelected
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-[1.5px] border-border text-muted-foreground'
          }`}
        >
          {isSelected ? '✓' : ''}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
              {index}
            </div>
            <div className="px-2 py-0.5 bg-muted/30 text-muted-foreground text-xs font-bold border border-border rounded">
              {TYPE_LABELS[question.type]}
            </div>
            {question.required && (
              <div className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/15 rounded">
                Required
              </div>
            )}
          </div>

          {/* Question Text */}
          <p className="text-sm font-semibold text-foreground mb-2 leading-relaxed">
            {question.text}
          </p>

          {/* Preview */}
          <div className="mt-2">{renderPreview()}</div>
        </div>
      </div>
    </div>
  );
}
