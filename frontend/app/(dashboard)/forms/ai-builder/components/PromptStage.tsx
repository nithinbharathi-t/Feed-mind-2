'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Question, QuestionType } from '../page';
import TemplateChips from './TemplateChips';

interface PromptStageProps {
  onGenerate: (questions: Question[], formName: string, data: any) => void;
  showToast: (text: string, type: 'success' | 'error' | 'info' | 'ai') => void;
}

const TEMPLATE_QUESTIONS = {
  coffee: {
    name: 'Coffee Shop Feedback',
    prompt: 'Customer satisfaction survey for a coffee shop. Coffee quality, service speed, atmosphere, recommendation.',
    questions: [
      { type: 'rating' as QuestionType, text: 'How would you rate the quality of our coffee?', required: true, opts: [] },
      { type: 'rating' as QuestionType, text: 'How would you rate your overall experience today?', required: true, opts: [] },
      { type: 'mc' as QuestionType, text: 'What did you enjoy most about your visit?', required: false, opts: ['Coffee quality', 'Friendly staff', 'Cosy atmosphere', 'Speed of service', 'Food selection'] },
      { type: 'rating' as QuestionType, text: 'How would you rate the speed of service?', required: true, opts: [] },
      { type: 'nps' as QuestionType, text: 'How likely are you to recommend us to a friend or colleague?', required: false, opts: [] },
      { type: 'yesno' as QuestionType, text: 'Would you visit us again?', required: false, opts: ['Yes, definitely!', 'Maybe', 'No, probably not'] },
      { type: 'textarea' as QuestionType, text: "Anything else you'd like to share with us?", required: false, opts: [] },
    ]
  },
  product: {
    name: 'Product Feedback Survey',
    prompt: 'Software product feedback form. Include feature usefulness, pain points, NPS, and improvement suggestions.',
    questions: [
      { type: 'rating' as QuestionType, text: 'How satisfied are you with the product overall?', required: true, opts: [] },
      { type: 'checkbox' as QuestionType, text: 'Which features do you use most?', required: false, opts: ['Dashboard', 'Analytics', 'Integrations', 'AI features', 'API', 'Reports'] },
      { type: 'mc' as QuestionType, text: 'What is your biggest pain point?', required: false, opts: ['Too complex', 'Missing features', 'Performance', 'Pricing', 'Support'] },
      { type: 'nps' as QuestionType, text: 'How likely are you to recommend this product?', required: true, opts: [] },
      { type: 'textarea' as QuestionType, text: 'What one feature would you most like to see built?', required: false, opts: [] },
    ]
  },
  event: {
    name: 'Event Feedback Form',
    prompt: 'Post-event feedback survey for a conference. Overall satisfaction, highlights, organisation, NPS.',
    questions: [
      { type: 'rating' as QuestionType, text: 'How would you rate this event overall?', required: true, opts: [] },
      { type: 'mc' as QuestionType, text: 'What was the highlight of the event for you?', required: false, opts: ['Keynote speakers', 'Networking', 'Workshops', 'Exhibition floor', 'Food & venue'] },
      { type: 'rating' as QuestionType, text: 'How would you rate the event organisation?', required: true, opts: [] },
      { type: 'yesno' as QuestionType, text: 'Would you attend this event again next year?', required: false, opts: ['Absolutely yes!', 'Possibly', 'No'] },
      { type: 'nps' as QuestionType, text: 'How likely are you to recommend this event to a colleague?', required: false, opts: [] },
      { type: 'textarea' as QuestionType, text: 'What could we do to improve for next year?', required: false, opts: [] },
    ]
  },
  employee: {
    name: 'Employee Engagement Survey',
    prompt: 'Employee satisfaction and engagement survey. Role satisfaction, team collaboration, career growth, NPS.',
    questions: [
      { type: 'rating' as QuestionType, text: 'How satisfied are you with your current role?', required: true, opts: [] },
      { type: 'rating' as QuestionType, text: 'How would you rate team collaboration?', required: true, opts: [] },
      { type: 'mc' as QuestionType, text: 'Which area needs the most improvement?', required: false, opts: ['Communication', 'Career growth', 'Work-life balance', 'Compensation', 'Tools & resources'] },
      { type: 'yesno' as QuestionType, text: 'Do you feel your contributions are recognised?', required: false, opts: ['Yes, consistently', 'Sometimes', 'Rarely'] },
      { type: 'nps' as QuestionType, text: 'How likely are you to recommend this company as a great place to work?', required: true, opts: [] },
      { type: 'textarea' as QuestionType, text: 'What would most improve your experience at work?', required: false, opts: [] },
    ]
  },
};

export default function PromptStage({ onGenerate, showToast }: PromptStageProps) {
  const [prompt, setPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState('5');
  const [tone, setTone] = useState('Friendly & casual');
  const [audience, setAudience] = useState('General public');
  const [language, setLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Please describe your form first', 'error');
      return;
    }

    setIsLoading(true);
    
    // Simulate AI generation with template matching
    setTimeout(() => {
      const lp = prompt.toLowerCase();
      let template: any = null;

      if (lp.includes('coffee') || lp.includes('cafe')) {
        template = TEMPLATE_QUESTIONS.coffee;
      } else if (lp.includes('product') || lp.includes('software')) {
        template = TEMPLATE_QUESTIONS.product;
      } else if (lp.includes('event') || lp.includes('conference')) {
        template = TEMPLATE_QUESTIONS.event;
      } else if (lp.includes('employee') || lp.includes('staff')) {
        template = TEMPLATE_QUESTIONS.employee;
      } else {
        template = {
          name: prompt.split(' ').slice(0, 4).join(' ') + ' Form',
          questions: [
            { type: 'rating' as QuestionType, text: 'How satisfied are you overall?', required: true, opts: [] },
            { type: 'mc' as QuestionType, text: 'What aspect was most important to you?', required: false, opts: ['Quality', 'Speed', 'Value', 'Support', 'Experience'] },
            { type: 'nps' as QuestionType, text: 'How likely are you to recommend us? (0–10)', required: false, opts: [] },
            { type: 'yesno' as QuestionType, text: 'Would you choose us again?', required: false, opts: ['Yes, absolutely', 'Maybe', 'No'] },
            { type: 'textarea' as QuestionType, text: 'Any additional comments or suggestions?', required: false, opts: [] },
          ]
        };
      }

      const questionsWithIds = template.questions.map((q: any, i: number) => ({
        ...q,
        id: `gq_${Date.now()}_${i}`,
        opts: q.opts.length ? q.opts : getDefaultOpts(q.type),
      }));

      onGenerate(questionsWithIds, template.name, {
        prompt,
        count: questionCount,
        tone,
        audience,
        language,
        extras: [],
      });

      setIsLoading(false);
    }, 800);
  };

  const handleTemplateSelect = (key: string) => {
    const template = TEMPLATE_QUESTIONS[key as keyof typeof TEMPLATE_QUESTIONS];
    if (template) {
      setPrompt(template.prompt);
      showToast(`"${template.name}" template loaded`, 'info');
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
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-10">
      <div className="w-full max-w-2xl">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-[18px] h-0.5 bg-primary"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">AI Form Builder</p>
        </div>

        {/* Title */}
        <h1 className="font-['Syne'] font-extrabold text-4xl leading-tight mb-1.5 tracking-tight">
          What kind of form<br />
          do you want to <span className="text-primary">build?</span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-base mb-7 leading-relaxed">
          Describe your form in plain English. The more detail you give, the better the questions.
        </p>

        {/* Prompt Card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span className="text-primary font-mono">{'>'}</span>
            Describe your form
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Customer satisfaction survey for a coffee shop. I want to know about coffee quality, service speed, atmosphere, and whether they'd recommend us. Keep it friendly and brief."
            className="w-full min-h-[100px] max-h-[160px] p-3 bg-muted/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm font-medium focus:border-primary/35 focus:outline-none resize-vertical"
          />

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Number of questions</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-foreground text-sm focus:border-primary/30 focus:outline-none appearance-none bg-right"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5 4.5-5z' fill='%234c5476'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  paddingRight: '28px',
                }}
              >
                <option value="3">3 — Quick check-in</option>
                <option value="5">5 — Standard</option>
                <option value="8">8 — Detailed</option>
                <option value="12">12 — Comprehensive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Tone & style</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-foreground text-sm focus:border-primary/30 focus:outline-none appearance-none bg-right"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5 4.5-5z' fill='%234c5476'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  paddingRight: '28px',
                }}
              >
                <option>Friendly & casual</option>
                <option>Professional</option>
                <option>Formal</option>
                <option>Conversational</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-foreground text-sm focus:border-primary/30 focus:outline-none appearance-none bg-right"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5 4.5-5z' fill='%234c5476'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  paddingRight: '28px',
                }}
              >
                <option>General public</option>
                <option>Customers</option>
                <option>Employees</option>
                <option>Students</option>
                <option>Patients</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-foreground text-sm focus:border-primary/30 focus:outline-none appearance-none bg-right"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5 4.5-5z' fill='%234c5476'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  paddingRight: '28px',
                }}
              >
                <option>English</option>
                <option>Tamil</option>
                <option>Hindi</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="mb-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Or start from a template</p>
          <TemplateChips onSelect={handleTemplateSelect} />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-primary/90 disabled:opacity-60 disabled:pointer-events-none text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating…</span>
            </>
          ) : (
            <>
              <span>✦</span>
              <span>Generate Form with AI</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
