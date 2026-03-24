# Form Settings Sidebar Component

## Overview

The **FormSettingsSidebar** is a full-featured settings panel for the form builder. It provides a clean, dark-themed UI with collapsible sections for managing form respondent settings, integrity controls, notifications, appearance, and AI-powered question generation.

## Location

- **Component**: `components/forms/form-settings-sidebar.tsx`
- **Demo Page**: `/forms/sidebar-showcase` (for viewing the standalone component)

## Features

### Sections

1. **RESPONDENTS**
   - Multiple Responses toggle (allow multiple submissions per user)
   - Collect Email dropdown (Do not collect / Optional / Required)
   - Show Progress Bar toggle
   - Shuffle Questions toggle

2. **INTEGRITY AND SPAM**
   - Restrict Extension toggle (prevent form extensions)
   - Duplicate Filter toggle (block duplicate submissions)

3. **NOTIFICATIONS**
   - Email on Submission toggle
   - Slack Webhook toggle

4. **APPEARANCE**
   - Thank You Message (textarea)
   - Redirect URL (input field)

5. **AI SUGGESTION**
   - Provider Selection (Gemini, GPT-4, Claude)
   - Quick Prompts (buttons for common actions):
     - Add NPS question
     - Ask about wait time
     - Add email follow-up
     - Generate 5 more questions
   - AI Help Tip box

## Usage

### Basic Integration

```tsx
import { FormSettingsSidebar } from '@/components/forms/form-settings-sidebar';

export function MyFormBuilder() {
  const handleSettingsChange = (settings) => {
    console.log('Settings updated:', settings);
    // Handle settings changes (save to database, update form state, etc.)
  };

  return (
    <div className="flex h-screen">
      {/* Main content */}
      <div className="flex-1">
        {/* Form builder content */}
      </div>

      {/* Settings sidebar */}
      <FormSettingsSidebar onSettingsChange={handleSettingsChange} />
    </div>
  );
}
```

### In the Form Editor

The sidebar is already integrated into `/forms/[formId]/edit/:

```tsx
import { FormSettingsSidebar } from '@/components/forms/form-settings-sidebar';

export function EditFormClient({ formId, initialData }: EditFormClientProps) {
  return (
    <div className="flex">
      {/* Form builder content */}
      
      {/* Settings sidebar */}
      <FormSettingsSidebar onSettingsChange={(settings) => {
        // Handle settings
      }} />
    </div>
  );
}
```

## Settings Object Structure

```typescript
interface FormSettings {
  multipleResponses: boolean;        // Allow multiple responses
  collectEmail: 'do-not-collect' | 'optional' | 'required';
  showProgressBar: boolean;
  shuffleQuestions: boolean;
  restrictExtension: boolean;
  duplicateFilter: boolean;
  emailOnSubmission: boolean;
  slackWebhook: boolean;
  thankYouMessage: string;
  redirectUrl: string;
}
```

## Styling

The component uses:
- **Color Scheme**: Dark theme (slate-950, slate-900, slate-800)
- **Accent Color**: Indigo (indigo-400, indigo-500)
- **Borders**: Subtle slate-700/50 borders
- **Hover States**: Background color transitions
- **Icons**: Lucide React icons

## Props

```typescript
interface FormSettingsSidebarProps {
  onSettingsChange?: (settings: any) => void;
}
```

- `onSettingsChange`: Callback function fired whenever any setting is changed. Receives the complete settings object.

## State Management

The sidebar manages its own internal state for:
- Individual setting values
- Expanded/collapsed section states

If you need to initialize the sidebar with existing settings, extend the component to accept an `initialSettings` prop.

## Customization

### Changing Colors

Update the Tailwind classes for:
- Background: `bg-slate-950`, `bg-slate-900`
- Borders: `border-slate-700/50`
- Text: `text-slate-300`, `text-slate-400`
- Accents: `text-indigo-400`, `bg-indigo-400`

### Adding New Settings

1. Add new state variable in the component
2. Add UI control (toggle, input, select)
3. Call `handleToggleSetting()` or `handleSelectChange()` when value changes
4. Update the settings object passed to `onSettingsChange`

### Expanding Sections by Default

Change the initial state:
```tsx
const [expandedSection, setExpandedSection] = useState<string | null>('respondents');
```

To expand a different section on load, update the initial value.

## Mobile Responsiveness

The sidebar uses `w-80` (320px) fixed width. For responsive design:
- On mobile: Consider making the sidebar a modal or drawer
- On tablet: Adjust width with responsive classes
- On desktop: Keep as fixed sidebar

## Integration Notes

- The component is **position-independent** (doesn't set its own positioning)
- Parent container should handle the layout (flexbox, grid, or absolute positioning)
- For the edit form, the sidebar is positioned as `fixed right-0 top-14` 
- The component has `overflow-y-auto` for scrolling long settings

## Examples

### Controlled Settings

To make the sidebar controlled (from parent state):

```tsx
const [settings, setSettings] = useState(initialSettings);

<FormSettingsSidebar 
  initialSettings={settings}
  onSettingsChange={setSettings} 
/>
```

### Persisting Settings

```tsx
const handleSettingsChange = async (settings) => {
  // Save to database
  await updateFormSettings(formId, settings);
  
  // Update local state
  setFormSettings(settings);
};
```

## Accessibility

- All toggles use accessible Switch components
- Clear labels for all inputs
- Keyboard navigation with collapsible sections
- Color contrast meets WCAG standards

## Browser Support

Works in all modern browsers:
- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- iOS Safari 14+
