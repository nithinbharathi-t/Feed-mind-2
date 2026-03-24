'use client';

interface TemplateChipsProps {
  onSelect: (key: string) => void;
}

export default function TemplateChips({ onSelect }: TemplateChipsProps) {
  const templates = [
    { key: 'coffee', icon: '☕', label: 'Coffee shop' },
    { key: 'product', icon: '💻', label: 'Product feedback' },
    { key: 'event', icon: '🎪', label: 'Event feedback' },
    { key: 'employee', icon: '👔', label: 'Employee survey' },
    { key: 'patient', icon: '🏥', label: 'Patient satisfaction' },
    { key: 'restaurant', icon: '🍽️', label: 'Restaurant review' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((template) => (
        <button
          key={template.key}
          onClick={() => onSelect(template.key)}
          className="px-3 py-1.5 bg-card border border-border rounded-full text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
        >
          {template.icon} {template.label}
        </button>
      ))}
    </div>
  );
}
