"use client";

import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { QuestionCard } from "./question-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Save, Globe, Loader2, Copy, Check } from "lucide-react";
import { useFormBuilder } from "@/lib/store";
import { createForm, publishForm, updateForm } from "@/server/actions/forms";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/use-toast";

function SortableQuestion({ question, index, onUpdate, onDelete, onDuplicate }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <QuestionCard
        question={question}
        index={index}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        dragHandleProps={listeners}
      />
    </div>
  );
}

interface FormBuilderProps {
  formId?: string;
  hideControls?: boolean;
  initialData?: {
    title: string;
    description: string;
    questions: any[];
    isPublished: boolean;
    isAnonymous: boolean;
    allowMultiple: boolean;
  };
}

export function FormBuilder({ formId, hideControls, initialData }: FormBuilderProps) {
  const router = useRouter();
  const { questions, title, description, setTitle, setDescription, addQuestion, updateQuestion, removeQuestion, reorderQuestions, setQuestions } = useFormBuilder();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(initialData?.isAnonymous || false);
  const [allowMultiple, setAllowMultiple] = useState(initialData?.allowMultiple || false);
  const [copied, setCopied] = useState(false);
  const [savedFormId, setSavedFormId] = useState(formId || "");

  // Initialize with existing data
  useState(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setQuestions(initialData.questions);
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      const newQuestions = [...questions];
      const [moved] = newQuestions.splice(oldIndex, 1);
      newQuestions.splice(newIndex, 0, moved);
      reorderQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));
    }
  };

  const handleAddQuestion = () => {
    addQuestion({
      id: `temp-${Date.now()}`,
      type: "SHORT_TEXT",
      label: "",
      placeholder: "",
      required: false,
      options: [],
      order: questions.length,
      aiGenerated: false,
    });
  };

  const handleDuplicate = (id: string) => {
    const src = questions.find((q) => q.id === id);
    if (!src) return;
    addQuestion({
      ...src,
      id: `temp-${Date.now()}`,
      order: questions.length,
      aiGenerated: false,
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Form title is required", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      if (savedFormId) {
        await updateForm(savedFormId, { title, description, isAnonymous, allowMultiple });
      } else {
        const form = await createForm({
          title,
          description,
          questions: questions.map((q, i) => ({
            type: q.type,
            label: q.label,
            placeholder: q.placeholder,
            required: q.required,
            options: q.options,
            order: i,
            aiGenerated: q.aiGenerated,
          })),
          isAnonymous,
          allowMultiple,
        });
        setSavedFormId(form.id);
        router.push(`/forms/${form.id}/edit`);
      }
      toast({ title: "Saved", description: "Form saved successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!savedFormId) {
      await handleSave();
      return;
    }
    setIsPublishing(true);
    try {
      await publishForm(savedFormId, true);
      toast({ title: "Published!", description: "Your form is now live" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  const copyLink = () => {
    if (!savedFormId) return;
    navigator.clipboard.writeText(`${window.location.origin}/f/${savedFormId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {!hideControls && (
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <Label>Anonymous Responses</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
            <Label>Allow Multiple Responses</Label>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            {questions.map((q, i) => (
              <SortableQuestion
                key={q.id}
                question={q}
                index={i}
                onUpdate={updateQuestion}
                onDelete={removeQuestion}
                onDuplicate={handleDuplicate}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          onClick={handleAddQuestion}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#6467f2] hover:bg-[#6467f2]/90 text-white font-semibold px-4 py-2 text-sm transition-colors mx-auto"
        >
          <Plus className="h-4 w-4" /> Add Question
        </button>
      </div>

      {!hideControls && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button variant="secondary" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}
            Publish
          </Button>
          {savedFormId && (
            <Button variant="outline" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
