'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register, type RegisterRequest } from '@/api';
import { setUserSession } from '@/lib/session';
import { UserPlus, AlertCircle, User, Mail, Lock, Shield, Loader2, ArrowRight, Building2, Globe, Phone, MapPin, Image as ImageIcon } from 'lucide-react';

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'user' | 'organization'>('user');
  const [formData, setFormData] = useState<RegisterRequest & { confirmPassword: string }>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization_name: '',
    organization_slug: '',
    organization_description: '',
    organization_website: '',
    organization_email: '',
    organization_phone: '',
    organization_address: '',
    organization_logo_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateUserForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateOrganizationForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.organization_name || formData.organization_name.trim().length < 2) {
      errors.organization_name = 'Organization name must be at least 2 characters long';
    }

    if (formData.organization_website && !/^https?:\/\/.+\..+/.test(formData.organization_website)) {
      errors.organization_website = 'Please enter a valid website URL';
    }

    if (formData.organization_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.organization_email)) {
      errors.organization_email = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (validateUserForm()) {
      setCurrentStep('organization');
    }
  };

  const handleOrganizationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-generate slug when organization name changes
      ...(field === 'organization_name' ? { organization_slug: generateSlug(value) } : {}),
    }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!validateOrganizationForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      // Ensure slug is generated if not provided
      if (!registerData.organization_slug) {
        registerData.organization_slug = generateSlug(registerData.organization_name);
      }
      
      const response = await register(registerData);
      
      // Registration successful - token is automatically stored by the API
      // Store user data in session storage
      if (response.data.user) {
        setUserSession(response.data.user);
      }
      
      // Redirect to organization chat page
      const orgSlug = registerData.organization_slug || generateSlug(registerData.organization_name);
      router.push(`/org/${orgSlug}/chat`);
      router.refresh();
    } catch (err: any) {
      // Handle error
      const errorMessage = err?.data?.error || err?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('organization_')) {
      handleOrganizationChange(name, value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
      // Clear error when user starts typing
      if (error) setError(null);
      // Clear validation error for this field
      if (validationErrors[name]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--color-aithen-teal)]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl w-full space-y-3 sm:space-y-4 relative z-10">
        {/* Header with Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[var(--color-aithen-teal)] to-[var(--color-aithen-teal-dark)] shadow-md shadow-[var(--color-aithen-teal)]/20 mb-1">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-heading font-semibold text-gray-900 dark:text-white mb-1">
              {currentStep === 'user' ? 'Create Account' : 'Set Up Your Organization'}
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 px-2">
              {currentStep === 'user' 
                ? 'Join Aithen AI and start your journey'
                : 'Complete your organization profile to get started'}
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-1.5 px-4">
          <div className={`h-1 rounded-full transition-all duration-300 ${currentStep === 'user' ? 'w-6 bg-[var(--color-aithen-teal)]' : 'w-3 bg-gray-300 dark:bg-gray-600'}`} />
          <div className={`h-1 rounded-full transition-all duration-300 ${currentStep === 'organization' ? 'w-6 bg-[var(--color-aithen-teal)]' : 'w-3 bg-gray-300 dark:bg-gray-600'}`} />
        </div>

        {/* Register Form */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg p-4 sm:p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-[var(--color-aithen-teal)]/10 transition-all duration-300">
          {currentStep === 'user' ? (
            <form onSubmit={handleUserSubmit} className="space-y-3">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border-l-3 border-red-500 dark:border-red-400 rounded-lg p-2 flex items-start space-x-1.5 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300 flex-1">{error}</p>
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200 ${
                      validationErrors.name
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="John Doe"
                    disabled={isLoading}
                    suppressHydrationWarning
                  />
                </div>
                {validationErrors.name && (
                  <p className="mt-0.5 text-xs text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
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
                    className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200 ${
                      validationErrors.email
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    suppressHydrationWarning
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-0.5 text-xs text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
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
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200 ${
                      validationErrors.password
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="At least 6 characters"
                    disabled={isLoading}
                    suppressHydrationWarning
                  />
                </div>
                {validationErrors.password && (
                  <p className="mt-0.5 text-xs text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Shield className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200 ${
                      validationErrors.confirmPassword
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    suppressHydrationWarning
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <p className="mt-0.5 text-xs text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-3 text-xs bg-gradient-to-r from-[var(--color-aithen-teal)] to-[var(--color-aithen-teal-dark)] hover:from-[var(--color-aithen-teal-dark)] hover:to-[var(--color-aithen-teal)] text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow-md"
              >
                <span className="text-xs">Continue</span>
                <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border-l-3 border-red-500 dark:border-red-400 rounded-lg p-2 flex items-start space-x-1.5 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300 flex-1">{error}</p>
                </div>
              )}

              {/* Organization Name */}
              <div className="space-y-1">
                <label htmlFor="organization_name" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    id="organization_name"
                    name="organization_name"
                    type="text"
                    required
                    value={formData.organization_name}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200 ${
                      validationErrors.organization_name
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Acme Corporation"
                    disabled={isLoading}
                    suppressHydrationWarning
                  />
                </div>
                {validationErrors.organization_name && (
                  <p className="mt-0.5 text-xs text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.organization_name}</span>
                  </p>
                )}
              </div>

              {/* Organization Slug */}
              <div className="space-y-1">
                <label htmlFor="organization_slug" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Organization Slug
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-400">aithen.ai/org/</span>
                  </div>
                  <input
                    id="organization_slug"
                    name="organization_slug"
                    type="text"
                    value={formData.organization_slug}
                    onChange={handleChange}
                    className="w-full pl-24 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200"
                    placeholder="acme-corp"
                    disabled={isLoading}
                    suppressHydrationWarning
                  />
                </div>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Auto-generated from organization name. You can customize it.
                </p>
              </div>

              {/* Organization Description */}
              <div className="space-y-1">
                <label htmlFor="organization_description" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="organization_description"
                  name="organization_description"
                  value={formData.organization_description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200 resize-none"
                  placeholder="Brief description of your organization..."
                  disabled={isLoading}
                  suppressHydrationWarning
                />
              </div>

              {/* Organization Website */}
              <div className="space-y-1">
                <label htmlFor="organization_website" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Website
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Globe className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    id="organization_website"
                    name="organization_website"
                    type="url"
                    value={formData.organization_website}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200 ${
                      validationErrors.organization_website
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="https://example.com"
                    disabled={isLoading}
                    suppressHydrationWarning
                  />
                </div>
                {validationErrors.organization_website && (
                  <p className="mt-0.5 text-xs text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.organization_website}</span>
                  </p>
                )}
              </div>

              {/* Organization Email */}
              <div className="space-y-1">
                <label htmlFor="organization_email" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Organization Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    id="organization_email"
                    name="organization_email"
                    type="email"
                    value={formData.organization_email}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200 ${
                      validationErrors.organization_email
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="contact@example.com"
                    disabled={isLoading}
                    suppressHydrationWarning
                  />
                </div>
                {validationErrors.organization_email && (
                  <p className="mt-0.5 text-xs text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.organization_email}</span>
                  </p>
                )}
              </div>

              {/* Organization Phone */}
              <div className="space-y-1">
                <label htmlFor="organization_phone" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    id="organization_phone"
                    name="organization_phone"
                    type="tel"
                    value={formData.organization_phone}
                    onChange={handleChange}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                    disabled={isLoading}
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Organization Address */}
              <div className="space-y-1">
                <label htmlFor="organization_address" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none top-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <textarea
                    id="organization_address"
                    name="organization_address"
                    value={formData.organization_address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200 resize-none"
                    placeholder="Street address, City, State, ZIP"
                    disabled={isLoading}
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('user')}
                  disabled={isLoading}
                  className="flex-1 py-2 px-3 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 px-3 text-xs bg-gradient-to-r from-[var(--color-aithen-teal)] to-[var(--color-aithen-teal-dark)] hover:from-[var(--color-aithen-teal-dark)] hover:to-[var(--color-aithen-teal)] text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" />
                      <span className="text-xs">Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs">Create Account</span>
                      <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          {currentStep === 'user' && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or</span>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <a
                    href="/login"
                    className="text-xs font-medium text-[var(--color-aithen-teal)] hover:text-[var(--color-aithen-teal-dark)] transition-colors inline-flex items-center group"
                  >
                    Sign in
                    <ArrowRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-500 px-2">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-[var(--color-aithen-teal)] hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-[var(--color-aithen-teal)] hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
