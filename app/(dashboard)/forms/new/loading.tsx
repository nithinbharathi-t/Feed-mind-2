import { Skeleton } from "@/components/ui/skeleton";

export default function NewFormLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <Skeleton className="h-12 w-full max-w-md rounded-lg" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}
