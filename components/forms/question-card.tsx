"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Trash2,
  Copy,
  Plus,
  X,
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ChevronDown,
  Star,
  Hash,
  Calendar,
  Upload,
  SlidersHorizontal,
  ToggleLeft,
  Circle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const questionTypes = [
  { value: "SHORT_TEXT", label: "Short Text" },
  { value: "LONG_TEXT", label: "Long Text" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "RATING", label: "Rating" },
  { value: "NPS", label: "NPS (0-10)" },
  { value: "DATE", label: "Date" },
  { value: "FILE_UPLOAD", label: "File Upload" },
  { value: "LINEAR_SCALE", label: "Linear Scale" },
  { value: "YES_NO", label: "Yes/No" },
];

const typeIcons: Record<string, React.FC<{ className?: string }>> = {
  SHORT_TEXT: Type,
  LONG_TEXT: AlignLeft,
  MULTIPLE_CHOICE: CircleDot,
  CHECKBOX: CheckSquare,
  DROPDOWN: ChevronDown,
  RATING: Star,
  NPS: Hash,
  DATE: Calendar,
  FILE_UPLOAD: Upload,
  LINEAR_SCALE: SlidersHorizontal,
  YES_NO: ToggleLeft,
};

const optionTypes = ["MULTIPLE_CHOICE", "CHECKBOX", "DROPDOWN"];

interface QuestionCardProps {
  question: {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    aiGenerated: boolean;
  };
  index: number;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  dragHandleProps?: any;
}

export function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  dragHandleProps,
}: QuestionCardProps) {
  const [newOption, setNewOption] = useState("");
  const hasOptions = optionTypes.includes(question.type);
  const TypeIcon = typeIcons[question.type] || Type;

  const addNewOption = () => {
    if (!newOption.trim()) return;
    onUpdate(question.id, { options: [...(question.options || []), newOption.trim()] });
    setNewOption("");
  };

  const updateOption = (idx: number, value: string) => {
    const opts = [...(question.options || [])];
    opts[idx] = value;
    onUpdate(question.id, { options: opts });
  };

  const removeOption = (idx: number) => {
    onUpdate(question.id, { options: (question.options || []).filter((_, i) => i !== idx) });
  };

  const duplicateOption = (idx: number) => {
    const opts = [...(question.options || [])];
    opts.splice(idx + 1, 0, opts[idx]);
    onUpdate(question.id, { options: opts });
  };

  const moveOption = (idx: number, dir: -1 | 1) => {
    const opts = [...(question.options || [])];
    const target = idx + dir;
    if (target < 0 || target >= opts.length) return;
    [opts[idx], opts[target]] = [opts[target], opts[idx]];
    onUpdate(question.id, { options: opts });
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* ── Top toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/30">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Type select */}
        <Select
          value={question.type}
          onValueChange={(v) => onUpdate(question.id, { type: v })}
        >
          <SelectTrigger className="w-auto h-8 gap-1.5 pl-2.5 pr-2 text-sm border-border bg-background">
            <TypeIcon className="h-3.5 w-3.5 text-[#6467f2] shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {questionTypes.map((qt) => (
              <SelectItem key={qt.value} value={qt.value}>
                {qt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add Others — only for option-based types */}
        {hasOptions && (
          <button
            onClick={() => {
              if (!(question.options || []).includes("__other__"))
                onUpdate(question.id, { options: [...(question.options || []), "__other__"] });
            }}
            disabled={(question.options || []).includes("__other__")}
            className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3 w-3" /> Add Others
          </button>
        )}

        <div className="flex-1" />

        {/* Required toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Required</span>
          <Switch
            checked={question.required}
            onCheckedChange={(c) => onUpdate(question.id, { required: c })}
          />
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Duplicate */}
        {onDuplicate && (
          <button
            onClick={() => onDuplicate(question.id)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(question.id)}
          className="rounded-md p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="px-5 py-4 space-y-3">
        {/* Question text */}
        <div className="flex items-start gap-2">
          <span className="text-sm font-bold text-[#6467f2] shrink-0 pt-1">
            {index + 1}.
          </span>
          <input
            value={question.label}
            onChange={(e) => onUpdate(question.id, { label: e.target.value })}
            placeholder="Write a question..."
            className="flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/40 border-b border-border pb-1.5 focus:border-primary transition-colors"
          />
        </div>

        {/* Options list */}
        {hasOptions && (
          <div className="ml-5 space-y-1.5 pt-1">
            {(question.options || []).map((opt, idx) =>
              opt === "__other__" ? (
                <div key={idx} className="group relative flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 hover:border-border/80 transition-colors min-h-[2.25rem]">
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="flex-1 text-sm text-muted-foreground italic">Others</span>
                  <div className="absolute right-2 inset-y-0 hidden group-hover:flex items-center gap-0.5 bg-background pl-2">
                    <button
                      onClick={() => removeOption(idx)}
                      className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div key={idx} className="group relative flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 hover:border-border/80 transition-colors min-h-[2.25rem]">
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <input
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30"
                  />
                  {/* Hover actions — absolute overlay, no layout shift */}
                  <div className="absolute right-2 inset-y-0 hidden group-hover:flex items-center gap-0.5 bg-background pl-2">
                    <button
                      onClick={() => duplicateOption(idx)}
                      className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => moveOption(idx, -1)}
                      disabled={idx === 0}
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveOption(idx, 1)}
                      disabled={idx === (question.options || []).length - 1}
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeOption(idx)}
                      className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Inline add option */}
            <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border/50 bg-transparent px-3 py-1.5 hover:border-border transition-colors cursor-text">
              <Circle className="h-3.5 w-3.5 text-muted-foreground/20 shrink-0" />
              <input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNewOption();
                  }
                }}
                onBlur={addNewOption}
                placeholder="Add option..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/25"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
