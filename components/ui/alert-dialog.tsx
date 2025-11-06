import * as React from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";

// Interface pour les props de l'AlertDialog
interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface AlertDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  onClick?: () => void;
}

interface AlertDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDialogActionProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface AlertDialogCancelProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

// Composant AlertDialog simple
export const AlertDialog: React.FC<AlertDialogProps> = ({
  children,
  open = false,
  onOpenChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-xl backdrop-saturate-150"
            onClick={handleClose}
          />
          <div className="relative z-50">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                  onClose: handleClose,
                } as any);
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const AlertDialogTrigger: React.FC<AlertDialogTriggerProps> = ({
  children,
  asChild = false,
  onClick,
}) => {
  const handleClick = () => {
    onClick?.();
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick } as any);
  }

  return <div onClick={handleClick}>{children}</div>;
};

export const AlertDialogContent: React.FC<
  AlertDialogContentProps & { onClose?: () => void }
> = ({ children, className, onClose }) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className={clsx(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-[var(--zalama-border)] bg-[var(--zalama-card)] p-6 shadow-xl duration-200 rounded-xl",
        "focus:outline-none",
        "text-gray-900 dark:text-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
};

export const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({
  children,
  className,
}) => (
  <div
    className={clsx(
      "flex flex-col space-y-1.5 text-center sm:text-left mb-4 text-gray-900 dark:text-gray-100",
      className
    )}
  >
    {children}
  </div>
);

export const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({
  children,
  className,
}) => (
  <h2
    className={clsx(
      "text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100",
      className
    )}
  >
    {children}
  </h2>
);

export const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({
  children,
  className,
}) => (
  <p className={clsx("text-sm text-gray-600 dark:text-gray-300", className)}>
    {children}
  </p>
);

export const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({
  children,
  className,
}) => (
  <div
    className={clsx(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-2",
      className
    )}
  >
    {children}
  </div>
);

export const AlertDialogAction: React.FC<AlertDialogActionProps> = ({
  children,
  className,
  onClick,
}) => (
  <Button className={className} onClick={onClick}>
    {children}
  </Button>
);

export const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({
  children,
  className,
  onClick,
}) => (
  <Button variant="outline" className={className} onClick={onClick}>
    {children}
  </Button>
);
