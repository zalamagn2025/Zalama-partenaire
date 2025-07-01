import { Notification } from './types';

// Service pour récupérer les vraies notifications depuis la base de données
import { supabase } from '@/lib/supabase';
import { NotificationService } from '@/lib/services';

export const getNotifications = async (partnerId: string): Promise<Notification[]> => {
  try {
    return await NotificationService.getNotifications(partnerId);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return [];
  }
};
