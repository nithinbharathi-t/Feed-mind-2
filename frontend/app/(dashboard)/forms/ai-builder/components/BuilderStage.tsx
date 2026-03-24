'use client';

import { useState } from 'react';
import { Question, QuestionType } from '../page';
import BuilderQuestion from './BuilderQuestion';
import { Loader2 } from 'lucide-react';

interface BuilderStageProps {
  questions: Question[];
  onUpdateQuestions: (questions: Question[]) => void;
  formName: string;
  onSave: (data: any) => void;
  onPublish: (data: any) => void;
  showToast: (text: string, type: 'success' | 'error' | 'info' | 'ai') => void;
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

const QUESTION_TYPES = [
  { type: 'text' as QuestionType, icon: '📝', label: 'Short Text', desc: 'Single line' },
  { type: 'textarea' as QuestionType, icon: '📄', label: 'Long Text', desc: 'Multi-line' },
  { type: 'mc' as QuestionType, icon: '🔘', label: 'Multiple Choice', desc: 'Pick one' },
  { type: 'rating' as QuestionType, icon: '⭐', label: 'Star Rating', desc: '1–5 stars' },
  { type: 'nps' as QuestionType, icon: '📊', label: 'NPS Score', desc: '0–10 scale' },
  { type: 'yesno' as QuestionType, icon: '✅', label: 'Yes / No', desc: 'Binary choice' },
  { type: 'checkbox' as QuestionType, icon: '☑️', label: 'Checkboxes', desc: 'Pick multiple' },
  { type: 'dropdown' as QuestionType, icon: '📋', label: 'Dropdown', desc: 'Select list' },
];

export default function BuilderStage({
  questions,
  onUpdateQuestions,
  formName,
  onSave,
  onPublish,
  showToast,
}: BuilderStageProps) {
  const [title, setTitle] = useState(formName);
  const [description, setDescription] = useState(`Form with ${questions.length} questions`);
  const [selectedQId, setSelectedQId] = useState<string | null>(questions[0]?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [settings, setSettings] = useState({
    multipleResponses: true,
    collectEmail: false,
    progressBar: true,
    shuffleQuestions: false,
    botDetection: true,
    duplicateFilter: true,
    emailNotifications: true,
    slackWebhook: false,
  });

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onUpdateQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      )
    );
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `bq_${Date.now()}`,
      type,
      text: '',
      required: false,
      opts: getDefaultOpts(type),
    };
    const updated = [...questions, newQuestion];
    onUpdateQuestions(updated);
    setSelectedQId(newQuestion.id);
    setShowAddModal(false);
    showToast(TYPE_LABELS[type] + ' added', 'success');
  };

  const deleteQuestion = (id: string) => {
    const updated = questions.filter((q) => q.id !== id);
    onUpdateQuestions(updated);
    if (selectedQId === id) {
      setSelectedQId(updated[0]?.id || null);
    }
    showToast('Question removed', 'info');
  };

  const duplicateQuestion = (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (!question) return;

    const idx = questions.findIndex((q) => q.id === id);
    const clone: Question = {
      ...question,
      id: `bq_${Date.now()}`,
      text: question.text + ' (copy)',
    };
    const updated = [...questions.slice(0, idx + 1), clone, ...questions.slice(idx + 1)];
    onUpdateQuestions(updated);
    showToast('Question duplicated', 'success');
  };

  const moveQuestion = (id: string, direction: -1 | 1) => {
    const idx = questions.findIndex((q) => q.id === id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= questions.length) return;

    const updated = [...questions];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    onUpdateQuestions(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave({
        name: title || formName || 'Untitled Form',
        description,
        settings,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      onPublish({
        name: title || formName || 'Untitled Form',
        description,
        settings: { ...settings, published: true },
      });
    } finally {
      setIsSaving(false);
    }
  };

  function getDefaultOpts(type: QuestionType): string[] {
    if (type === 'mc') return ['Option 1', 'Option 2', 'Option 3'];
    if (type === 'checkbox') return ['Option 1', 'Option 2', 'Option 3'];
    if (type === 'yesno') return ['Yes', 'No'];
    if (type === 'dropdown') return ['Option 1', 'Option 2'];
    return [];
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="h-12 border-b border-border flex items-center px-5 gap-3 flex-shrink-0 bg-background/70 backdrop-blur">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Form title…"
          className="flex-1 bg-transparent font-['Syne'] font-bold text-sm tracking-tight text-foreground placeholder:text-muted-foreground border-b border-transparent focus:border-primary focus:outline-none px-0 py-1"
        />

        <div className="flex-1" />

        <div className="text-xs text-muted-foreground">
          {questions.length} question{questions.length !== 1 ? 's' : ''}
        </div>

        <button className="px-3 py-1.5 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg hover:bg-muted/30 transition-all">
          👁 Preview
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg hover:bg-muted/30 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : '💾 Save'}
        </button>

        <button
          onClick={handlePublish}
          disabled={isSaving}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : '🌐 Publish'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-7 flex flex-col items-center bg-background">
          {questions.length > 0 && (
            <div className="w-full max-w-2xl mb-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Form title…"
                className="w-full bg-transparent font-['Syne'] font-extrabold text-2xl tracking-tight text-foreground placeholder:text-muted-foreground border-b-2 border-border focus:border-primary focus:outline-none pb-1.5 mb-2"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description shown to respondents…"
                className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground border-b border-border focus:border-primary focus:outline-none pb-1"
              />
            </div>
          )}

          {/* Questions List */}
          <div className="w-full max-w-2xl space-y-2.5">
            {questions.map((question, index) => (
              <BuilderQuestion
                key={question.id}
                question={question}
                index={index + 1}
                isActive={selectedQId === question.id}
                onSelect={() => setSelectedQId(question.id)}
                onUpdate={(updates) => updateQuestion(question.id, updates)}
                onDelete={() => deleteQuestion(question.id)}
                onDuplicate={() => duplicateQuestion(question.id)}
                onMove={(dir) => moveQuestion(question.id, dir)}
              />
            ))}
          </div>

          {/* Add Question Button */}
          {questions.length > 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full max-w-2xl mt-6 py-3 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
              ＋ Add Question
            </button>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-68 flex-shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-14 px-4 border-b border-border flex items-center gap-2 flex-shrink-0">
            <div className="w-5.5 h-5.5 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              ✦
            </div>
            <div className="font-['Syne'] font-bold text-sm">Form Settings</div>
          </div>

          {/* Sections */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-5 text-sm">
            {/* Respondents */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Respondents</div>
              <div className="space-y-3">
                {[
                  { key: 'multipleResponses', label: 'Multiple responses' },
                  { key: 'collectEmail', label: 'Collect email' },
                  { key: 'progressBar', label: 'Show progress bar' },
                  { key: 'shuffleQuestions', label: 'Shuffle questions' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          [item.key]: !settings[item.key as keyof typeof settings],
                        })
                      }
                      className={`w-9 h-5 rounded-full relative transition-colors ${
                        settings[item.key as keyof typeof settings]
                            ? 'bg-primary'
                            : 'bg-muted'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          settings[item.key as keyof typeof settings]
                            ? 'translate-x-4'
                            : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Spam Protection */}
            <div className="pt-2 border-t border-border">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Spam Protection</div>
              <div className="space-y-3">
                {[
                  { key: 'botDetection', label: 'Bot detection' },
                  { key: 'duplicateFilter', label: 'Duplicate filter' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          [item.key]: !settings[item.key as keyof typeof settings],
                        })
                      }
                      className={`w-9 h-5 rounded-full relative transition-colors ${
                        settings[item.key as keyof typeof settings]
                            ? 'bg-primary'
                            : 'bg-muted'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          settings[item.key as keyof typeof settings]
                            ? 'translate-x-4'
                            : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="pt-2 border-t border-border">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Notifications</div>
              <div className="space-y-3">
                {[
                  { key: 'emailNotifications', label: 'Email on submit' },
                  { key: 'slackWebhook', label: 'Slack webhook' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          [item.key]: !settings[item.key as keyof typeof settings],
                        })
                      }
                      className={`w-9 h-5 rounded-full relative transition-colors ${
                        settings[item.key as keyof typeof settings]
                            ? 'bg-primary'
                            : 'bg-muted'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          settings[item.key as keyof typeof settings]
                            ? 'translate-x-4'
                            : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-border flex flex-col gap-2 flex-shrink-0">
            <div className="text-xs text-muted-foreground">
              Draft · {questions.length} question{questions.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={handlePublish}
              disabled={isSaving}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 text-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : '🌐 Publish Form'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-background/85 backdrop-blur-lg z-50 flex items-center justify-center p-5"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-card border border-border rounded-3xl p-7 w-full max-w-sm max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <h3 className="font-['Syne'] font-bold text-lg tracking-tight">Add Question</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xl text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {QUESTION_TYPES.map((qt) => (
                <button
                  key={qt.type}
                  onClick={() => addQuestion(qt.type)}
                  className="p-3 bg-muted/30 border border-border hover:border-primary/35 hover:bg-primary/5 rounded-2xl transition-all cursor-pointer text-left"
                >
                  <div className="text-2xl mb-2">{qt.icon}</div>
                  <div className="font-semibold text-sm text-foreground">{qt.label}</div>
                  <div className="text-xs text-muted-foreground">{qt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
