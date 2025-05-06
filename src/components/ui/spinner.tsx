
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'white';
}

export function Spinner({ className, size = 'md', color = 'default', ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };
  
  const colorClasses = {
    default: "border-gray-300 border-t-gray-600",
    primary: "border-primary/30 border-t-primary",
    white: "border-white/30 border-t-white"
  };
  
  return (
    <div
      className={cn(
        "animate-spin border-2 border-current border-t-transparent rounded-full",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      {...props}
      aria-label="Loading"
    />
  );
}
