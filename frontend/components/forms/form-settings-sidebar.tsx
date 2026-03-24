'use client';

import React, { useState } from 'react';
import { Sparkles, Settings as SettingsIcon, Radio } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface FormSettingsSidebarProps {
  onSettingsChange?: (settings: any) => void;
}

export function FormSettingsSidebar({ onSettingsChange }: FormSettingsSidebarProps) {
  const [formSettingsOpen, setFormSettingsOpen] = useState(false);
  const [aiSuggestionOpen, setAiSuggestionOpen] = useState(false);
  const [settings, setSettings] = useState({
    multipleResponses: true,
    collectEmail: 'do-not-collect',
    showProgressBar: true,
    shuffleQuestions: false,
    botDetection: true,
    duplicateFilter: true,
    geoRestriction: false,
  });

  const handleToggleSetting = (key: string) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key as keyof typeof settings],
    };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handleSelectChange = (key: string, value: string) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  return (
    <aside className="fixed right-0 top-14 h-[calc(100vh-56px)] w-80 bg-[#05070d] border-l border-white/10 overflow-y-auto z-30">
      <button
        onClick={() => setFormSettingsOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-6 border-b border-white/10 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6467f2]/20">
          <Sparkles className="h-5 w-5 text-[#6467f2]" />
        </span>
        <span className="inline-flex flex-col text-[32px] leading-[0.95] font-semibold text-white">
          <span>Form Settings</span>
        </span>
      </button>

      {formSettingsOpen && (
        <div className="px-4 py-4 space-y-6 border-b border-white/10 bg-slate-900/20">
          <div>
            <div className="px-0 pb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Respondents</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm cursor-pointer">Multiple responses</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.multipleResponses}
                    onCheckedChange={() => handleToggleSetting('multipleResponses')}
                  />
                  <span className={`text-xs font-bold px-2 py-1 rounded ${settings.multipleResponses ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-500'}`}>
                    {settings.multipleResponses ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Collect email</Label>
                <select
                  value={settings.collectEmail}
                  onChange={(e) => handleSelectChange('collectEmail', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="do-not-collect">Do not collect</option>
                  <option value="optional">Optional</option>
                  <option value="required">Required</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm cursor-pointer">Show progress bar</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.showProgressBar}
                    onCheckedChange={() => handleToggleSetting('showProgressBar')}
                  />
                  <span className={`text-xs font-bold px-2 py-1 rounded ${settings.showProgressBar ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-500'}`}>
                    {settings.showProgressBar ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm cursor-pointer">Shuffle questions</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.shuffleQuestions}
                    onCheckedChange={() => handleToggleSetting('shuffleQuestions')}
                  />
                  <span className={`text-xs font-bold px-2 py-1 rounded ${settings.shuffleQuestions ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-500'}`}>
                    {settings.shuffleQuestions ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="px-0 pb-3 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Integrity and Spam</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm cursor-pointer">Bot detection</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.botDetection}
                    onCheckedChange={() => handleToggleSetting('botDetection')}
                  />
                  <span className={`text-xs font-bold px-2 py-1 rounded ${settings.botDetection ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-500'}`}>
                    {settings.botDetection ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm cursor-pointer">Duplicate filter</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.duplicateFilter}
                    onCheckedChange={() => handleToggleSetting('duplicateFilter')}
                  />
                  <span className={`text-xs font-bold px-2 py-1 rounded ${settings.duplicateFilter ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-500'}`}>
                    {settings.duplicateFilter ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm cursor-pointer">Geo restriction</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.geoRestriction}
                    onCheckedChange={() => handleToggleSetting('geoRestriction')}
                  />
                  <span className={`text-xs font-bold px-2 py-1 rounded ${settings.geoRestriction ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-500'}`}>
                    {settings.geoRestriction ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setAiSuggestionOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-6 border-b border-white/10 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6467f2]/20">
          <Sparkles className="h-5 w-5 text-[#6467f2]" />
        </span>
        <span className="inline-flex flex-col text-[16px] leading-[0.95] font-semibold text-[#6467f2]">
          AI Suggestion
        </span>
      </button>

      {aiSuggestionOpen && (
        <div className="px-4 py-4 space-y-4 bg-slate-900/20">
          {/* Help Box */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded p-3">
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Hi!</strong> I can help you generate questions. What is your survey about?
            </p>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label className="text-slate-400 text-xs font-bold tracking-wider uppercase">Provider</Label>
            <select
              defaultValue="gemini"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini">Gemini</option>
              <option value="gpt4">GPT-4</option>
              <option value="claude">Claude</option>
            </select>
          </div>

          {/* Quick Prompts */}
          <div className="space-y-2">
            <Label className="text-slate-400 text-xs font-bold tracking-wider uppercase">Quick Prompts</Label>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-slate-300 border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/70 hover:text-slate-100 h-9 text-sm font-medium"
              >
                Add NPS question
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-slate-300 border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/70 hover:text-slate-100 h-9 text-sm font-medium"
              >
                Ask about wait time
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-slate-300 border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/70 hover:text-slate-100 h-9 text-sm font-medium"
              >
                Add email follow-up
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-slate-300 border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/70 hover:text-slate-100 h-9 text-sm font-medium"
              >
                Generate 5 more questions
              </Button>
            </div>
          </div>

          {/* Input for custom prompt */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Add a question about pricing..."
              className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 h-9"
            />
            <button className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors flex items-center justify-center h-9 w-9">
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
