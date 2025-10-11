"use client"

import { useCustomToast } from "@/hooks/useCustomToast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ToastDemo() {
  const toast = useCustomToast()

  const showSuccessToast = () => {
    toast.success("Opération réussie avec succès !")
  }

  const showErrorToast = () => {
    toast.error("Une erreur s'est produite lors de l'opération")
  }

  const showWarningToast = () => {
    toast.warning("Attention : Cette action nécessite une confirmation")
  }

  const showInfoToast = () => {
    toast.info("Information importante à retenir")
  }

  const showWelcomeToast = () => {
    toast.welcome("Nimba Solution")
  }

  const showActionSuccessToast = () => {
    toast.actionSuccess("Suppression")
  }

  const showConfirmToast = () => {
    toast.confirm(
      "Êtes-vous sûr de vouloir supprimer cet élément ?",
      () => {
        toast.success("Élément supprimé !")
      },
      () => {
        toast.info("Suppression annulée")
      }
    )
  }

  const showLoadingToast = () => {
    const loadingId = toast.loading("Chargement en cours...")
    
    // Simuler un chargement
    setTimeout(() => {
      toast.success("Chargement terminé !", { id: loadingId })
    }, 2000)
  }

  const showExportToast = () => {
    toast.exportSuccess("rapport", 25)
  }

  const showValidationErrorToast = () => {
    toast.validationError("email")
  }

  const showCopyToast = () => {
    toast.copySuccess("Clé API")
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🎨 Démonstration des Toasts Personnalisés</CardTitle>
        <CardDescription>
          Testez les différents types de toasts avec le style ZaLaMa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={showSuccessToast} variant="default" className="bg-green-600 hover:bg-green-700">
            ✅ Succès
          </Button>
          <Button onClick={showErrorToast} variant="destructive">
            ❌ Erreur
          </Button>
          <Button onClick={showWarningToast} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
            ⚠️ Attention
          </Button>
          <Button onClick={showInfoToast} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
            ℹ️ Information
          </Button>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Fonctions spécialisées :</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={showWelcomeToast} variant="outline">
              👋 Bienvenue
            </Button>
            <Button onClick={showActionSuccessToast} variant="outline">
              ✅ Action réussie
            </Button>
            <Button onClick={showConfirmToast} variant="outline">
              ❓ Confirmation
            </Button>
            <Button onClick={showLoadingToast} variant="outline">
              ⏳ Chargement
            </Button>
            <Button onClick={showExportToast} variant="outline">
              📊 Export
            </Button>
            <Button onClick={showValidationErrorToast} variant="outline">
              📝 Validation
            </Button>
            <Button onClick={showCopyToast} variant="outline">
              📋 Copie
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h5 className="font-semibold text-blue-900 mb-2">💡 Comment utiliser :</h5>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <code>toast.success("Message")</code> - Message de succès</p>
            <p>• <code>toast.error("Message")</code> - Message d'erreur</p>
            <p>• <code>toast.warning("Message")</code> - Message d'avertissement</p>
            <p>• <code>toast.info("Message")</code> - Message d'information</p>
            <p>• <code>toast.welcome("Nom entreprise")</code> - Message de bienvenue</p>
            <p>• <code>toast.confirm("Message", onConfirm, onCancel)</code> - Confirmation</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
