import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  total?: number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    icon: 'text-green-600 dark:text-green-400'
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    icon: 'text-yellow-600 dark:text-yellow-400'
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    icon: 'text-red-600 dark:text-red-400'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-600 dark:text-purple-400'
  }
};

export default function StatCard({ 
  title, 
  value, 
  total, 
  icon: Icon, 
  trend, 
  trendDirection = 'up',
  color = 'blue' 
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {value}
              </p>
              {total && (
                <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  / {total}
                </p>
              )}
            </div>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${
            trendDirection === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            <span className={trendDirection === 'up' ? 'rotate-0' : 'rotate-180'}>
              ↗
            </span>
            <span className="ml-1">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
}
