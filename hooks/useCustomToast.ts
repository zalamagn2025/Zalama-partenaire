import { toast as sonnerToast } from "sonner"

export const useCustomToast = () => {
  const toast = {
    success: (message: string, options?: any) => {
      return sonnerToast.success(message, {
        duration: 4000,
        ...options
      })
    },
    
    error: (message: string, options?: any) => {
      return sonnerToast.error(message, {
        duration: 5000, // Plus long pour les erreurs
        ...options
      })
    },
    
    warning: (message: string, options?: any) => {
      return sonnerToast.warning(message, {
        duration: 4500,
        ...options
      })
    },
    
    info: (message: string, options?: any) => {
      return sonnerToast.info(message, {
        duration: 4000,
        ...options
      })
    },
    
    // Fonction pour les messages de bienvenue
    welcome: (companyName: string) => {
      return sonnerToast.success(
        `Bienvenue sur le tableau de bord de ${companyName}`,
        {
          id: "dashboard-welcome",
          duration: 3000,
        }
      )
    },
    
    // Fonction pour les actions réussies
    actionSuccess: (action: string) => {
      return sonnerToast.success(`${action} avec succès`, {
        duration: 3000,
      })
    },
    
    // Fonction pour les erreurs d'action
    actionError: (action: string, error?: string) => {
      return sonnerToast.error(
        error || `Erreur lors de ${action}`,
        {
          duration: 5000,
        }
      )
    },
    
    // Fonction pour les chargements
    loading: (message: string) => {
      return sonnerToast.loading(message, {
        duration: Infinity, // Ne disparaît pas automatiquement
      })
    },
    
    // Fonction pour les confirmations
    confirm: (message: string, onConfirm: () => void, onCancel?: () => void) => {
      return sonnerToast(message, {
        action: {
          label: "Confirmer",
          onClick: onConfirm,
        },
        cancel: onCancel ? {
          label: "Annuler",
          onClick: onCancel,
        } : undefined,
        duration: 6000,
      })
    },
    
    // Fonction pour les exports
    exportSuccess: (type: string, count?: number) => {
      const message = count 
        ? `${count} ${type} exporté${count > 1 ? 's' : ''} avec succès`
        : `${type} exporté avec succès`
      
      return sonnerToast.success(message, {
        duration: 3000,
      })
    },
    
    // Fonction pour les erreurs de session
    sessionError: (message?: string) => {
      return sonnerToast.error(
        message || "Session expirée. Redirection vers la connexion...",
        {
          duration: 4000,
        }
      )
    },
    
    // Fonction pour les erreurs de chargement
    loadingError: (resource: string) => {
      return sonnerToast.error(`Erreur lors du chargement des ${resource}`, {
        duration: 4000,
      })
    },
    
    // Fonction pour les mises à jour
    updateSuccess: (resource: string) => {
      return sonnerToast.success(`${resource} mis à jour avec succès`, {
        duration: 3000,
      })
    },
    
    // Fonction pour les suppressions
    deleteSuccess: (resource: string) => {
      return sonnerToast.success(`${resource} supprimé avec succès`, {
        duration: 3000,
      })
    },
    
    // Fonction pour les créations
    createSuccess: (resource: string) => {
      return sonnerToast.success(`${resource} créé avec succès`, {
        duration: 3000,
      })
    },
    
    // Fonction pour les validations
    validationError: (field: string) => {
      return sonnerToast.warning(`Veuillez remplir le champ ${field}`, {
        duration: 4000,
      })
    },
    
    // Fonction pour les copies
    copySuccess: (item: string) => {
      return sonnerToast.success(`${item} copié dans le presse-papiers`, {
        duration: 2000,
      })
    },
    
    // Fonction pour les téléchargements
    downloadSuccess: (file: string) => {
      return sonnerToast.success(`${file} téléchargé avec succès`, {
        duration: 3000,
      })
    },
    
    // Fonction pour les erreurs de téléchargement
    downloadError: (file: string) => {
      return sonnerToast.error(`Erreur lors du téléchargement de ${file}`, {
        duration: 4000,
      })
    }
  }

  return toast
}
