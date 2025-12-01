'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/navigation/header';
import Sidebar from '@/components/navigation/sidebar';
import { MessageSquare, Settings, ArrowRight, Database, Users, BarChart, Zap } from 'lucide-react';

export default function OrgDashboard() {
  const router = useRouter();
  const params = useParams();
  const companyName = params?.['company-name'] as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSettingsClick = () => {
    router.push(`/org/${companyName}/settings`);
  };

  const handleNewChat = () => {
    router.push(`/org/${companyName}/chat`);
  };

  const quickActions = [
    {
      title: 'Start Chatting',
      description: 'Begin a new conversation with AI',
      icon: MessageSquare,
      href: `/org/${companyName}/chat`,
      color: 'from-[var(--color-aithen-teal)] to-[var(--color-aithen-teal-dark)]',
    },
    {
      title: 'Settings',
      description: 'Manage your organization settings',
      icon: Settings,
      href: `/org/${companyName}/settings`,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Datasets & Training',
      description: 'Manage knowledge bases and training',
      icon: Database,
      href: `/org/${companyName}/settings/datasets`,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Team Members',
      description: 'View and manage your team',
      icon: Users,
      href: `/org/${companyName}/settings/team`,
      color: 'from-green-500 to-green-600',
    },
  ];

  const stats = [
    { label: 'Total Chats', value: '0', icon: MessageSquare },
    { label: 'Team Members', value: '1', icon: Users },
    { label: 'Knowledge Bases', value: '0', icon: Database },
    { label: 'API Calls', value: '0', icon: Zap },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        onNewChat={handleNewChat}
        onSettingsClick={handleSettingsClick}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            {/* Welcome Section */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 font-heading">
                Welcome back
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Get started with your organization workspace
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 font-heading">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => router.push(action.href)}
                      className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:border-[var(--color-aithen-teal)]/50 dark:hover:border-[var(--color-aithen-teal)]/50 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                        <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${action.color} shadow-sm`}>
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 group-hover:text-[var(--color-aithen-teal)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                        {action.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Getting Started */}
            <div className="bg-gradient-to-br from-[var(--color-aithen-teal)]/5 to-[var(--color-aithen-teal)]/10 dark:from-[var(--color-aithen-teal)]/10 dark:to-[var(--color-aithen-teal)]/5 border border-[var(--color-aithen-teal)]/20 dark:border-[var(--color-aithen-teal)]/30 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--color-aithen-teal)]/10 dark:bg-[var(--color-aithen-teal)]/20 flex-shrink-0">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Getting Started
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                    Start by creating your first chat or setting up your organization profile.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      onClick={handleNewChat}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--color-aithen-teal)] hover:bg-[var(--color-aithen-teal-dark)] text-white rounded-lg transition-colors"
                    >
                      Start Chatting
                    </button>
                    <button
                      onClick={handleSettingsClick}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Go to Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
