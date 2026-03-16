import { create } from "zustand";

interface Question {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
  aiGenerated: boolean;
}

interface FormBuilderState {
  questions: Question[];
  title: string;
  description: string;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  reorderQuestions: (questions: Question[]) => void;
  setQuestions: (questions: Question[]) => void;
  reset: () => void;
}

export const useFormBuilder = create<FormBuilderState>((set) => ({
  questions: [],
  title: "",
  description: "",
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  addQuestion: (question) =>
    set((state) => ({ questions: [...state.questions, question] })),
  updateQuestion: (id, updates) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    })),
  removeQuestion: (id) =>
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
    })),
  reorderQuestions: (questions) => set({ questions }),
  setQuestions: (questions) => set({ questions }),
  reset: () => set({ questions: [], title: "", description: "" }),
}));
