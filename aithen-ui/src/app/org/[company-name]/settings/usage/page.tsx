'use client';

import { BarChart, TrendingUp, Activity, Zap, Clock, Database } from 'lucide-react';

interface UsageStat {
  label: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

interface UsageData {
  period: string;
  requests: number;
  tokens: number;
  storage: number;
  trainingHours: number;
}

export default function UsagePage() {
  const currentUsage: UsageData = {
    period: 'January 2024',
    requests: 125000,
    tokens: 4500000,
    storage: 125.5,
    trainingHours: 12.5,
  };

  const previousUsage: UsageData = {
    period: 'December 2023',
    requests: 98000,
    tokens: 3200000,
    storage: 98.2,
    trainingHours: 8.3,
  };

  const usageStats: UsageStat[] = [
    {
      label: 'API Requests',
      value: currentUsage.requests.toLocaleString(),
      change: `+${((currentUsage.requests - previousUsage.requests) / previousUsage.requests * 100).toFixed(1)}%`,
      icon: <Zap className="w-4 h-4" />,
      color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'Tokens Used',
      value: `${(currentUsage.tokens / 1000000).toFixed(1)}M`,
      change: `+${((currentUsage.tokens - previousUsage.tokens) / previousUsage.tokens * 100).toFixed(1)}%`,
      icon: <Activity className="w-4 h-4" />,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Storage Used',
      value: `${currentUsage.storage} GB`,
      change: `+${((currentUsage.storage - previousUsage.storage) / previousUsage.storage * 100).toFixed(1)}%`,
      icon: <Database className="w-4 h-4" />,
      color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Training Hours',
      value: `${currentUsage.trainingHours} hrs`,
      change: `+${((currentUsage.trainingHours - previousUsage.trainingHours) / previousUsage.trainingHours * 100).toFixed(1)}%`,
      icon: <Clock className="w-4 h-4" />,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  const dailyUsage = [
    { date: 'Jan 1', requests: 3200, tokens: 120000 },
    { date: 'Jan 5', requests: 4100, tokens: 145000 },
    { date: 'Jan 10', requests: 3800, tokens: 135000 },
    { date: 'Jan 15', requests: 4500, tokens: 165000 },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Usage & Dashboard</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Monitor your organization's API usage and resource consumption</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {usageStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
              {stat.change && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center space-x-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>{stat.change}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Usage Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* API Requests Chart */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">API Requests</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">{currentUsage.period}</span>
          </div>
          <div className="space-y-2">
            {dailyUsage.map((day) => (
              <div key={day.date} className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-12">{day.date}</span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[var(--color-aithen-teal)] h-2 rounded-full"
                    style={{ width: `${(day.requests / 5000) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 w-16 text-right">{day.requests.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tokens Usage Chart */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Tokens Used</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">{currentUsage.period}</span>
          </div>
          <div className="space-y-2">
            {dailyUsage.map((day) => (
              <div key={day.date} className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-12">{day.date}</span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(day.tokens / 200000) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 w-20 text-right">{(day.tokens / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Limits */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Usage Limits</h2>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>API Requests</span>
              <span>125,000 / 500,000</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-[var(--color-aithen-teal)] h-1.5 rounded-full" style={{ width: '25%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Storage</span>
              <span>125.5 GB / 500 GB</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '25.1%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Training Hours</span>
              <span>12.5 / 100 hrs</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '12.5%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
