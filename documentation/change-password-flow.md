# 🔐 Flux de Changement de Mot de Passe - Analyse

## 📋 Scénario Actuel

1. **Utilisateur se connecte** avec email/mot de passe temporaire
2. **Token d'accès généré** avec l'ancien mot de passe
3. **Modal de changement** apparaît quelques secondes après
4. **Tentative de changement** avec le token de l'ancien mot de passe
5. **Erreur "Session expirée"** → Problème identifié

## 🔍 Analyse du Problème

### Cause Probable

L'Edge Function `/change-password` peut avoir une logique qui :

- Vérifie que le token correspond à l'utilisateur
- Vérifie que le token a été généré avec le **même mot de passe** que celui fourni dans `current_password`
- Rejette le token si il y a une incohérence

### Solutions Possibles

#### 1. **Solution Simple (Recommandée)**

Utiliser directement le token de la session actuelle, car l'utilisateur est déjà connecté.

#### 2. **Solution de Fallback**

Si le token ne fonctionne pas, se reconnecter et réessayer.

#### 3. **Solution Edge Function**

Modifier l'Edge Function pour accepter les tokens générés avec l'ancien mot de passe.

## 🛠️ Implémentation Actuelle

### Code Modifié

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // Validation des champs...

  setIsLoading(true);
  try {
    // 1. Essayer avec le token actuel
    const changeResponse = await edgeFunctionService.changePassword(
      session.access_token,
      {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      }
    );

    if (changeResponse.success) {
      // Succès - rafraîchir la session
      await refreshSession();
      toast.success("Mot de passe changé avec succès");
      router.replace("/dashboard");
    }
  } catch (error: any) {
    // 2. Si échec, essayer de se reconnecter
    if (
      error.message?.includes("Session expirée") ||
      error.message?.includes("401")
    ) {
      try {
        const loginResponse = await edgeFunctionService.login({
          email: session.admin.email,
          password: formData.currentPassword,
        });

        if (loginResponse.success) {
          // Réessayer avec le nouveau token
          const retryResponse = await edgeFunctionService.changePassword(
            loginResponse.access_token,
            {
              current_password: formData.currentPassword,
              new_password: formData.newPassword,
              confirm_password: formData.confirmPassword,
            }
          );

          if (retryResponse.success) {
            // Mettre à jour la session
            updateSession(loginResponse);
            toast.success("Mot de passe changé avec succès");
            router.replace("/dashboard");
            return;
          }
        }
      } catch (retryError) {
        toast.error("Mot de passe actuel incorrect");
        return;
      }
    }

    toast.error(error.message || "Erreur lors du changement de mot de passe");
  } finally {
    setIsLoading(false);
  }
};
```

## 🔄 Flux Recommandé

### 1. **Première Tentative**

```
Token actuel → Edge Function /change-password → Succès
```

### 2. **Fallback si Échec**

```
Token actuel → Edge Function /change-password → Échec (401)
Reconnexion → Nouveau token → Edge Function /change-password → Succès
```

### 3. **Gestion d'Erreur**

```
Toutes les tentatives échouent → Message d'erreur approprié
```

## 🧪 Tests à Effectuer

### Test 1 : Token Valide

1. Se connecter avec mot de passe temporaire
2. Attendre l'apparition de la modal
3. Changer le mot de passe
4. Vérifier que ça fonctionne avec le token actuel

### Test 2 : Token Invalide

1. Se connecter avec mot de passe temporaire
2. Attendre l'apparition de la modal
3. Simuler un token expiré
4. Vérifier que la reconnexion fonctionne

### Test 3 : Mot de Passe Incorrect

1. Se connecter avec mot de passe temporaire
2. Attendre l'apparition de la modal
3. Saisir un mauvais mot de passe actuel
4. Vérifier le message d'erreur

## 🔧 Debugging

### Logs à Ajouter

```typescript
console.log("Token actuel:", session.access_token);
console.log("Tentative de changement avec token actuel");
console.log("Réponse Edge Function:", changeResponse);
console.log("Erreur reçue:", error.message);
```

### Vérifications

1. **Token présent** : `session.access_token` existe
2. **Token valide** : Pas expiré
3. **Edge Function** : Route `/change-password` accessible
4. **Paramètres** : Tous les champs requis fournis

## 📝 Notes Importantes

### Points Clés

1. **L'utilisateur est connecté** : Le token devrait être valide
2. **Timing** : La modal apparaît quelques secondes après la connexion
3. **Fallback** : Reconnexion en cas d'échec
4. **UX** : Messages d'erreur clairs

### Améliorations Futures

1. **Route dédiée** : `/first-login-change-password` sans vérification de token
2. **Token spécial** : Token temporaire pour première connexion
3. **Validation côté serveur** : Vérification plus souple dans l'Edge Function

## 🚀 Déploiement

### Étapes

1. **Tester** la solution actuelle
2. **Monitorer** les logs d'erreur
3. **Ajuster** si nécessaire
4. **Documenter** les cas d'usage

### Monitoring

- Taux de succès des changements de mot de passe
- Fréquence des erreurs 401
- Temps de traitement
- Messages d'erreur les plus courants
