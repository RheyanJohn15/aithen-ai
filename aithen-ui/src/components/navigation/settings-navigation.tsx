'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Settings, Building2, Users, Shield, Key, Lock, Database, BarChart, CreditCard, User } from 'lucide-react';

interface NavItem {
  path: string; // Relative path without org prefix
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    path: '',
    label: 'General',
    icon: <Settings className="w-4 h-4" />,
  },
  {
    path: '/account',
    label: 'Account',
    icon: <User className="w-4 h-4" />,
  },
  {
    path: '/usage',
    label: 'Usage & Dashboard',
    icon: <BarChart className="w-4 h-4" />,
  },
  {
    path: '/billing',
    label: 'Billing',
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    path: '/organization',
    label: 'Organization',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    path: '/team',
    label: 'Team Members',
    icon: <Users className="w-4 h-4" />,
  },
  {
    path: '/api',
    label: 'API Keys',
    icon: <Key className="w-4 h-4" />,
  },
  {
    path: '/security',
    label: 'Security',
    icon: <Lock className="w-4 h-4" />,
  },
  {
    path: '/roles',
    label: 'Roles & Permissions',
    icon: <Shield className="w-4 h-4" />,
  },
  {
    path: '/datasets',
    label: 'Datasets & Training',
    icon: <Database className="w-4 h-4" />,
  },
];

export default function SettingsNavigation() {
  const pathname = usePathname();
  const params = useParams();
  const companyName = params?.['company-name'] as string || '';

  // Build base path for settings
  const basePath = companyName ? `/org/${companyName}/settings` : '/settings';

  return (
    <nav className="border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-b from-white/95 to-white/80 dark:from-gray-900/95 dark:to-gray-900/80 backdrop-blur-sm shadow-sm">
      <div className="px-4">
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-hide">
          {navItems.map((item) => {
            const href = `${basePath}${item.path}`;
            const isActive = pathname === href || (item.path === '' && pathname === basePath);
            return (
              <Link
                key={item.path}
                href={href}
                className={`
                  group relative flex items-center space-x-2 px-4 py-2.5 text-xs font-medium transition-all duration-200 whitespace-nowrap rounded-lg
                  ${
                    isActive
                      ? 'bg-gradient-to-br from-[var(--color-aithen-teal)]/10 to-[var(--color-aithen-teal)]/5 dark:from-[var(--color-aithen-teal)]/20 dark:to-[var(--color-aithen-teal)]/10 text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)] shadow-sm border border-[var(--color-aithen-teal)]/20 dark:border-[var(--color-aithen-teal)]/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50'
                  }
                `}
              >
                <span className={`
                  transition-all duration-200
                  ${
                    isActive
                      ? 'text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)] scale-110'
                      : 'text-gray-500 dark:text-gray-500 group-hover:text-[var(--color-aithen-teal)] dark:group-hover:text-[var(--color-aithen-teal-light)] group-hover:scale-105'
                  }
                `}>
                  {item.icon}
                </span>
                <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[var(--color-aithen-teal)] to-transparent dark:via-[var(--color-aithen-teal-light)]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}