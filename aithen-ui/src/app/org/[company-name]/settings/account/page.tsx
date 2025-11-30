'use client';

import { useState, useRef } from 'react';
import { User, Camera, X, Mail, Calendar, CheckCircle } from 'lucide-react';
import { Input, Button } from '@/components/common';

export default function AccountPage() {
  const [displayName, setDisplayName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setIsUploading(true);
      // Simulate upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = () => {
    setProfilePicture(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    alert('Account settings saved!');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Account</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Manage your personal account information and profile</p>
      </div>

      <div className="space-y-6">
        {/* Profile Picture */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Profile Picture</h2>
          
          <div className="flex items-start space-x-4">
            <div className="relative">
              {profilePicture ? (
                <div className="relative">
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                  <button
                    onClick={handleRemovePicture}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-aithen-teal)] to-blue-600 flex items-center justify-center text-white text-2xl font-semibold border-2 border-gray-200 dark:border-gray-700">
                  {getInitials(displayName)}
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Upload a profile picture. JPG, PNG or GIF. Max size 5MB.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Camera className="w-3.5 h-3.5" />}
                  disabled={isUploading}
                >
                  {profilePicture ? 'Change Picture' : 'Upload Picture'}
                </Button>
                {profilePicture && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePicture}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-4 h-4 text-[var(--color-aithen-teal)]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Account Information</h2>
          </div>
          
          <div className="space-y-3">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This email is used for account notifications and login
              </p>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Account Details</h2>
          
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">January 1, 2024</p>
              </div>
              
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Account Status</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Delete Account</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    alert('Account deletion requested');
                  }
                }}
              >
                Delete Account
              </Button>
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

