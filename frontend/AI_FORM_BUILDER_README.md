# AI Form Builder Implementation Guide

## Overview
The AI Form Builder has been successfully created based on the design specifications in `feedmind-ai-builder-v2.html`. This implementation provides a three-stage form creation workflow:

1. **Stage 1: Prompt** - Users describe their form and customize settings
2. **Stage 2: Review** - AI-generated questions are reviewed and selected
3. **Stage 3: Builder** - Final form editing and customization

## File Structure

### Route
```
/app/(dashboard)/forms/new/ai/page.tsx  ← Main entry point (connected to CreateFormDialog)
/app/(dashboard)/forms/ai-builder/      ← Reusable components
├── page.tsx
└── components/
    ├── PromptStage.tsx      - First stage: form description & settings
    ├── ReviewStage.tsx       - Second stage: question selection & review
    ├── BuilderStage.tsx      - Third stage: form editing
    ├── QuestionCard.tsx      - Question preview component
    ├── BuilderQuestion.tsx   - Editable question component
    ├── StepIndicator.tsx     - Progress indicator (1→2→3)
    ├── TemplateChips.tsx     - Quick template selector
    └── Toast.tsx             - Notification component
```

## Integration Points

### Navigation
The implementation integrates with the existing form creation dialog at:
- `components/dashboard/create-form-dialog.tsx`
- When user selects "AI Generation", it routes to `/forms/new/ai`

### API Endpoints
The following endpoints are called:
- `POST /api/forms` - Save/publish forms


### Data Flow
```
PromptStage 
  → onGenerate() 
    → setGeneratedQuestions()
    → setStage(2)
      
ReviewStage
  → onAccept() 
    → handleAcceptQuestions()
    → setBuilderQuestions()
    → setStage(3)

BuilderStage
  → onSave() / onPublish()
    → POST /api/forms
    → router.push(`/dashboard/forms/${form.id}`)
```

## Key Features Implemented

### Stage 1: Prompt
- Text area for form description
- Dropdowns for: question count, tone, audience, language
- Toggle switches for: NPS Score, Star Ratings, Open-ended text, Multiple choice, Yes/No, Email collection
- Quick template chips (6 templates: Coffee, Product, Event, Employee, Patient, Restaurant)
- Generate button with loading state

### Stage 2: Review
- Left panel: Recap of settings and selected prompt
- Right panel: Generated questions with selection checkboxes
- Question preview (stars, NPS scale, options previews)
- Select/Deselect all functionality
- Add to form button

### Stage 3: Builder
- Top bar: Form title input, question count display, preview/save/publish buttons
- Canvas: Form title and description inputs, individual question cards
- Right panel: Form settings (respondents, spam protection, notifications)
- Question cards with: edit text, toggle required, duplicate, move up/down, delete
- Add Question modal with 8 question types

## Question Types Supported

1. **text** - Short Text (single line)
2. **textarea** - Long Text (multi-line)
3. **mc** - Multiple Choice (radio buttons)
4. **checkbox** - Checkboxes (multi-select)
5. **rating** - Star Rating (1-5)
6. **nps** - NPS Score (0-10)
7. **yesno** - Yes/No binary choice
8. **dropdown** - Dropdown select list

## Template Data

Six built-in templates:
- **Coffee** - Coffee shop customer satisfaction
- **Product** - Product feedback survey
- **Event** - Event post-feedback
- **Employee** - Employee engagement survey
- **Patient** - Healthcare patient satisfaction
- **Restaurant** - Restaurant review form

## Theme & Colors
Using FeedMind's design tokens:
- Background: `rgb(7, 8, 15)`
- Secondary: `rgb(10, 12, 24)`
- Accent: `#00ffe4` (cyan) / `#8a72ff` (purple)
- Text: `#eef0fc` (primary) / `#8a93b4` (secondary)

## Responsive Features
- Full-screen three-stage flow
- Mobile-optimized question cards (single column on canvas)
- Sticky topbar with step indicator
- Scrollable panels with proper overlays

## Toast Notifications
Four toast types:
- **success** (green) - Form saved/published, question actions
- **error** (red) - Validation and API errors
- **info** (cyan) - Generic notifications
- **ai** (purple) - AI generation related

## State Management
Managed via React hooks:
- `stage` - Current stage (1, 2, or 3)
- `generatedQuestions` - Output from AI generation
- `selectedIds` - Set of selected question IDs in review stage
- `builderQuestions` - Questions being edited in builder stage
- `promptData` - Original prompt configuration

## Next Steps to Complete

1. **Connect to Backend API**
   - Implement `/api/forms` POST endpoint
   - Add question relationship serialization
   - Return form ID on creation

2. **AI Generation Implementation**
   - Replace mock generation with actual AI service call
   - Integrate with your existing AI models (Vertex, Claude, etc.)
   - Use existing `generateQuestionsFromTrainedModel` function

3. **Form Preview**
   - Implement the "Preview" button functionality
   - Show actual respondent view of form

4. **Settings Persistence**
   - Save form settings to database
   - Apply theme colors and preferences

5. **Form Publishing**
   - Create shareable form links
   - Generate form ID and share URL

## Testing Checklist

- [ ] Three-stage workflow navigation works
- [ ] Templates load prompt text correctly
- [ ] Mock AI generation creates question cards
- [ ] Question selection/deselection toggles working
- [ ] Questions appear in builder stage
- [ ] Form title, description, and questions editable
- [ ] Add question modal and new questions work
- [ ] Delete, duplicate, reorder questions functional
- [ ] Save/Publish buttons navigate to form page
- [ ] Toast notifications appear and disappear

## Customization Notes

To modify colors/theme:
- Update color values in toast background classes
- Modify card backgrounds in components (bg-[rgb(16,19,42)], etc.)
- Update gradient buttons in BuilderStage

To add new templates:
- Add entry to `TEMPLATE_QUESTIONS` object in PromptStage
- Include name, prompt, and questions array
- Template matching uses lowercase keyword search
