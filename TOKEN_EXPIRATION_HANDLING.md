# 🔑 Gestion Complète des Tokens Expirés

## 📋 Vue d'ensemble

Le système gère maintenant de manière complète l'expiration des tokens, incluant :

- **Access Token** : Expire après 10 minutes
- **Refresh Token** : Peut expirer après une période plus longue
- **Déconnexion automatique** avec redirection vers `/login`

## ⚙️ Configuration

### Intervalles de temps

- **Access Token** : 10 minutes
- **Refresh automatique** : 8 minutes (avec 2 minutes de marge)
- **Buffer de sécurité** : 2 minutes

### Types d'erreurs gérées

```typescript
const tokenExpiredPatterns = [
  "token",
  "unauthorized",
  "Session expirée",
  "401",
  "403",
  "refresh token expired",
  "access token expired",
  "invalid token",
  "expired",
  "authentication failed",
];
```

## 🔧 Fonctionnement

### 1. Détection des erreurs de token expiré

```typescript
const isTokenExpiredError = (error: any): boolean => {
  const errorMessage = error.message || error.toString() || "";
  const errorStatus = error.status || error.code;

  // Vérifier les patterns dans le message d'erreur
  const hasTokenError = tokenExpiredPatterns.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );

  // Vérifier les codes d'erreur HTTP
  const hasTokenStatus = errorStatus === 401 || errorStatus === 403;

  return hasTokenError || hasTokenStatus;
};
```

### 2. Déconnexion automatique avec redirection

```typescript
const logoutWithRedirect = async () => {
  try {
    console.log("🚪 Déconnexion automatique en cours...");

    // Arrêter le refresh automatique
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Nettoyer la session
    setSession(null);
    localStorage.removeItem("partner_session");
    setError(null);

    console.log("✅ Déconnexion terminée, redirection vers /login");

    // Rediriger vers la page de connexion
    router.push("/login");
  } catch (error) {
    console.error("❌ Erreur lors de la déconnexion:", error);
    // Forcer la redirection même en cas d'erreur
    router.push("/login");
  }
};
```

### 3. Gestion dans le refresh automatique

```typescript
// Dans startAutoRefresh
try {
  const response = await edgeFunctionService.getMe(session.access_token);

  if (response.success && response.data?.user && response.data?.partner_info) {
    // Mise à jour de la session
    setSession(sessionData);
    saveSession(sessionData);
    console.log("✅ Refresh automatique terminé avec succès");
  } else {
    console.log("❌ Session invalide lors du refresh automatique");
    await logoutWithRedirect();
  }
} catch (error) {
  console.error("❌ Erreur lors du refresh automatique:", error);

  // Vérifier si c'est une erreur de token expiré
  if (isTokenExpiredError(error)) {
    console.log("🔑 Token expiré détecté, déconnexion automatique");
    await logoutWithRedirect();
  }
}
```

## 🛡️ Gestion des erreurs

### 1. SessionErrorHandler

Le composant `SessionErrorHandler` écoute plusieurs types d'erreurs :

- **Erreurs de session personnalisées** : `session-error` event
- **Erreurs globales** : `error` event
- **Erreurs de fetch** : Requêtes API avec status 401/403
- **Promesses rejetées** : `unhandledrejection` event

### 2. Types d'erreurs détectées

| Type d'erreur        | Code HTTP | Action                    |
| -------------------- | --------- | ------------------------- |
| Access Token expiré  | 401       | Déconnexion + redirection |
| Refresh Token expiré | 403       | Déconnexion + redirection |
| Token invalide       | 401/403   | Déconnexion + redirection |
| Session expirée      | -         | Déconnexion + redirection |

### 3. Logs de débogage

```typescript
console.log("🔑 Token expiré détecté, déconnexion automatique");
console.log("🚪 Déconnexion automatique en cours...");
console.log("✅ Déconnexion terminée, redirection vers /login");
console.log("❌ Erreur lors de la déconnexion:", error);
```

## 🔄 Flux complet

### 1. Refresh automatique normal

```
Toutes les 8 minutes → Vérification token → Mise à jour session → Continuer
```

### 2. Access Token expiré

```
Refresh automatique → Erreur 401 → Détection token expiré → Déconnexion → Redirection /login
```

### 3. Refresh Token expiré

```
Refresh automatique → Erreur 403 → Détection refresh token expiré → Déconnexion → Redirection /login
```

### 4. Erreur réseau ou serveur

```
Refresh automatique → Erreur réseau → Retry automatique → Si échec répété → Déconnexion
```

## 🧪 Tests et débogage

### Composant TokenExpirationTest

Le composant `TokenExpirationTest` permet de tester :

- **Simulation token expiré** : Teste la gestion des erreurs 401
- **Simulation refresh token expiré** : Teste la gestion des erreurs 403
- **Test refresh manuel** : Vérifie le fonctionnement du refresh
- **Déconnexion manuelle** : Teste la déconnexion normale

### Utilisation

```tsx
// Ajouter dans une page de test
import TokenExpirationTest from "@/components/auth/TokenExpirationTest";

// Dans le JSX
<TokenExpirationTest />;
```

## 📊 Monitoring

### Indicateurs visuels

- **Header** : Indicateur "Auto" (vert) ou "Manuel" (gris)
- **Composant RealtimeStatus** : Statut de la session en temps réel
- **Logs console** : Messages détaillés pour le débogage

### Métriques disponibles

- **Statut du refresh** : Actif/Inactif/Erreur
- **Dernier refresh** : Timestamp
- **Prochain refresh** : Compte à rebours
- **Erreurs de token** : Nombre et types d'erreurs

## 🚀 Avantages

### Pour l'utilisateur

- ✅ **Déconnexion automatique** en cas d'expiration
- ✅ **Redirection automatique** vers la page de connexion
- ✅ **Messages d'erreur clairs** via toast notifications
- ✅ **Pas de blocage** de l'interface

### Pour le développeur

- ✅ **Gestion robuste** de tous les types d'erreurs
- ✅ **Logs détaillés** pour le débogage
- ✅ **Tests automatisés** disponibles
- ✅ **Monitoring en temps réel**

## 🔧 Configuration avancée

### Modifier les patterns d'erreur

```typescript
// Dans hooks/useEdgeAuth.ts
const tokenExpiredPatterns = [
  // Ajouter vos patterns personnalisés
  "custom_token_error",
  "my_auth_error",
];
```

### Modifier le comportement de redirection

```typescript
// Dans logoutWithRedirect
const logoutWithRedirect = async () => {
  // Votre logique personnalisée
  await customLogoutLogic();

  // Redirection personnalisée
  router.push("/custom-login-page");
};
```

## 🐛 Dépannage

### Problèmes courants

1. **Redirection ne fonctionne pas** : Vérifier que `useRouter` est bien importé
2. **Erreurs non détectées** : Vérifier les patterns dans `tokenExpiredPatterns`
3. **Refresh automatique bloqué** : Vérifier les logs console

### Logs de débogage

```bash
# Activer les logs détaillés
console.log("🔑 Token expiré détecté, déconnexion automatique");
console.log("🚪 Déconnexion automatique en cours...");
console.log("✅ Déconnexion terminée, redirection vers /login");
```

## 📝 Notes importantes

- Le système gère automatiquement l'expiration des access tokens ET refresh tokens
- La redirection vers `/login` est forcée même en cas d'erreur
- Les logs permettent un monitoring complet du système
- Le composant de test permet de valider le comportement
