"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  message = "Chargement...",
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const containerClasses = fullScreen
    ? "flex items-center justify-center h-screen"
    : "flex items-center justify-center";

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-t-2 border-b-2 border-[var(--zalama-blue)] mx-auto mb-4 ${sizeClasses[size]}`}
        />
        <p
          className={`text-[var(--zalama-text-secondary)] ${textSizeClasses[size]}`}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

// Composant pour les boutons de chargement
interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function LoadingButton({
  loading,
  children,
  className = "",
}: LoadingButtonProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />
      )}
      {children}
    </div>
  );
}
