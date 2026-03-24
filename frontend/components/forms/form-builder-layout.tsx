'use client';

import React, { ReactNode } from 'react';
import { FormSettingsSidebar } from './form-settings-sidebar';

interface FormBuilderLayoutProps {
  children: ReactNode;
  onSettingsChange?: (settings: any) => void;
}

export function FormBuilderLayout({ children, onSettingsChange }: FormBuilderLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-950">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="min-h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {children}
        </div>
      </div>

      {/* Settings Sidebar */}
      <FormSettingsSidebar onSettingsChange={onSettingsChange} />
    </div>
  );
}
