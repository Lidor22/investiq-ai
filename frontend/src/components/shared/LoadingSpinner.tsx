interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        {/* Outer glow effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-blue-500/20 blur-md animate-pulse`} />
        {/* Spinner */}
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400`}
        />
      </div>
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{message}</p>
      )}
    </div>
  );
}
