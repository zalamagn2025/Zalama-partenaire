# 🔐 Solution au Problème de Première Connexion

## 📋 Problème Identifié

Lors de la première connexion, l'utilisateur recevait l'erreur :

```
Error: Session expirée. Veuillez vous reconnecter.
```

### Cause du Problème

1. **Token d'accès invalide** : Lors de la première connexion, le token d'accès peut être expiré ou invalide
2. **Flag `require_password_change`** : L'utilisateur doit changer son mot de passe mais ne peut pas utiliser le token existant
3. **Authentification en deux étapes** : Le changement de mot de passe nécessite un token valide

## 🛠️ Solution Implémentée

### Approche en Deux Étapes

1. **Reconnexion** : Se reconnecter avec l'ancien mot de passe pour obtenir un token valide
2. **Changement de mot de passe** : Utiliser le nouveau token pour changer le mot de passe

### Code Modifié

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation des champs...
  if (!session?.admin?.email) {
    toast.error("Session non valide");
    return;
  }

  setIsLoading(true);
  try {
    // 1. Se reconnecter d'abord pour obtenir un token valide
    const loginResponse = await edgeFunctionService.login({
      email: session.admin.email,
      password: formData.currentPassword,
    });

    if (!loginResponse.success || !loginResponse.access_token) {
      throw new Error("Mot de passe actuel incorrect");
    }

    // 2. Maintenant changer le mot de passe avec le nouveau token
    const changeResponse = await edgeFunctionService.changePassword(
      loginResponse.access_token,
      {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      }
    );

    if (changeResponse.success) {
      toast.success(
        "Mot de passe changé avec succès. Vous allez être redirigé vers le dashboard."
      );

      // 3. Mettre à jour la session avec les nouvelles données
      if (loginResponse.user && loginResponse.partner_info) {
        const newSessionData = {
          user: {
            id: loginResponse.user.id,
            email: loginResponse.user.email,
          },
          admin: loginResponse.user,
          partner: loginResponse.partner_info,
          access_token: loginResponse.access_token,
          refresh_token: loginResponse.refresh_token || "",
        };

        // Sauvegarder la nouvelle session
        localStorage.setItem("partner_session", JSON.stringify(newSessionData));
      }

      // 4. Rediriger vers le dashboard
      setTimeout(() => {
        router.replace("/dashboard");
      }, 2000);
    } else {
      throw new Error(
        changeResponse.message || "Erreur lors du changement de mot de passe"
      );
    }
  } catch (error: any) {
    console.error("Erreur lors du changement de mot de passe:", error);
    toast.error(error.message || "Erreur lors du changement de mot de passe");
  } finally {
    setIsLoading(false);
  }
};
```

## 🔄 Flux de Première Connexion

### 1. Connexion Initiale

```
Utilisateur → Saisie email/mot de passe temporaire → Edge Function /login
```

### 2. Vérification du Flag

```
Système → Vérification require_password_change = true → Redirection vers /admin/first-login-change-password
```

### 3. Changement de Mot de Passe

```
Utilisateur → Saisie ancien mot de passe + nouveau mot de passe
Système → Reconnexion avec ancien mot de passe → Obtention nouveau token
Système → Changement mot de passe avec nouveau token → Mise à jour session
```

### 4. Redirection

```
Système → Mise à jour localStorage → Redirection vers /dashboard
```

## 🛡️ Sécurité

### Validation Stricte

1. **Vérification de l'ancien mot de passe** : Reconnexion pour valider les identifiants
2. **Critères de complexité** : Validation côté client et serveur
3. **Session sécurisée** : Mise à jour automatique de la session
4. **Gestion d'erreurs** : Messages d'erreur spécifiques

### Critères de Mot de Passe

- ✅ Au moins 8 caractères
- ✅ Une lettre majuscule
- ✅ Une lettre minuscule
- ✅ Un chiffre
- ✅ Un caractère spécial (@$!%\*?&)

## 🔧 Tests

### Test Manuel

1. **Créer un utilisateur** avec `require_password_change = true`
2. **Se connecter** avec les identifiants temporaires
3. **Vérifier la redirection** vers la page de changement de mot de passe
4. **Changer le mot de passe** selon les critères
5. **Vérifier la redirection** vers le dashboard
6. **Vérifier que** `require_password_change = false`

### Test d'Erreur

1. **Saisir un ancien mot de passe incorrect** → Message d'erreur approprié
2. **Saisir un nouveau mot de passe faible** → Validation des critères
3. **Saisir des mots de passe différents** → Message de confirmation

## 📝 Notes Importantes

### Avantages de cette Solution

1. **Compatibilité** : Utilise les routes Edge Function existantes
2. **Sécurité** : Double validation (reconnexion + changement)
3. **Robustesse** : Gestion des tokens expirés
4. **UX** : Messages d'erreur clairs et redirection automatique

### Limitations

1. **Double appel API** : Reconnexion + changement de mot de passe
2. **Dépendance réseau** : Nécessite deux appels réseau
3. **Latence** : Légèrement plus lent qu'une solution en un seul appel

## 🚀 Améliorations Futures

### Optimisations Possibles

1. **Route dédiée** : Créer `/first-login-change-password` dans l'Edge Function
2. **Token temporaire** : Générer un token spécial pour première connexion
3. **Cache session** : Optimiser la gestion des sessions
4. **Retry automatique** : Gestion automatique des échecs de token

### Monitoring

1. **Logs détaillés** : Traçabilité des changements de mot de passe
2. **Métriques** : Taux de succès des premières connexions
3. **Alertes** : Notification des échecs répétés
4. **Audit** : Historique des changements de mot de passe

## 🔍 Dépannage

### Erreurs Courantes

1. **"Session non valide"** : Vérifier que l'email est présent dans la session
2. **"Mot de passe actuel incorrect"** : Vérifier les identifiants temporaires
3. **"Critères non respectés"** : Vérifier la complexité du nouveau mot de passe
4. **"Erreur réseau"** : Vérifier la connectivité et l'Edge Function

### Solutions

1. **Redémarrer l'application** : Nettoyer le localStorage
2. **Vérifier les logs** : Console du navigateur et logs Edge Function
3. **Tester l'Edge Function** : Vérifier les routes individuellement
4. **Contacter l'admin** : En cas de problème persistant
