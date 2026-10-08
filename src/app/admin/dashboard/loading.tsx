import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <Skeleton className="mb-1 h-5 w-32" />
          <Skeleton className="mb-4 h-4 w-48" />
          <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
        </Card>
        <Card className="p-6">
          <Skeleton className="mb-1 h-5 w-32" />
          <Skeleton className="mb-4 h-4 w-48" />
          <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
        </Card>
      </div>

      <Card className="p-6">
        <Skeleton className="mb-1 h-5 w-40" />
        <Skeleton className="mb-4 h-4 w-56" />
        <Skeleton className="h-[200px] w-full" />
      </Card>
    </div>
  );
}
