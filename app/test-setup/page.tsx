"use client";

import React, { useState } from 'react';
import { createTestData, supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function TestSetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const checkDatabase = async () => {
    setIsLoading(true);
    try {
      // Vérifier si la table users existe
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (usersError) {
        setDbStatus(`Erreur table users: ${usersError.message}`);
        toast.error(`Erreur table users: ${usersError.message}`);
        return;
      }

      // Vérifier si la table partners existe
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select('count')
        .limit(1);
      
      if (partnersError) {
        setDbStatus(`Erreur table partners: ${partnersError.message}`);
        toast.error(`Erreur table partners: ${partnersError.message}`);
        return;
      }

      setDbStatus('Base de données accessible');
      toast.success('Base de données accessible');
    } catch (error) {
      console.error('Erreur lors de la vérification de la base de données:', error);
      setDbStatus(`Erreur: ${error}`);
      toast.error(`Erreur de vérification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingData = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      console.log('Vérification des données existantes...');
      
      // Vérifier les partenaires
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*');
      
      // Vérifier les employés
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*');
      
      // Vérifier les demandes d'avance
      const { data: demandesAvanceData, error: demandesAvanceError } = await supabase
        .from('demandes_avance_salaire')
        .select('*');
      
      // Vérifier les demandes P2P
      const { data: demandesP2PData, error: demandesP2PError } = await supabase
        .from('demandes_p2p')
        .select('*');
      
      // Vérifier les avis
      const { data: avisData, error: avisError } = await supabase
        .from('avis')
        .select('*');
      
      // Vérifier les messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*');
      
      let status = '📊 **Résultats du diagnostic :**\n\n';
      
      if (partnersError) {
        status += `❌ **Partenaires :** Erreur - ${partnersError.message}\n`;
      } else {
        status += `✅ **Partenaires :** ${partnersData?.length || 0} trouvés\n`;
      }
      
      if (employeesError) {
        status += `❌ **Employés :** Erreur - ${employeesError.message}\n`;
      } else {
        status += `✅ **Employés :** ${employeesData?.length || 0} trouvés\n`;
      }
      
      if (demandesAvanceError) {
        status += `❌ **Demandes d'avance :** Erreur - ${demandesAvanceError.message}\n`;
      } else {
        status += `✅ **Demandes d'avance :** ${demandesAvanceData?.length || 0} trouvées\n`;
      }
      
      if (demandesP2PError) {
        status += `❌ **Demandes P2P :** Erreur - ${demandesP2PError.message}\n`;
      } else {
        status += `✅ **Demandes P2P :** ${demandesP2PData?.length || 0} trouvées\n`;
      }
      
      if (avisError) {
        status += `❌ **Avis :** Erreur - ${avisError.message}\n`;
      } else {
        status += `✅ **Avis :** ${avisData?.length || 0} trouvés\n`;
      }
      
      if (messagesError) {
        status += `❌ **Messages :** Erreur - ${messagesError.message}\n`;
      } else {
        status += `✅ **Messages :** ${messagesData?.length || 0} trouvés\n`;
      }
      
      // Afficher les détails des employés si ils existent
      if (employeesData && employeesData.length > 0) {
        status += `\n📋 **Détails des employés :**\n`;
        employeesData.slice(0, 5).forEach((emp, index) => {
          status += `${index + 1}. ${emp.prenom} ${emp.nom} (${emp.partner_id})\n`;
        });
        if (employeesData.length > 5) {
          status += `... et ${employeesData.length - 5} autres\n`;
        }
      }
      
      // Afficher les détails des demandes d'avance si elles existent
      if (demandesAvanceData && demandesAvanceData.length > 0) {
        status += `\n📋 **Détails des demandes d'avance :**\n`;
        demandesAvanceData.slice(0, 3).forEach((demande, index) => {
          status += `${index + 1}. Montant: ${demande.montant} GNF, Statut: ${demande.statut}, Partner: ${demande.partner_id}\n`;
        });
      }
      
      // Afficher les détails des demandes P2P si elles existent
      if (demandesP2PData && demandesP2PData.length > 0) {
        status += `\n📋 **Détails des demandes P2P :**\n`;
        demandesP2PData.slice(0, 3).forEach((demande, index) => {
          status += `${index + 1}. Montant: ${demande.montant} GNF, Durée: ${demande.duree_mois} mois, Statut: ${demande.statut}\n`;
        });
      }
      
      setMessage(status);
    } catch (error) {
      console.error('Erreur lors de la vérification des données:', error);
      setMessage(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createMissingTables = async () => {
    console.log('Vérification des tables manquantes...');
    
    try {
      // Vérifier si la table employees existe
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('count')
        .limit(1);
      
      if (employeesError) {
        console.log('Table employees manquante:', employeesError.message);
        return false;
      }

      // Vérifier si la table avis existe
      const { data: avisData, error: avisError } = await supabase
        .from('avis')
        .select('count')
        .limit(1);
      
      if (avisError) {
        console.log('Table avis manquante:', avisError.message);
        return false;
      }

      // Vérifier si la table demandes existe
      const { data: demandesData, error: demandesError } = await supabase
        .from('demandes')
        .select('count')
        .limit(1);
      
      if (demandesError) {
        console.log('Table demandes manquante:', demandesError.message);
        return false;
      }

      // Vérifier si la table demandes_avance_salaire existe
      const { data: demandesAvanceData, error: demandesAvanceError } = await supabase
        .from('demandes_avance_salaire')
        .select('count')
        .limit(1);
      
      if (demandesAvanceError) {
        console.log('Table demandes_avance_salaire manquante:', demandesAvanceError.message);
        return false;
      }

      // Vérifier si la table demandes_p2p existe
      const { data: demandesP2PData, error: demandesP2PError } = await supabase
        .from('demandes_p2p')
        .select('count')
        .limit(1);
      
      if (demandesP2PError) {
        console.log('Table demandes_p2p manquante:', demandesP2PError.message);
        return false;
      }

      // Vérifier si la table messages existe
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('count')
        .limit(1);
      
      if (messagesError) {
        console.log('Table messages manquante:', messagesError.message);
        return false;
      }

      console.log('Toutes les tables existent');
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification des tables:', error);
      return false;
    }
  };

  const handleCreateTestData = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      console.log('Début de la création des données de test...');
      
      // Créer les tables manquantes d'abord
      const tablesCreated = await createMissingTables();
      if (!tablesCreated) {
        setMessage('❌ Tables manquantes détectées ! Veuillez exécuter le script SQL dans Supabase avant de créer les données de test. Voir le fichier create_missing_tables.sql');
        return;
      }
      
      // Nettoyer les données existantes
      console.log('Nettoyage des données existantes...');
      await supabase.from('avis').delete().neq('id', '');
      await supabase.from('demandes').delete().neq('id', '');
      await supabase.from('demandes_avance_salaire').delete().neq('id', '');
      await supabase.from('demandes_p2p').delete().neq('id', '');
      await supabase.from('employees').delete().neq('id', '');
      await supabase.from('messages').delete().neq('id', '');
      await supabase.from('financial_transactions').delete().neq('transaction_id', 0);
      await supabase.from('alerts').delete().neq('id', '');
      await supabase.from('partners').delete().neq('id', '');
      await supabase.from('users').delete().neq('id', '');
      
      console.log('Données existantes supprimées');
      
      // Créer les nouvelles données
      const result = await createTestData();
      
      if (result) {
        setMessage('✅ Données de test créées avec succès ! Vous pouvez maintenant vous connecter avec fatou.camara@innovatech.com et le mot de passe Samy2004@');
      } else {
        setMessage('❌ Erreur lors de la création des données de test');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createDemandesOnly = async () => {
    setIsLoading(true);
    try {
      console.log('🔧 Création des demandes uniquement...');

      // Récupérer le partenaire connecté en utilisant l'ID directement
      const partnerId = '61322992-9f29-4065-a0de-e2512e83f261'; // ID du partenaire fatou.camara@innovatech.com

      // Récupérer les employés du partenaire
      const { data: employees } = await supabase
        .from('employees')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('actif', true);

      if (!employees || employees.length === 0) {
        toast.error('Aucun employé trouvé pour ce partenaire');
        return;
      }

      console.log(`📋 Création de ${employees.length * 2} demandes d'avance sur salaire...`);

      // Créer des demandes d'avance sur salaire
      const demandesAvance = [];
      for (let i = 0; i < employees.length * 2; i++) {
        const employee = employees[i % employees.length];
        const montant = Math.floor(Math.random() * 500000) + 100000; // 100k à 600k
        const statuts = ['En attente', 'Approuvée', 'Refusée'];
        const statut = statuts[Math.floor(Math.random() * statuts.length)];
        
        demandesAvance.push({
          employee_id: employee.id,
          partner_id: partnerId,
          montant: montant,
          motif: `Avance sur salaire - ${['Urgence médicale', 'Frais de scolarité', 'Réparation véhicule', 'Achat équipement'][Math.floor(Math.random() * 4)]}`,
          date_demande: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          statut: statut,
          priorite: Math.floor(Math.random() * 3) + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Insérer les demandes d'avance
      const { error: avanceError } = await supabase
        .from('demandes_avance_salaire')
        .insert(demandesAvance);

      if (avanceError) {
        console.error('❌ Erreur lors de la création des demandes d\'avance:', avanceError);
        toast.error('Erreur lors de la création des demandes d\'avance');
      } else {
        console.log('✅ Demandes d\'avance créées avec succès');
        toast.success(`${demandesAvance.length} demandes d'avance sur salaire créées`);
      }

    } catch (error) {
      console.error('❌ Erreur lors de la création des demandes:', error);
      toast.error('Erreur lors de la création des demandes');
    } finally {
      setIsLoading(false);
    }
  };

  const correctPartnerIds = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      console.log('Correction des IDs de partenaire...');
      
      // Récupérer l'ID du partenaire Innovatech SARL
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('email_representant', 'fatou.camara@innovatech.com')
        .single();
      
      if (partnerError || !partnerData) {
        setMessage('❌ Partenaire Innovatech SARL non trouvé');
        return;
      }
      
      const correctPartnerId = partnerData.id;
      console.log('ID du partenaire correct:', correctPartnerId);
      
      // Corriger les employés
      const { error: employeesError } = await supabase
        .from('employees')
        .update({ partner_id: correctPartnerId })
        .neq('partner_id', correctPartnerId);
      
      if (employeesError) {
        console.error('Erreur correction employés:', employeesError);
      }
      
      // Corriger les demandes d'avance
      const { error: demandesAvanceError } = await supabase
        .from('demandes_avance_salaire')
        .update({ partner_id: correctPartnerId })
        .neq('partner_id', correctPartnerId);
      
      if (demandesAvanceError) {
        console.error('Erreur correction demandes avance:', demandesAvanceError);
      }
      
      // Corriger les demandes P2P
      const { error: demandesP2PError } = await supabase
        .from('demandes_p2p')
        .update({ partner_id: correctPartnerId })
        .neq('partner_id', correctPartnerId);
      
      if (demandesP2PError) {
        console.error('Erreur correction demandes P2P:', demandesP2PError);
      }
      
      setMessage('✅ IDs de partenaire corrigés avec succès !');
      toast.success('IDs de partenaire corrigés');
      
    } catch (error) {
      console.error('Erreur lors de la correction des IDs:', error);
      setMessage(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fixFinancialTransactions = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      console.log('Correction de la table financial_transactions...');
      
      // Vérifier si la table existe et a la bonne structure
      const { data: existingData, error: existingError } = await supabase
        .from('financial_transactions')
        .select('partenaire_id, utilisateur_id')
        .limit(1);
      
      if (existingError) {
        setMessage('❌ Table financial_transactions manquante ou structure incorrecte. Veuillez exécuter le script SQL simple_fix_financial.sql dans Supabase.');
        return;
      }
      
      // Vérifier si les types sont corrects (UUID au lieu de BIGINT)
      if (existingData && existingData.length > 0) {
        const sample = existingData[0];
        if (typeof sample.partenaire_id === 'number') {
          setMessage('❌ Structure incorrecte: partenaire_id est de type number au lieu de string. Veuillez exécuter le script SQL simple_fix_financial.sql dans Supabase.');
          return;
        }
      }
      
      // Insérer des données de test si la table est vide
      const { count, error: countError } = await supabase
        .from('financial_transactions')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        setMessage('❌ Erreur lors de la vérification des données existantes');
        return;
      }
      
      if (count === 0) {
        setMessage('📝 Table vide. Veuillez exécuter le script SQL simple_fix_financial.sql dans Supabase pour créer les données de test.');
        return;
      }
      
      setMessage('✅ Table financial_transactions correcte et contient des données !');
      toast.success('Table financial_transactions vérifiée');
      
    } catch (error) {
      console.error('Erreur lors de la vérification de financial_transactions:', error);
      setMessage(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Configuration de test
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Créer les données de test pour ZaLaMa
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Vérification de la base de données
          </h3>
          
          {dbStatus && (
            <div className={`p-3 rounded-lg mb-4 ${
              dbStatus.includes('Erreur') 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' 
                : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            }`}>
              <p className="text-sm">{dbStatus}</p>
            </div>
          )}
          
          <button
            onClick={checkDatabase}
            disabled={isLoading}
            className={`w-full mb-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Vérification...' : 'Vérifier la base de données'}
          </button>
          
          <button
            onClick={checkExistingData}
            disabled={isLoading}
            className={`w-full mb-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Vérification...' : 'Vérifier les données existantes'}
          </button>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Données de test
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <p>Les éléments suivants seront créés :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>4 utilisateurs de test avec leurs partenaires</li>
              <li>3 employés de test</li>
              <li>4 transactions financières</li>
              <li>2 messages</li>
              <li>2 alertes</li>
              <li>2 avis</li>
              <li>2 demandes</li>
              <li>3 demandes d'avance sur salaire</li>
              <li>3 demandes P2P</li>
            </ul>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-medium text-blue-800 dark:text-blue-200">Identifiants de test :</p>
              <ul className="mt-1 text-blue-700 dark:text-blue-300">
                <li>fatou.camara@innovatech.com / Samy2004@</li>
                <li>mamadou.diallo@innovatech.com / Samy2004@</li>
                <li>aissatou.bah@educenter.org / Samy2004@</li>
                <li>ousmane.sow@educenter.org / Samy2004@</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={handleCreateTestData}
            disabled={isLoading}
            className={`w-full mb-4 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Création en cours...' : 'Créer toutes les données de test'}
          </button>
          
          <button
            onClick={createDemandesOnly}
            disabled={isLoading}
            className={`w-full mb-4 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Création en cours...' : 'Créer uniquement les demandes'}
          </button>
          
          <button
            onClick={correctPartnerIds}
            disabled={isLoading}
            className={`w-full mb-4 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Correction en cours...' : 'Corriger les IDs de partenaire'}
          </button>
          
          <button
            onClick={fixFinancialTransactions}
            disabled={isLoading}
            className={`w-full mb-4 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Correction en cours...' : 'Corriger la table financial_transactions'}
          </button>
          
          <div className="mt-4 text-center">
            <a 
              href="/login" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500"
            >
              Retour à la page de connexion
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}