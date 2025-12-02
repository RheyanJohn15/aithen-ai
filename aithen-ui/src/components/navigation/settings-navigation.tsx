'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { Settings, Building2, Users, Shield, Key, Lock, Database, BarChart, CreditCard, User, ArrowLeft } from 'lucide-react';

interface NavItem {
  path: string; // Relative path without org prefix
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    path: '',
    label: 'General',
    icon: Settings,
  },
  {
    path: '/account',
    label: 'Account',
    icon: User,
  },
  {
    path: '/usage',
    label: 'Usage & Dashboard',
    icon: BarChart,
  },
  {
    path: '/billing',
    label: 'Billing',
    icon: CreditCard,
  },
  {
    path: '/organization',
    label: 'Organization',
    icon: Building2,
  },
  {
    path: '/team',
    label: 'Team Members',
    icon: Users,
  },
  {
    path: '/api',
    label: 'API Keys',
    icon: Key,
  },
  {
    path: '/security',
    label: 'Security',
    icon: Lock,
  },
  {
    path: '/roles',
    label: 'Roles & Permissions',
    icon: Shield,
  },
  {
    path: '/datasets',
    label: 'Datasets & Training',
    icon: Database,
  },
];

export default function SettingsNavigation() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const companyName = params?.['company-name'] as string || '';

  // Build base path for settings
  const basePath = companyName ? `/org/${companyName}/settings` : '/settings';
  const backPath = companyName ? `/org/${companyName}` : '/';

  const handleBack = () => {
    router.push(backPath);
  };

  return (
    <nav className="border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-b from-white/95 to-white/80 dark:from-gray-900/95 dark:to-gray-900/80 backdrop-blur-sm shadow-sm">
      <div className="px-2 sm:px-4">
        {/* Mobile: Back button and title row */}
        <div className="flex items-center justify-between py-2 sm:hidden border-b border-gray-200/60 dark:border-gray-700/60 mb-2">
          <button
            onClick={handleBack}
            className="flex items-center space-x-1.5 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-lg transition-colors min-w-[44px]"
            aria-label="Back to dashboard"
            suppressHydrationWarning
          >
            <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Back</span>
          </button>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">Settings</span>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Navigation items */}
        <div className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-hide -mx-2 sm:mx-0 px-2 sm:px-0">
          {/* Desktop: Back button */}
          <button
            onClick={handleBack}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-lg transition-colors border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50 flex-shrink-0"
            aria-label="Back to dashboard"
            suppressHydrationWarning
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden md:inline">Back</span>
          </button>

          {/* All navigation items - horizontal scroll on mobile */}
          {navItems.map((item) => {
            const href = `${basePath}${item.path}`;
            const isActive = pathname === href || (item.path === '' && pathname === basePath);
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                href={href}
                className={`
                  group relative flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 text-xs font-medium transition-all duration-200 whitespace-nowrap rounded-lg flex-shrink-0 min-w-[44px] sm:min-w-0
                  ${
                    isActive
                      ? 'bg-gradient-to-br from-[var(--color-aithen-teal)]/10 to-[var(--color-aithen-teal)]/5 dark:from-[var(--color-aithen-teal)]/20 dark:to-[var(--color-aithen-teal)]/10 text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)] shadow-sm border border-[var(--color-aithen-teal)]/20 dark:border-[var(--color-aithen-teal)]/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50'
                  }
                `}
              >
                <span className={`
                  transition-all duration-200 flex-shrink-0
                  ${
                    isActive
                      ? 'text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)] scale-110'
                      : 'text-gray-500 dark:text-gray-500 group-hover:text-[var(--color-aithen-teal)] dark:group-hover:text-[var(--color-aithen-teal-light)] group-hover:scale-105'
                  }
                `}>
                  <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <span className={`font-medium ${isActive ? 'font-semibold' : ''} hidden sm:inline`}>
                  {item.label}
                </span>
                {/* Mobile: Show shortened label */}
                <span className={`font-medium ${isActive ? 'font-semibold' : ''} sm:hidden`}>
                  {item.label.split(' ')[0]}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 sm:w-8 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[var(--color-aithen-teal)] to-transparent dark:via-[var(--color-aithen-teal-light)]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}