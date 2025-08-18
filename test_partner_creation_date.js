// Script de test pour vérifier les dates de création des partenaires
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPartnerCreationDates() {
  console.log("🔍 Vérification des dates de création des partenaires...\n");

  try {
    // Récupérer tous les partenaires avec leurs dates de création
    const { data: partners, error } = await supabase
      .from("partners")
      .select("id, company_name, created_at, status")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "❌ Erreur lors de la récupération des partenaires:",
        error
      );
      return;
    }

    if (!partners || partners.length === 0) {
      console.log("⚠️ Aucun partenaire trouvé dans la base de données");
      return;
    }

    console.log(`📊 ${partners.length} partenaires trouvés:\n`);

    partners.forEach((partner, index) => {
      const creationDate = new Date(partner.created_at);
      const creationYear = creationDate.getFullYear();
      const isCurrentYear = creationYear === new Date().getFullYear();

      console.log(`${index + 1}. ${partner.company_name}`);
      console.log(`   ID: ${partner.id}`);
      console.log(
        `   Date de création: ${creationDate.toLocaleDateString(
          "fr-FR"
        )} (${creationYear})`
      );
      console.log(`   Statut: ${partner.status}`);
      console.log(
        `   Année actuelle: ${isCurrentYear ? "✅" : "❌"} (${creationYear})`
      );
      console.log("");
    });

    // Statistiques
    const currentYearPartners = partners.filter(
      (p) => new Date(p.created_at).getFullYear() === new Date().getFullYear()
    );

    const approvedPartners = partners.filter((p) => p.status === "approved");

    console.log("📈 Statistiques:");
    console.log(
      `   - Partenaires créés cette année: ${currentYearPartners.length}/${partners.length}`
    );
    console.log(
      `   - Partenaires approuvés: ${approvedPartners.length}/${partners.length}`
    );
    console.log(`   - Année actuelle: ${new Date().getFullYear()}`);

    // Vérifier les partenaires avec des dates incorrectes
    const incorrectPartners = partners.filter(
      (p) => new Date(p.created_at).getFullYear() !== new Date().getFullYear()
    );

    if (incorrectPartners.length > 0) {
      console.log("\n⚠️ Partenaires avec des dates de création incorrectes:");
      incorrectPartners.forEach((partner) => {
        const creationYear = new Date(partner.created_at).getFullYear();
        console.log(
          `   - ${
            partner.company_name
          }: ${creationYear} (devrait être ${new Date().getFullYear()})`
        );
      });
    } else {
      console.log(
        "\n✅ Tous les partenaires ont des dates de création correctes"
      );
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

// Exécuter le test
testPartnerCreationDates()
  .then(() => {
    console.log("\n✅ Test terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur lors du test:", error);
    process.exit(1);
  });
