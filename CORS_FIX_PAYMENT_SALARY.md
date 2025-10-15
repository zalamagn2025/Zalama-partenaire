# 🔧 Fix CORS - Payment Salary

## 🚨 Problème Identifié

L'Edge Function `payment-execution` bloque les requêtes depuis `localhost:3000` car elle est configurée pour accepter seulement `https://admin.zalamagn.com`.

## ✅ Solutions

### **Option 1 : Modifier la configuration CORS de l'Edge Function**

Dans votre Edge Function `payment-execution`, ajoutez `localhost:3000` aux origines autorisées :

```typescript
// Dans supabase/functions/payment-execution/index.ts
const corsHeaders = {
  "Access-Control-Allow-Origin":
    "https://admin.zalamagn.com, http://localhost:3000",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400",
};
```

### **Option 2 : Utiliser un proxy local (Solution temporaire)**

Créer une route proxy dans votre application Next.js :

```typescript
// app/api/proxy-payment-execution/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = request.headers.get("authorization");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/payment-execution`,
    {
      method: "POST",
      headers: {
        Authorization: token || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

### **Option 3 : Tester en production**

Déployez votre application sur `https://admin.zalamagn.com` pour tester avec la configuration CORS actuelle.

## 🧪 Test Recommandé

### **Solution Rapide : Modifier l'Edge Function**

1. **Allez dans votre projet Supabase**
2. **Ouvrez l'Edge Function `payment-execution`**
3. **Modifiez les headers CORS** pour inclure localhost
4. **Déployez la fonction**
5. **Testez à nouveau**

### **Code CORS à ajouter :**

```typescript
// Au début de votre Edge Function
const corsHeaders = {
  "Access-Control-Allow-Origin":
    "https://admin.zalamagn.com, http://localhost:3000, http://localhost:3001",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400",
};

// Gérer les requêtes OPTIONS
if (request.method === "OPTIONS") {
  return new Response("ok", { headers: corsHeaders });
}

// À la fin de votre fonction, retourner avec les headers CORS
return new Response(JSON.stringify(result), {
  status: 200,
  headers: {
    ...corsHeaders,
    "Content-Type": "application/json",
  },
});
```

## 🎯 Prochaines Étapes

1. **Modifiez la configuration CORS** de l'Edge Function
2. **Déployez la fonction mise à jour**
3. **Testez à nouveau** avec le bouton "Test Direct"
4. **Supprimez les boutons de debug** une fois que tout fonctionne

## 📋 Vérification

Après la correction CORS, vous devriez voir :

- ✅ **Pas d'erreur CORS** dans la console
- ✅ **Réponse de l'Edge Function** dans les logs
- ✅ **Message de succès** pour les paiements
- ✅ **Mise à jour des données** après paiement
