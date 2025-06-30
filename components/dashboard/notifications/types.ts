export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  link?: string;
}
