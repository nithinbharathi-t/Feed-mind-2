'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PromptStage from '../../ai-builder/components/PromptStage';
import ReviewStage from '../../ai-builder/components/ReviewStage';
import BuilderStage from '../../ai-builder/components/BuilderStage';
import StepIndicator from '../../ai-builder/components/StepIndicator';
import Toast from '../../ai-builder/components/Toast';


export type QuestionType = 'text' | 'textarea' | 'mc' | 'checkbox' | 'rating' | 'nps' | 'yesno' | 'dropdown';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  opts: string[];
}

export type Stage = 1 | 2 | 3;

export default function AIFormBuilderPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(1);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [builderQuestions, setBuilderQuestions] = useState<Question[]>([]);
  const [currentFormName, setCurrentFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'ai' } | null>(null);
  const [promptData, setPromptData] = useState({
    prompt: '',
    count: '5',
    tone: 'Friendly & casual',
    audience: 'General public',
    language: 'English',
    extras: ['NPS Score', 'Star Ratings', 'Multiple choice'],
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' | 'ai' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGenerateQuestions = (questions: Question[], name: string, data: any) => {
    setGeneratedQuestions(questions);
    setCurrentFormName(name);
    setPromptData(data);
    setSelectedIds(new Set());
    setStage(2);
    showToast(`${questions.length} questions generated ✦`, 'ai');
  };

  const handleAcceptQuestions = (selected: Question[]) => {
    setBuilderQuestions(selected.map((q, i) => ({
      ...q,
      id: `bq_${Date.now()}_${i}`,
    })));
    setFormDescription(selected.length > 0 ? `Form with ${selected.length} questions` : '');
    setStage(3);
    showToast(`${selected.length} question${selected.length !== 1 ? 's' : ''} added to your form ✦`, 'ai');
  };

  const handleSaveForm = async (formData: any) => {
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || currentFormName || 'Untitled Form',
          description: formData.description || formDescription,
          questions: builderQuestions,
          settings: formData.settings,
        }),
      });

      if (response.ok) {
        const form = await response.json();
        showToast(`"${formData.name}" saved!`, 'success');
        setTimeout(() => {
          router.push(`/forms/${form.id}/edit`);
        }, 1000);
      } else {
        showToast('Failed to save form', 'error');
      }
    } catch (error) {
      showToast('Error saving form', 'error');
      console.error(error);
    }
  };

  const handlePublishForm = async (formData: any) => {
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || currentFormName || 'Untitled Form',
          description: formData.description || formDescription,
          questions: builderQuestions,
          settings: { ...formData.settings, published: true },
        }),
      });

      if (response.ok) {
        const form = await response.json();
        showToast('Form published! 🎉', 'success');
        setTimeout(() => {
          router.push(`/forms/${form.id}/responses`);
        }, 1000);
      } else {
        showToast('Failed to publish form', 'error');
      }
    } catch (error) {
      showToast('Error publishing form', 'error');
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <div className="h-14 bg-background/90 backdrop-blur-lg border-b border-border flex items-center px-7 gap-3 sticky top-0 z-50">
        <span className="text-sm text-muted-foreground">
          My Forms <span className="text-muted-foreground/70">→</span> <strong className="text-foreground">AI Form Builder</strong>
        </span>
        <div className="flex-1" />
        <StepIndicator currentStep={stage} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {stage === 1 && (
          <PromptStage 
            onGenerate={handleGenerateQuestions}
            showToast={showToast}
          />
        )}
        
        {stage === 2 && (
          <ReviewStage
            generatedQuestions={generatedQuestions}
            selectedIds={selectedIds}
            onSelectToggle={(id) => {
              const newSet = new Set(selectedIds);
              if (newSet.has(id)) newSet.delete(id);
              else newSet.add(id);
              setSelectedIds(newSet);
            }}
            onSelectAll={() => {
              setSelectedIds(new Set(generatedQuestions.map(q => q.id)));
            }}
            onAccept={() => {
              const selected = generatedQuestions.filter(q => selectedIds.has(q.id));
              handleAcceptQuestions(selected);
            }}
            onBack={() => setStage(1)}
            promptData={promptData}
            formName={currentFormName}
          />
        )}

        {stage === 3 && (
          <BuilderStage
            questions={builderQuestions}
            onUpdateQuestions={setBuilderQuestions}
            formName={currentFormName}
            onSave={handleSaveForm}
            onPublish={handlePublishForm}
            showToast={showToast}
          />
        )}
      </div>

      {/* Toast Notifications */}
      {toastMessage && (
        <Toast 
          message={toastMessage.text}
          type={toastMessage.type}
        />
      )}
    </div>
  );
}
