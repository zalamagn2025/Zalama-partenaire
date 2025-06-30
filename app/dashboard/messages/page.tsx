"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send, Search, Filter, Download, Eye, Reply, Mail, Clock, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import { toast } from 'sonner';
import { messageService } from '@/lib/services';
import type { Message } from '@/lib/supabase';

// Fonction pour formatter les dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Fonction pour tronquer le texte
const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default function MessagesPage() {
  const { user, partner, loading } = useAuth();
  const router = useRouter();
  
  // États pour la gestion des messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  // Charger les messages
  useEffect(() => {
    if (!loading && partner) {
      loadMessages();
    }
  }, [loading, partner]);

  const loadMessages = async () => {
    if (!partner) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await messageService.getMessages(partner.id);
      if (error) {
        toast.error('Erreur lors du chargement des messages');
        return;
      }
      setMessages(data || []);
      setFilteredMessages(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setIsLoading(false);
    }
  };

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Filtrer les messages
  useEffect(() => {
    let filtered = messages;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(message => 
        message.sujet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.contenu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.expediteur?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (selectedStatus) {
      filtered = filtered.filter(message => message.statut === selectedStatus);
    }

    // Filtre par type
    if (selectedType) {
      filtered = filtered.filter(message => message.type === selectedType);
    }

    setFilteredMessages(filtered);
    setCurrentPage(1);
  }, [messages, searchTerm, selectedStatus, selectedType]);

  // Calculer les statistiques
  const totalMessages = messages.length;
  const unreadMessages = messages.filter(msg => !msg.lu).length;
  const urgentMessages = messages.filter(msg => msg.priorite === 'Urgente').length;
  const thisMonthMessages = messages.filter(msg => {
    const messageDate = new Date(msg.date_envoi);
    const now = new Date();
    return messageDate.getMonth() === now.getMonth() && messageDate.getFullYear() === now.getFullYear();
  }).length;

  // Pagination
  const messagesPerPage = 10;
  const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);
  const indexOfLastMessage = currentPage * messagesPerPage;
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
  const currentMessages = filteredMessages.slice(indexOfFirstMessage, indexOfLastMessage);

  // Ouvrir le modal de visualisation
  const openViewModal = (message: Message) => {
    setSelectedMessage(message);
    setIsViewModalOpen(true);
    setReplyText("");
  };

  // Fermer le modal
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedMessage(null);
    setReplyText("");
  };

  // Marquer comme lu
  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await messageService.markAsRead(messageId);
      if (error) {
        toast.error('Erreur lors de la mise à jour');
        return;
      }
      toast.success('Message marqué comme lu');
      loadMessages(); // Recharger les messages
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Répondre à un message
  const replyToMessage = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    try {
      const { error } = await messageService.sendReply({
        message_id: selectedMessage.message_id,
        expediteur: partner?.nom || 'Partenaire',
        destinataire: selectedMessage.expediteur || '',
        sujet: `Re: ${selectedMessage.sujet}`,
        contenu: replyText,
        type: 'Réponse',
        priorite: 'Normale',
        statut: 'Envoyé'
      });

      if (error) {
        toast.error('Erreur lors de l\'envoi de la réponse');
        return;
      }

      toast.success('Réponse envoyée avec succès');
      closeViewModal();
      loadMessages(); // Recharger les messages
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la réponse');
    }
  };

  // Exporter les messages au format CSV
  const handleExportCSV = () => {
    if (!partner) return;
    
    const headers = ["ID", "Date", "Expéditeur", "Destinataire", "Sujet", "Type", "Priorité", "Statut", "Lu"];
    const csvData = [
      headers.join(","),
      ...messages.map(message => [
        message.message_id,
        formatDate(message.date_envoi),
        message.expediteur || '',
        message.destinataire || '',
        message.sujet || '',
        message.type || '',
        message.priorite || '',
        message.statut || '',
        message.lu ? 'Oui' : 'Non'
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `messages_${partner.nom}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export CSV réussi');
  };

  // Si en cours de chargement, afficher un état de chargement
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si pas de partenaire, afficher un message d'erreur
  if (!partner) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {partner.nom} - Centre de messagerie
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadMessages}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total des messages"
          value={totalMessages}
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          title="Messages non lus"
          value={unreadMessages}
          total={totalMessages}
          icon={Mail}
          color="yellow"
        />
        <StatCard
          title="Messages urgents"
          value={urgentMessages}
          icon={Clock}
          color="red"
        />
        <StatCard
          title="Messages ce mois"
          value={thisMonthMessages}
          icon={User}
          color="green"
        />
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher dans les messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filtre par statut */}
          <div className="relative">
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              {selectedStatus || "Statut"}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setSelectedStatus(null);
                    setIsStatusDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Tous les statuts
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus('Envoyé');
                    setIsStatusDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Envoyé
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus('Reçu');
                    setIsStatusDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Reçu
                </button>
              </div>
            )}
          </div>

          {/* Filtre par type */}
          <div className="relative">
            <button
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              {selectedType || "Type"}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            {isTypeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setSelectedType(null);
                    setIsTypeDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Tous les types
                </button>
                <button
                  onClick={() => {
                    setSelectedType('Information');
                    setIsTypeDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Information
                </button>
                <button
                  onClick={() => {
                    setSelectedType('Demande');
                    setIsTypeDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Demande
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Expéditeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sujet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Priorité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentMessages.map((message) => (
                <tr key={message.message_id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${!message.lu ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {message.expediteur?.charAt(0) || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {message.expediteur || 'Inconnu'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {message.destinataire || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {message.sujet || 'Sans sujet'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {truncateText(message.contenu || '', 80)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      message.type === 'Information' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      message.type === 'Demande' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      message.type === 'Réponse' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {message.type || 'Autre'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      message.priorite === 'Urgente' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      message.priorite === 'Haute' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {message.priorite || 'Normale'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(message.date_envoi)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      message.statut === 'Envoyé' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      message.statut === 'Reçu' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {message.statut || 'Inconnu'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openViewModal(message)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Voir le message"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!message.lu && (
                        <button
                          onClick={() => markAsRead(message.message_id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Marquer comme lu"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Affichage de <span className="font-medium">{indexOfFirstMessage + 1}</span> à{' '}
                  <span className="font-medium">{Math.min(indexOfLastMessage, filteredMessages.length)}</span> sur{' '}
                  <span className="font-medium">{filteredMessages.length}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de visualisation et réponse */}
      {isViewModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Détails du message
                </h3>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {selectedMessage.sujet || 'Sans sujet'}
                    </h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedMessage.priorite === 'Urgente' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      selectedMessage.priorite === 'Haute' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {selectedMessage.priorite || 'Normale'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>De:</strong> {selectedMessage.expediteur || 'Inconnu'}<br />
                    <strong>À:</strong> {selectedMessage.destinataire || 'N/A'}<br />
                    <strong>Date:</strong> {formatDate(selectedMessage.date_envoi)}
                  </div>
                  
                  <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedMessage.contenu || 'Aucun contenu'}
                  </div>
                </div>

                {/* Zone de réponse */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Répondre</h4>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tapez votre réponse..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={4}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={closeViewModal}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={replyToMessage}
                      disabled={!replyText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Répondre
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
