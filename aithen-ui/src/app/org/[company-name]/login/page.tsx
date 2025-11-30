'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { login, type LoginRequest } from '@/api';
import { setUserSession } from '@/lib/session';
import { getBaseUrl } from '@/api/config';
import { Lightbulb, AlertCircle, Mail, Lock, Loader2, ArrowRight, Building2 } from 'lucide-react';
import Image from 'next/image';

interface OrganizationData {
  name: string;
  logo_url: string;
}

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const companyName = params?.['company-name'] as string || '';
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgData, setOrgData] = useState<OrganizationData | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login(formData);
      
      // Login successful - token is automatically stored by the API
      // Store user data in session storage
      if (response.data.user) {
        setUserSession(response.data.user);
      }
      
      // Redirect to home page with org slug
      router.push(companyName ? `/org/${companyName}` : '/');
      router.refresh();
    } catch (err: any) {
      // Handle error
      const errorMessage = err?.data?.error || err?.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch organization data on mount
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!companyName) {
        setIsLoadingOrg(false);
        return;
      }

      try {
        const apiUrl = getBaseUrl();
        // getBaseUrl() returns URL with /api suffix, so we need to remove it and add /orgs
        const baseUrl = apiUrl.replace(/\/api$/, '');
        const response = await fetch(`${baseUrl}/api/orgs/${encodeURIComponent(companyName)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOrgData({
            name: data.name || companyName,
            logo_url: data.logo_url || '',
          });
        } else {
          // If org not found, still show the page but with generic branding
          setOrgData({
            name: companyName,
            logo_url: '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch organization:', err);
        // Fallback to generic branding
        setOrgData({
          name: companyName,
          logo_url: '',
        });
      } finally {
        setIsLoadingOrg(false);
      }
    };

    fetchOrganization();
  }, [companyName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--color-aithen-teal)]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-4 relative z-10">
        {/* Header with Logo */}
        <div className="text-center space-y-2">
          {isLoadingOrg ? (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse mb-1" />
          ) : orgData?.logo_url ? (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 mb-1 overflow-hidden relative">
              <Image
                src={orgData.logo_url}
                alt={`${orgData.name} logo`}
                width={48}
                height={48}
                className="object-contain p-1"
                unoptimized
                onError={() => {
                  // If image fails, fallback will be handled by state
                  setOrgData(prev => prev ? { ...prev, logo_url: '' } : null);
                }}
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-aithen-teal)] to-[var(--color-aithen-teal-dark)] shadow-md shadow-[var(--color-aithen-teal)]/20 mb-1">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-1">
              Welcome Back
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {isLoadingOrg ? (
                'Loading...'
              ) : orgData?.name ? (
                <>Sign in to continue to <span className="font-medium">{orgData.name}</span></>
              ) : (
                'Sign in to continue to Aithen AI'
              )}
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-[var(--color-aithen-teal)]/10 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border-l-3 border-red-500 dark:border-red-400 rounded-lg p-2 flex items-start space-x-1.5 animate-in slide-in-from-top-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300 flex-1">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-3 text-xs bg-gradient-to-r from-[var(--color-aithen-teal)] to-[var(--color-aithen-teal-dark)] hover:from-[var(--color-aithen-teal-dark)] hover:to-[var(--color-aithen-teal)] text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" />
                  <span className="text-xs">Signing in...</span>
                </>
              ) : (
                <>
                  <span className="text-xs">Sign In</span>
                  <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
                <a
                  href={companyName ? `/org/${companyName}/register` : '/register'}
                  className="text-xs font-medium text-[var(--color-aithen-teal)] hover:text-[var(--color-aithen-teal-dark)] transition-colors inline-flex items-center group"
                >
                  Sign up
                  <ArrowRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-500">
          By signing in, you agree to our{' '}
          <a href="#" className="text-[var(--color-aithen-teal)] hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-[var(--color-aithen-teal)] hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
