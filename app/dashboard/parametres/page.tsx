"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {User, Lock, Shield, Palette, Moon, Sun, Save, X, Trash, Download, CheckCircle, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ParametresPage() {
  // Utiliser useParams pour récupérer le slug de l'URL
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const slug = params.slug as string;
  
  
  // Utiliser le contexte de thème global
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('apparence');
  
  return (
    <div className="flex flex-col gap-6">
      
      {/* Onglets de paramètres */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--zalama-border)] pb-2 pt-4">
        <button 
          onClick={() => setActiveTab('profil')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'profil' ? 'bg-[var(--zalama-blue)] text-white' : 'hover:bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]'} flex items-center gap-2`}
        >
          <User className="w-4 h-4" />
          <span>Profil</span>
        </button>
        <button 
          onClick={() => setActiveTab('securite')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'securite' ? 'bg-[var(--zalama-blue)] text-white' : 'hover:bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]'} flex items-center gap-2`}
        >
          <Lock className="w-4 h-4" />
          <span>Sécurité</span>
        </button>

        <button 
          onClick={() => setActiveTab('confidentialite')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'confidentialite' ? 'bg-[var(--zalama-blue)] text-white' : 'hover:bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]'} flex items-center gap-2`}
        >
          <Shield className="w-4 h-4" />
          <span>Confidentialité</span>
        </button>
        <button 
          onClick={() => setActiveTab('apparence')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'apparence' ? 'bg-[var(--zalama-blue)] text-white' : 'hover:bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]'} flex items-center gap-2`}
        >
          <Palette className="w-4 h-4" />
          <span>Apparence</span>
        </button>
       
      </div>
      
      {/* Contenu des paramètres - Affichage conditionnel selon l'onglet actif */}
      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne de gauche - Informations de profil */}
          <div className="lg:col-span-2">
          <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--zalama-text)] mb-6">Informations de l&apos;entreprise</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Nom de l&apos;entreprise</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                    defaultValue="Entreprise XYZ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Identifiant</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                    defaultValue={params.slug}
                    disabled
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Email de contact</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  defaultValue="contact@entreprisexyz.com"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Téléphone</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                    defaultValue="01 23 45 67 89"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Site web</label>
                  <input 
                    type="url" 
                    className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                    defaultValue="https://www.entreprisexyz.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Adresse</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  defaultValue="123 Rue de l'Exemple, 75000 Paris"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Description</label>
                <textarea 
                  className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)] min-h-[100px]"
                  defaultValue="Entreprise XYZ est spécialisée dans le développement de solutions innovantes pour les professionnels du secteur..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Secteur d&apos;activité</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  >
                    <option value="tech">Technologie</option>
                    <option value="finance">Finance</option>
                    <option value="sante">Santé</option>
                    <option value="education">Éducation</option>
                    <option value="commerce">Commerce</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Taille de l&apos;entreprise</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  >
                    <option value="1-10">1-10 employés</option>
                    <option value="11-50">11-50 employés</option>
                    <option value="51-200">51-200 employés</option>
                    <option value="201-500">201-500 employés</option>
                    <option value="501+">501+ employés</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6 mt-6">
            <h2 className="text-lg font-semibold text-[var(--zalama-text)] mb-6">Paramètres régionaux</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Langue</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Fuseau horaire</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  >
                    <option value="europe/paris">Europe/Paris (UTC+01:00)</option>
                    <option value="europe/london">Europe/London (UTC+00:00)</option>
                    <option value="america/new_york">America/New_York (UTC-05:00)</option>
                    <option value="asia/tokyo">Asia/Tokyo (UTC+09:00)</option>
                    <option value="australia/sydney">Australia/Sydney (UTC+10:00)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Format de date</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  >
                    <option value="dd/mm/yyyy">JJ/MM/AAAA</option>
                    <option value="mm/dd/yyyy">MM/JJ/AAAA</option>
                    <option value="yyyy-mm-dd">AAAA-MM-JJ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Devise</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  >
                    <option value="eur">Euro (GNF)</option>
                    <option value="usd">Dollar américain ($)</option>
                    <option value="gbp">Livre sterling (£)</option>
                    <option value="jpy">Yen japonais (¥)</option>
                    <option value="cad">Dollar canadien (C$)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Colonne de droite - Photo et paramètres rapides */}
        <div>
          <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--zalama-text)] mb-6">Logo et apparence</h2>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-lg bg-[var(--zalama-bg-light)] border border-[var(--zalama-border)] flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-[var(--zalama-blue)]">XYZ</span>
              </div>
              <button className="px-4 py-2 rounded-lg bg-[var(--zalama-blue)] text-white text-sm">
                Changer le logo
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[var(--zalama-text)] mb-1">
                  <span>Thème</span>
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--zalama-blue)] rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:translate-x-5"></span>
                    </div>
                    <Moon className="w-4 h-4 text-indigo-400" />
                  </div>
                </label>
              </div>
              
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[var(--zalama-text)] mb-1">
                  <span>Couleur principale</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 border border-[var(--zalama-border)] cursor-pointer"></div>
                    <div className="w-6 h-6 rounded-full bg-purple-600 border border-[var(--zalama-border)] cursor-pointer"></div>
                    <div className="w-6 h-6 rounded-full bg-green-600 border border-[var(--zalama-border)] cursor-pointer"></div>
                    <div className="w-6 h-6 rounded-full bg-amber-600 border border-[var(--zalama-border)] cursor-pointer"></div>
                    <div className="w-6 h-6 rounded-full bg-red-600 border border-[var(--zalama-border)] cursor-pointer"></div>
                  </div>
                </label>
              </div>
              
              <div className="pt-4 border-t border-[var(--zalama-border)]">
                <h3 className="text-sm font-medium text-[var(--zalama-text)] mb-3">Paramètres rapides</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between text-sm text-[var(--zalama-text)]/80">
                    <span>Notifications par email</span>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--zalama-blue)] rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:translate-x-5"></span>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between text-sm text-[var(--zalama-text)]/80">
                    <span>Notifications push</span>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--zalama-blue)] rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:translate-x-5"></span>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between text-sm text-[var(--zalama-text)]/80">
                    <span>Profil public</span>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform"></span>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between text-sm text-[var(--zalama-text)]/80">
                    <span>Authentification à deux facteurs</span>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--zalama-blue)] rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:translate-x-5"></span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
      
       {/* Boutons d'action */}
      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)] flex items-center gap-2">
          <X className="w-4 h-4" />
          <span>Annuler</span>
        </button>
        <button className="px-4 py-2 rounded-lg bg-[var(--zalama-blue)] text-white flex items-center gap-2">
          <Save className="w-4 h-4" />
          <span>Enregistrer les modifications</span>
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="bg-[var(--zalama-card)] rounded-lg p-6 shadow-sm">
        {activeTab === 'profil' && (
          <div>
            <h2 className="text-xl font-semibold text-[var(--zalama-text)] mb-4">Profil de l&apos;entreprise</h2>
            <p className="text-[var(--zalama-text)]/70 mb-6">Gérez les informations de votre entreprise {params.slug}.</p>
            {/* Contenu du profil */}
          </div>
        )}

        {activeTab === 'apparence' && (
          <div>
            <h2 className="text-xl font-semibold text-[var(--zalama-text)] mb-4">Apparence</h2>
            <p className="text-[var(--zalama-text)]/70 mb-6">Personnalisez l&apos;apparence de votre tableau de bord pour une expérience sur mesure.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Thème */}
              <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full -z-10"></div>
                
                <h3 className="text-lg font-medium text-[var(--zalama-text)] mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[var(--zalama-blue)]" />
                  <span>Thème</span>
                </h3>
                
                <p className="text-sm text-[var(--zalama-text)]/70 mb-6">Choisissez entre le mode clair et le mode sombre pour votre tableau de bord.</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={toggleTheme}
                    className={`flex-1 flex items-center justify-center p-6 rounded-xl border transition-all hover:shadow-md ${theme === 'light' ? 'border-[var(--zalama-blue)] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-sm' : 'border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]'}`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${theme === 'light' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-[var(--zalama-bg-light)]'}`}>
                        <Sun className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-[var(--zalama-text)]">Mode Clair</span>
                      {theme === 'light' && <span className="text-xs text-[var(--zalama-blue)] mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Actif</span>}
                    </div>
                  </button>
                  
                  <button 
                    onClick={toggleTheme}
                    className={`flex-1 flex items-center justify-center p-6 rounded-xl border transition-all hover:shadow-md ${theme === 'dark' ? 'border-[var(--zalama-blue)] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-sm' : 'border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]'}`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${theme === 'dark' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-[var(--zalama-bg-light)]'}`}>
                        <Moon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-[var(--zalama-text)]">Mode Sombre</span>
                      {theme === 'dark' && <span className="text-xs text-[var(--zalama-blue)] mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Actif</span>}
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Couleurs d'accent */}
              <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-bl-full -z-10"></div>
                
                <h3 className="text-lg font-medium text-[var(--zalama-text)] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--zalama-blue)]" />
                  <span>Couleur d'accent</span>
                </h3>
                
                <p className="text-sm text-[var(--zalama-text)]/70 mb-6">Personnalisez la couleur principale de votre interface.</p>
                
                <div className="grid grid-cols-5 gap-3">
                  <button className="aspect-square rounded-full bg-blue-500 border-4 border-white dark:border-gray-800 shadow-sm hover:scale-110 transition-transform"></button>
                  <button className="aspect-square rounded-full bg-indigo-500 border-2 border-white dark:border-gray-800 hover:scale-110 transition-transform"></button>
                  <button className="aspect-square rounded-full bg-purple-500 border-2 border-white dark:border-gray-800 hover:scale-110 transition-transform"></button>
                  <button className="aspect-square rounded-full bg-green-500 border-2 border-white dark:border-gray-800 hover:scale-110 transition-transform"></button>
                  <button className="aspect-square rounded-full bg-amber-500 border-2 border-white dark:border-gray-800 hover:scale-110 transition-transform"></button>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-[var(--zalama-text)] mb-3">Prévisualisation</h4>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm">Bouton principal</button>
                    <button className="px-4 py-2 rounded-lg border border-blue-500 text-blue-500 dark:text-blue-400 text-sm">Bouton secondaire</button>
                  </div>
                </div>
              </div>
              
              {/* Densité de l'interface */}
              <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6">
                <h3 className="text-lg font-medium text-[var(--zalama-text)] mb-4">Densité de l'interface</h3>
                <p className="text-sm text-[var(--zalama-text)]/70 mb-4">Ajustez l'espacement des éléments de l'interface.</p>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--zalama-border)] cursor-pointer">
                    <input type="radio" name="density" className="w-4 h-4 accent-[var(--zalama-blue)]" defaultChecked />
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">Confortable</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Espacement standard pour une meilleure lisibilité</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--zalama-border)] cursor-pointer">
                    <input type="radio" name="density" className="w-4 h-4 accent-[var(--zalama-blue)]" />
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">Compact</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Espacement réduit pour afficher plus d'informations</p>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Animations */}
              <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6">
                <h3 className="text-lg font-medium text-[var(--zalama-text)] mb-4">Animations</h3>
                <p className="text-sm text-[var(--zalama-text)]/70 mb-4">Contrôlez les animations et les transitions de l'interface.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">Animations de l'interface</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Activer les animations lors des transitions</p>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--zalama-blue)] rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:translate-x-5"></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">Animations des graphiques</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Activer les animations dans les graphiques</p>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--zalama-blue)] rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:translate-x-5"></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">Mode réduit pour les performances</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Réduire les animations pour améliorer les performances</p>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-8">
              <button className="px-6 py-2 rounded-lg bg-[var(--zalama-blue)] text-white flex items-center gap-2 hover:bg-blue-600 transition-colors">
                <Save className="w-4 h-4" />
                <span>Enregistrer les préférences</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'securite' && (
          <div>
            <h2 className="text-xl font-semibold text-[var(--zalama-text)] mb-4">Sécurité</h2>
            <p className="text-[var(--zalama-text)]/70 mb-6">Gérez les paramètres de sécurité de votre compte et modifiez votre mot de passe.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Changement de mot de passe */}
              <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6">
                <h3 className="text-lg font-medium text-[var(--zalama-text)] mb-4">Changer votre mot de passe</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Mot de passe actuel</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Nouveau mot de passe</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--zalama-text)]/70 mb-1">Confirmer le nouveau mot de passe</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="pt-2">
                    <button className="px-4 py-2 rounded-lg bg-[var(--zalama-blue)] text-white flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      <span>Mettre à jour le mot de passe</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Authentification à deux facteurs */}
              <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6">
                <h3 className="text-lg font-medium text-[var(--zalama-text)] mb-4">Authentification à deux facteurs</h3>
                <p className="text-[var(--zalama-text)]/70 mb-4">Renforcez la sécurité de votre compte en activant l'authentification à deux facteurs.</p>
                
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-medium text-[var(--zalama-text)]">Statut</span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Activé</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">Application d'authentification</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Utilisez Google Authenticator, Microsoft Authenticator ou une autre application similaire.</p>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--zalama-blue)] rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:translate-x-5"></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">SMS</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Recevez un code par SMS sur votre téléphone mobile.</p>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform"></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">Email</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Recevez un code par email.</p>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h2 className="text-xl font-semibold text-[var(--zalama-text)] mb-4">Notifications</h2>
            <p className="text-[var(--zalama-text)]/70 mb-6">Gérez vos préférences de notifications.</p>
            {/* Contenu des notifications */}
          </div>
        )}

        {activeTab === 'confidentialite' && (
          <div>
            <h2 className="text-xl font-semibold text-[var(--zalama-text)] mb-4">Confidentialité</h2>
            <p className="text-[var(--zalama-text)]/70 mb-6">Gérez vos paramètres de confidentialité et contrôlez vos données.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Paramètres de confidentialité */}
              <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6">
                <h3 className="text-lg font-medium text-[var(--zalama-text)] mb-4">Paramètres de confidentialité</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">Profil public</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Permettre aux autres entreprises de voir votre profil</p>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--zalama-blue)] rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:translate-x-5"></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">Partage des statistiques</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Partager vos statistiques anonymisées pour améliorer nos services</p>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--zalama-blue)] rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:translate-x-5"></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">Historique des activités</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Conserver l'historique de vos activités sur la plateforme</p>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--zalama-blue)] rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:translate-x-5"></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--zalama-text)]">Cookies de suivi</h4>
                      <p className="text-xs text-[var(--zalama-text)]/70">Autoriser les cookies de suivi pour personnaliser votre expérience</p>
                    </div>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" className="opacity-0 w-0 h-0" />
                      <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform"></span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Gestion des données */}
              <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6">
                <h3 className="text-lg font-medium text-[var(--zalama-text)] mb-4">Gestion des données</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-[var(--zalama-text)] mb-2">Exporter vos données</h4>
                    <p className="text-xs text-[var(--zalama-text)]/70 mb-3">Téléchargez une copie de toutes vos données stockées sur notre plateforme.</p>
                    <button className="px-4 py-2 rounded-lg bg-[var(--zalama-bg-light)] border border-[var(--zalama-border)] text-[var(--zalama-text)] text-sm flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      <span>Exporter les données</span>
                    </button>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-[var(--zalama-text)] mb-2">Supprimer l'historique</h4>
                    <p className="text-xs text-[var(--zalama-text)]/70 mb-3">Effacer l'historique de vos activités sur la plateforme.</p>
                    <button className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700/30 dark:text-amber-400 text-sm flex items-center gap-2">
                      <X className="w-4 h-4" />
                      <span>Effacer l'historique</span>
                    </button>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-[var(--zalama-text)] mb-2">Supprimer le compte</h4>
                    <p className="text-xs text-[var(--zalama-text)]/70 mb-3">Supprimer définitivement votre compte et toutes vos données.</p>
                    <button className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-400 text-sm flex items-center gap-2">
                      <Trash className="w-4 h-4" />
                      <span>Supprimer le compte</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
