'use client';

import { FormSettingsSidebar } from '@/components/forms/form-settings-sidebar';

export default function SidebarShowcasePage() {
  return (
    <div className="flex h-screen bg-slate-950">
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-white mb-4">Form Builder Sidebar</h1>
          <p className="text-slate-300 mb-8">
            The sidebar on the right demonstrates the new Form Settings UI design. It includes:
          </p>
          <ul className="space-y-3 text-slate-300">
            <li>✓ <strong>Respondents</strong> - Multiple responses, email collection, progress bar, shuffle questions</li>
            <li>✓ <strong>Integrity & Spam</strong> - Extension restrictions and duplicate filtering</li>
            <li>✓ <strong>Notifications</strong> - Email and Slack webhooks</li>
            <li>✓ <strong>Appearance</strong> - Thank you message and redirect URL</li>
            <li>✓ <strong>AI Suggestion</strong> - Provider selection and quick prompts</li>
          </ul>
          <div className="mt-8 p-4 bg-indigo-900/20 border border-indigo-700/30 rounded-lg">
            <p className="text-indigo-300 text-sm">
              💡 Click on any section header to expand/collapse the settings.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Sidebar */}
      <FormSettingsSidebar onSettingsChange={(settings) => {
        console.log('Settings changed:', settings);
      }} />
    </div>
  );
}
