
import { Skeleton } from "@/components/ui/skeleton";

const LoadingState = () => {
  return (
    <div className="p-8 text-center">
      <Skeleton className="h-4 w-3/4 mx-auto mb-4" />
      <Skeleton className="h-4 w-1/2 mx-auto" />
    </div>
  );
};

export default LoadingState;
