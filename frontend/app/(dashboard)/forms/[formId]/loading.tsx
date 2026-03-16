import { Skeleton } from "@/components/ui/skeleton";

export default function FormDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
      <Skeleton className="h-[500px] rounded-lg" />
    </div>
  );
}
