"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps, toast } from "sonner"
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react"

const CustomToaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:min-w-[320px] group-[.toaster]:max-w-[420px]",
          description: "group-[.toast]:text-slate-500 group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-slate-900 group-[.toast]:text-slate-50 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:hover:bg-slate-800",
          cancelButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:hover:bg-slate-200",
          closeButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 group-[.toast]:rounded-lg group-[.toast]:p-1.5 group-[.toast]:hover:bg-slate-200",
          success: "group-[.toaster]:bg-green-50 group-[.toaster]:border-green-200 group-[.toaster]:text-green-900",
          error: "group-[.toaster]:bg-red-50 group-[.toaster]:border-red-200 group-[.toaster]:text-red-900",
          warning: "group-[.toaster]:bg-orange-50 group-[.toaster]:border-orange-200 group-[.toaster]:text-orange-900",
          info: "group-[.toaster]:bg-blue-50 group-[.toaster]:border-blue-200 group-[.toaster]:text-blue-900",
        },
      }}
      style={
        {
          "--normal-bg": "var(--zalama-card)",
          "--normal-text": "var(--zalama-text)",
          "--normal-border": "var(--zalama-border)",
          "--success-bg": "#f0fdf4",
          "--success-text": "#166534",
          "--success-border": "#bbf7d0",
          "--error-bg": "#fef2f2",
          "--error-text": "#dc2626",
          "--error-border": "#fecaca",
          "--warning-bg": "#fff7ed",
          "--warning-text": "#ea580c",
          "--warning-border": "#fed7aa",
          "--info-bg": "#eff6ff",
          "--info-text": "#2563eb",
          "--info-border": "#bfdbfe",
        } as React.CSSProperties
      }
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      duration={4000}
      {...props}
    />
  )
}

// Composant pour les icônes personnalisées
export const ToastIcon = ({ type }: { type: string }) => {
  const iconClass = "w-5 h-5 flex-shrink-0"
  
  switch (type) {
    case 'success':
      return <CheckCircle className={`${iconClass} text-green-600`} />
    case 'error':
      return <XCircle className={`${iconClass} text-red-600`} />
    case 'warning':
      return <AlertTriangle className={`${iconClass} text-orange-600`} />
    case 'info':
      return <Info className={`${iconClass} text-blue-600`} />
    default:
      return <Info className={`${iconClass} text-slate-600`} />
  }
}

// Fonctions utilitaires pour créer des toasts stylés
export const toastSuccess = (message: string, options?: any) => {
  return toast.success(message, {
    icon: <ToastIcon type="success" />,
    ...options
  })
}

export const toastError = (message: string, options?: any) => {
  return toast.error(message, {
    icon: <ToastIcon type="error" />,
    ...options
  })
}

export const toastWarning = (message: string, options?: any) => {
  return toast.warning(message, {
    icon: <ToastIcon type="warning" />,
    ...options
  })
}

export const toastInfo = (message: string, options?: any) => {
  return toast.info(message, {
    icon: <ToastIcon type="info" />,
    ...options
  })
}

export { CustomToaster as Toaster }
