# 🔄 Système de Refresh Automatique des Tokens

## 📋 Vue d'ensemble

Le système de refresh automatique des tokens a été implémenté pour maintenir la session utilisateur active sans intervention manuelle. Le token expire après 10 minutes, mais le système le renouvelle automatiquement toutes les 8 minutes.

## ⚙️ Configuration

### Intervalles de temps

- **Expiration du token** : 10 minutes
- **Refresh automatique** : 8 minutes (avec 2 minutes de marge)
- **Buffer de sécurité** : 2 minutes

### Fichiers impliqués

- `hooks/useEdgeAuth.ts` - Logique principale du refresh automatique
- `components/layout/EntrepriseHeader.tsx` - Indicateur visuel du statut
- `components/auth/RealtimeStatus.tsx` - Composant de monitoring

## 🔧 Fonctionnement

### 1. Initialisation

```typescript
// Configuration du refresh automatique
const TOKEN_REFRESH_INTERVAL = 8 * 60 * 1000; // 8 minutes
const TOKEN_EXPIRY_BUFFER = 2 * 60 * 1000; // 2 minutes de marge
```

### 2. Démarrage automatique

Le refresh automatique se déclenche automatiquement :

- À la connexion de l'utilisateur
- Au chargement d'une session existante depuis le localStorage
- Quand une session valide est détectée

### 3. Processus de refresh

```typescript
const startAutoRefresh = useCallback(() => {
  refreshIntervalRef.current = setInterval(async () => {
    // Vérifier si un refresh est déjà en cours
    if (isRefreshingRef.current) return;

    try {
      isRefreshingRef.current = true;

      // Appeler l'API pour rafraîchir la session
      const response = await edgeFunctionService.getMe(session.access_token);

      if (response.success) {
        // Mettre à jour la session
        setSession(sessionData);
        saveSession(sessionData);
        console.log("✅ Refresh automatique terminé");
      } else {
        // Session invalide, déconnexion
        await logout();
      }
    } catch (error) {
      // Gestion des erreurs
      if (error.message?.includes("token") || error.message?.includes("401")) {
        await logout();
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, TOKEN_REFRESH_INTERVAL);
}, [session, saveSession, logout]);
```

## 🎯 Indicateurs visuels

### Header

- **Indicateur de statut** : Affiche "Auto" (vert) ou "Manuel" (gris)
- **Icône WiFi** : Indique si le refresh automatique est actif
- **Tooltip** : Informations détaillées au survol

### Composant RealtimeStatus

- **Statut de la session** : Actif/Inactif/Erreur
- **Dernier refresh** : Heure du dernier refresh automatique
- **Prochain refresh** : Compte à rebours jusqu'au prochain refresh
- **Expiration token** : Information sur la durée de vie du token

## 🛡️ Gestion des erreurs

### Types d'erreurs gérées

- **Token expiré** : Déconnexion automatique
- **Erreur réseau** : Retry automatique
- **Session invalide** : Redirection vers login
- **Erreur serveur** : Log et retry

### Logs de débogage

```typescript
console.log("🔄 Refresh automatique du token en cours...");
console.log("✅ Refresh automatique du token terminé avec succès");
console.log("❌ Erreur lors du refresh automatique:", error);
console.log("Session expirée lors du refresh automatique, déconnexion");
```

## 🔄 Flux complet

### 1. Connexion utilisateur

```
Utilisateur se connecte → Session créée → Refresh automatique démarré
```

### 2. Refresh automatique

```
Toutes les 8 minutes → Vérification token → Mise à jour session → Logs
```

### 3. Gestion d'erreur

```
Erreur détectée → Tentative de récupération → Déconnexion si échec
```

### 4. Déconnexion

```
Utilisateur se déconnecte → Refresh automatique arrêté → Nettoyage
```

## 📊 Monitoring

### Métriques disponibles

- **Statut du refresh** : Actif/Inactif/Erreur
- **Dernier refresh** : Timestamp
- **Prochain refresh** : Compte à rebours
- **Durée de session** : Temps depuis la connexion

### Logs de monitoring

```typescript
console.log(
  `🔄 Refresh automatique configuré toutes les ${
    TOKEN_REFRESH_INTERVAL / 60000
  } minutes`
);
console.log("📊 Statistiques du cache:", { taille, hits, misses, ratio });
```

## 🚀 Avantages

### Pour l'utilisateur

- ✅ **Pas de déconnexion inattendue**
- ✅ **Session maintenue automatiquement**
- ✅ **Indicateurs visuels du statut**
- ✅ **Refresh manuel toujours disponible**

### Pour le développeur

- ✅ **Gestion automatique des tokens**
- ✅ **Logs détaillés pour le débogage**
- ✅ **Gestion robuste des erreurs**
- ✅ **Monitoring en temps réel**

## 🔧 Configuration avancée

### Modifier les intervalles

```typescript
// Dans hooks/useEdgeAuth.ts
const TOKEN_REFRESH_INTERVAL = 8 * 60 * 1000; // Modifier selon vos besoins
const TOKEN_EXPIRY_BUFFER = 2 * 60 * 1000; // Marge de sécurité
```

### Désactiver le refresh automatique

```typescript
// Commenter ou supprimer l'appel à startAutoRefresh()
// startAutoRefresh();
```

### Ajouter des métriques personnalisées

```typescript
// Ajouter dans startAutoRefresh()
const metrics = {
  refreshCount: 0,
  lastRefreshTime: Date.now(),
  errors: [],
};
```

## 🐛 Dépannage

### Problèmes courants

1. **Refresh ne se déclenche pas** : Vérifier les logs console
2. **Déconnexion fréquente** : Vérifier la configuration des intervalles
3. **Erreurs réseau** : Vérifier la connectivité et les logs d'erreur

### Logs de débogage

```bash
# Activer les logs détaillés
console.log("🔄 Refresh automatique du token en cours...");
console.log("✅ Refresh automatique du token terminé avec succès");
console.log("❌ Erreur lors du refresh automatique:", error);
```

## 📝 Notes importantes

- Le refresh automatique ne remplace pas le refresh manuel
- Les erreurs sont gérées automatiquement avec déconnexion si nécessaire
- Le système est résilient aux erreurs réseau temporaires
- Les logs permettent un monitoring complet du système
