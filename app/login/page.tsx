"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, session, loading } = useAuth();
  const router = useRouter();

  // Redirection automatique si déjà connecté
  React.useEffect(() => {
    if (!loading && session?.admin && session?.partner) {
      console.log('User already authenticated, redirecting to dashboard');
      toast.success('Redirection vers le dashboard...');
      router.push('/dashboard');
    }
  }, [session, loading, router]);

  // Afficher un loader si on vérifie la session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error, session: newSession } = await signIn(email, password);
      
      if (error) {
        console.error('Erreur de connexion:', error);
        toast.error(error.message || 'Erreur de connexion');
      } else if (newSession) {
        toast.success(`Connexion réussie ! Bienvenue ${newSession.admin.display_name}`);
        
        // Attendre un court délai pour s'assurer que la session est bien stockée
        setTimeout(() => {
          console.log('Redirecting to dashboard...');
          router.push('/dashboard');
        }, 500);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast.error('Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const createTestUsers = async () => {
    try {
      setIsLoading(true);
      toast.info('Création des utilisateurs de test en cours...');
      
      // Appeler l'API pour créer les utilisateurs
      const response = await fetch('/api/create-test-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Utilisateurs de test créés avec succès !');
      } else {
        const error = await response.text();
        toast.error(`Erreur : ${error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création des utilisateurs:', error);
      toast.error('Erreur lors de la création des utilisateurs de test');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Connexion Administrateur
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Accédez au tableau de bord partenaire
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className='text-center text-2xl font-bold'>Connexion</CardTitle>
            <CardDescription>
              Utilisez vos identifiants administrateur pour accéder au dashboard
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                type="email"
                  placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
              />
            </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
                  <Input
                id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
              />
                  <Button
                type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
            </div>
          </div>

              <Alert className='mt-4'>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <p>Seuls les utilisateurs avec les rôles <strong>RH</strong> ou <strong>Responsable</strong> peuvent accéder au dashboard.</p>
                </AlertDescription>
              </Alert>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 mt-4">
              <Button
              type="submit"
                className="w-full"
              disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connexion...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Se connecter
          </div>
                )}
              </Button>
              
            </CardFooter>
        </form>
        </Card>
      </div>
    </div>
  );
}
