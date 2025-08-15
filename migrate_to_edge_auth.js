const fs = require("fs");
const path = require("path");

// Liste des fichiers à migrer
const filesToMigrate = [
  "app/payment-result/page.tsx",
  "app/dashboard/remboursements-test/page.tsx",
  "app/dashboard/remboursements/page.tsx",
  "app/dashboard/notifications/NotificationsDrawer.tsx",
  "app/dashboard/finances/page.tsx",
  "app/dashboard/demandes/page.tsx",
  "app/dashboard/avis/page.tsx",
  "app/admin/first-login-change-password/page.tsx",
];

function migrateFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Fichier non trouvé: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, "utf8");
    let modified = false;

    // Remplacer l'import
    if (content.includes("import { useAuth } from '@/contexts/AuthContext';")) {
      content = content.replace(
        "import { useAuth } from '@/contexts/AuthContext';",
        "import { useEdgeAuthContext } from '@/contexts/EdgeAuthContext';"
      );
      modified = true;
    }

    // Remplacer l'utilisation
    if (content.includes("const { session } = useAuth();")) {
      content = content.replace(
        "const { session } = useAuth();",
        "const { session } = useEdgeAuthContext();"
      );
      modified = true;
    }

    if (content.includes("const { session, loading } = useAuth();")) {
      content = content.replace(
        "const { session, loading } = useAuth();",
        "const { session, loading } = useEdgeAuthContext();"
      );
      modified = true;
    }

    if (content.includes("const { session, signOut } = useAuth();")) {
      content = content.replace(
        "const { session, signOut } = useAuth();",
        "const { session, logout } = useEdgeAuthContext();"
      );
      modified = true;
    }

    if (content.includes("const { session, loading, signOut } = useAuth();")) {
      content = content.replace(
        "const { session, loading, signOut } = useAuth();",
        "const { session, loading, logout } = useEdgeAuthContext();"
      );
      modified = true;
    }

    // Remplacer signOut par logout
    if (content.includes("signOut()")) {
      content = content.replace(/signOut\(\)/g, "logout()");
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, "utf8");
      console.log(`✅ Migré: ${filePath}`);
    } else {
      console.log(`ℹ️  Aucun changement nécessaire: ${filePath}`);
    }
  } catch (error) {
    console.error(
      `❌ Erreur lors de la migration de ${filePath}:`,
      error.message
    );
  }
}

console.log("🚀 Migration vers Edge Auth Context...\n");

filesToMigrate.forEach(migrateFile);

console.log("\n✅ Migration terminée !");
