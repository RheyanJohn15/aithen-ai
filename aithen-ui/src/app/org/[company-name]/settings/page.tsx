'use client';

import { useState } from 'react';
import { Settings, Globe, Moon, Sun, Bell, Mail, Calendar, Clock, FileText, Zap } from 'lucide-react';
import { Input, Select, Checkbox, Button, Radio } from '@/components/common';

export default function SettingsPage() {
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('America/New_York');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState('30');

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' },
    { value: 'zh', label: 'Chinese' },
  ];

  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  ];

  const dateFormatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    { value: 'DD MMM YYYY', label: 'DD MMM YYYY' },
  ];

  const timeFormatOptions = [
    { value: '12h', label: '12-hour (3:00 PM)' },
    { value: '24h', label: '24-hour (15:00)' },
  ];

  const autoSaveIntervalOptions = [
    { value: '10', label: '10 seconds' },
    { value: '30', label: '30 seconds' },
    { value: '60', label: '1 minute' },
    { value: '300', label: '5 minutes' },
  ];

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">General Settings</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Manage application preferences and organization settings</p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Moon className="w-4 h-4 text-[var(--color-aithen-teal)]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
              <div className="space-y-2">
                <Radio
                  id="theme-light"
                  name="theme"
                  value="light"
                  checked={theme === 'light'}
                  onChange={(e) => setTheme('light')}
                  label={
                    <span className="flex items-center space-x-2">
                      <Sun className="w-3.5 h-3.5 text-gray-400" />
                      <span>Light</span>
                    </span>
                  }
                />
                <Radio
                  id="theme-dark"
                  name="theme"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme('dark')}
                  label={
                    <span className="flex items-center space-x-2">
                      <Moon className="w-3.5 h-3.5 text-gray-400" />
                      <span>Dark</span>
                    </span>
                  }
                />
                <Radio
                  id="theme-system"
                  name="theme"
                  value="system"
                  checked={theme === 'system'}
                  onChange={(e) => setTheme('system')}
                  label={
                    <span className="flex items-center space-x-2">
                      <Settings className="w-3.5 h-3.5 text-gray-400" />
                      <span>System</span>
                    </span>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="w-4 h-4 text-[var(--color-aithen-teal)]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Localization</h2>
          </div>
          
          <div className="space-y-3">
            <Select
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              options={languageOptions}
            />
            
            <Select
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={timezoneOptions}
            />
            
            <Select
              label="Date Format"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              options={dateFormatOptions}
            />
            
            <Select
              label="Time Format"
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
              options={timeFormatOptions}
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-4 h-4 text-[var(--color-aithen-teal)]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          
          <div className="space-y-3">
            <Checkbox
              label="Email Notifications"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              helperText="Receive notifications via email"
            />
            
            <Checkbox
              label="Push Notifications"
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              helperText="Receive browser push notifications"
            />
            
            <Checkbox
              label="Weekly Digest"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
              helperText="Receive a weekly summary of activity"
            />
            
            <Checkbox
              label="Marketing Emails"
              checked={marketingEmails}
              onChange={(e) => setMarketingEmails(e.target.checked)}
              helperText="Receive product updates and marketing communications"
            />
          </div>
        </div>

        {/* Editor Settings */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-4 h-4 text-[var(--color-aithen-teal)]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Editor Settings</h2>
          </div>
          
          <div className="space-y-3">
            <Checkbox
              label="Auto-save"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              helperText="Automatically save your work as you type"
            />
            
            {autoSave && (
              <Select
                label="Auto-save Interval"
                value={autoSaveInterval}
                onChange={(e) => setAutoSaveInterval(e.target.value)}
                options={autoSaveIntervalOptions}
                disabled={!autoSave}
              />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-4 h-4 text-[var(--color-aithen-teal)]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start">
              <Calendar className="w-3.5 h-3.5 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="w-3.5 h-3.5 mr-2" />
              Download Reports
            </Button>
            <Button variant="outline" className="justify-start">
              <Mail className="w-3.5 h-3.5 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" className="justify-start">
              <Settings className="w-3.5 h-3.5 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account ID</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">acc_1234567890</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">January 1, 2024</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Login</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">2 hours ago</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Status</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-1.5">
          <Button variant="outline">Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
