'use client';

import { useState } from 'react';
import { Building2, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { Input, Textarea, Button } from '@/components/common';

export default function OrganizationPage() {
  const [orgName, setOrgName] = useState('Acme Corporation');
  const [orgSlug, setOrgSlug] = useState('acme-corp');
  const [description, setDescription] = useState('Leading technology solutions provider');
  const [website, setWebsite] = useState('https://acme.com');
  const [email, setEmail] = useState('contact@acme.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [address, setAddress] = useState('123 Tech Street, San Francisco, CA 94105');

  const handleSave = () => {
    alert('Organization settings saved!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Organization</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Manage your organization's profile and settings</p>
      </div>

      <div className="space-y-6">
        {/* Organization Profile */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Building2 className="w-4 h-4 text-[var(--color-aithen-teal)]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Organization Profile</h2>
          </div>
          
          <div className="space-y-3">
            <Input
              label="Organization Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization Slug
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">aithen.ai/org/</span>
                <Input
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="organization-slug"
                  className="flex-1"
                />
              </div>
            </div>

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of your organization"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Mail className="w-4 h-4 text-[var(--color-aithen-teal)]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Contact Information</h2>
          </div>
          
          <div className="space-y-3">
            <Input
              label="Website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              leftIcon={Globe}
              placeholder="https://example.com"
            />
            
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={Mail}
              placeholder="contact@example.com"
            />
            
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={Phone}
              placeholder="+1 (555) 123-4567"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                </div>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Street address, City, State, ZIP"
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Organization Stats */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Organization Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Team Members</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">17</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Knowledge Bases</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">8</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">API Requests</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">125K</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Storage Used</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">125 GB</p>
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
