import Sidebar from "@/components/Sidebar";
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <Skeleton className="h-8 w-32 mb-5" />
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  );
}
