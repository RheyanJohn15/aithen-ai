'use client';

import { useState } from 'react';
import { Lock, Shield, Key, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Input, Button, Checkbox } from '@/components/common';

export default function SecurityPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [requireMFA, setRequireMFA] = useState(false);

  const securitySettings = [
    {
      title: 'Password Requirements',
      description: 'Configure password complexity requirements',
      icon: <Lock className="w-4 h-4" />,
    },
    {
      title: 'Session Management',
      description: 'Manage session timeouts and active sessions',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      title: 'Two-Factor Authentication',
      description: 'Enable 2FA for enhanced security',
      icon: <Key className="w-4 h-4" />,
    },
  ];

  const activeSessions = [
    { id: '1', device: 'Chrome on Windows', location: 'New York, US', lastActive: '2 minutes ago', current: true },
    { id: '2', device: 'Safari on Mac', location: 'San Francisco, US', lastActive: '1 hour ago', current: false },
    { id: '3', device: 'Mobile App', location: 'Los Angeles, US', lastActive: '3 days ago', current: false },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Security</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Manage your organization's security settings and policies</p>
      </div>

      <div className="space-y-6">
        {/* Change Password */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
          <div className="space-y-3">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                rightIcon={showCurrentPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowCurrentPassword(!showCurrentPassword)}
              />
            </div>
            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                rightIcon={showNewPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowNewPassword(!showNewPassword)}
                helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
              />
            </div>
            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                rightIcon={showConfirmPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>
            <Button variant="primary" disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}>
              Update Password
            </Button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h2>
          <div className="space-y-4">
            <Checkbox
              label="Enable Two-Factor Authentication"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              helperText="Require a second authentication factor for all users"
            />
            <Checkbox
              label="Require MFA for Admin Actions"
              checked={requireMFA}
              onChange={(e) => setRequireMFA(e.target.checked)}
              helperText="Additional verification required for sensitive operations"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Session Timeout (minutes)
              </label>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)]"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Active Sessions</h2>
          <div className="space-y-2">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{session.device}</p>
                    {session.current && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{session.location}</span>
                    <span>•</span>
                    <span>{session.lastActive}</span>
                  </div>
                </div>
                {!session.current && (
                  <Button variant="ghost" size="sm">
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Recommendations */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Security Recommendations</h3>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Enable two-factor authentication for all team members</li>
                <li>Review and revoke unused active sessions regularly</li>
                <li>Use strong, unique passwords for all accounts</li>
                <li>Keep session timeout settings appropriate for your security needs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
