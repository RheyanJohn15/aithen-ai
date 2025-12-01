'use client';

import { useState } from 'react';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { Input, Button, Modal } from '@/components/common';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed?: string;
  createdAt: string;
  isVisible: boolean;
}

export default function ApiPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'aithen_live_sk_1234567890abcdef1234567890abcdef',
      lastUsed: '2 hours ago',
      createdAt: '2024-01-01',
      isVisible: false,
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'aithen_dev_sk_abcdef1234567890abcdef1234567890',
      lastUsed: '1 day ago',
      createdAt: '2024-01-10',
      isVisible: false,
    },
  ]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const maskKey = (key: string) => {
    return key.substring(0, 20) + '•'.repeat(20) + key.substring(key.length - 8);
  };

  const copyToClipboard = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setApiKeys((keys) =>
      keys.map((k) => (k.id === keyId ? { ...k, isVisible: !k.isVisible } : k))
    );
  };

  const handleCreateKey = () => {
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: keyName,
      key: `aithen_sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date().toISOString().split('T')[0],
      isVisible: true,
    };
    setApiKeys([...apiKeys, newKey]);
    setKeyName('');
    setShowCreateModal(false);
  };

  const handleDeleteKey = (keyId: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      setApiKeys(apiKeys.filter((k) => k.id !== keyId));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">API Keys</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manage your API keys for programmatic access</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto flex-shrink-0"
          >
            Create API Key
          </Button>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-4 sm:mb-6 p-2.5 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Keep your API keys secure</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Never share your API keys publicly. Treat them like passwords. If a key is compromised, delete it immediately and create a new one.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys List */}
      <div className="space-y-2 sm:space-y-3">
        {apiKeys.map((apiKey) => (
          <div
            key={apiKey.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-aithen-teal)] flex-shrink-0" />
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{apiKey.name}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                  <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-white break-all min-w-0 flex-1">
                    {apiKey.isVisible ? apiKey.key : maskKey(apiKey.key)}
                  </code>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
                      aria-label={apiKey.isVisible ? "Hide key" : "Show key"}
                    >
                      {apiKey.isVisible ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                      className="p-1 text-gray-400 hover:text-[var(--color-aithen-teal)] rounded transition-colors"
                      aria-label="Copy key"
                    >
                      {copiedKey === apiKey.id ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>Created {apiKey.createdAt}</span>
                  </div>
                  {apiKey.lastUsed && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span>Last used {apiKey.lastUsed}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteKey(apiKey.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                aria-label="Delete key"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {apiKeys.length === 0 && (
          <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4">
            <Key className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No API keys yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Create your first API key to get started</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto"
            >
              Create API Key
            </Button>
          </div>
        )}
      </div>

      {/* API Documentation */}
      <div className="mt-4 sm:mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <h2 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">API Documentation</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">
          Learn how to use your API keys to integrate Aithen AI into your applications.
        </p>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          View Documentation
        </Button>
      </div>

      {/* Create API Key Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setKeyName('');
        }}
        title="Create API Key"
        size="md"
        footer={
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-1.5">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setKeyName('');
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateKey}
              disabled={!keyName.trim()}
              className="w-full sm:w-auto"
            >
              Create Key
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Key Name"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="e.g., Production API Key"
            required
          />
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Important:</strong> Copy your API key immediately after creation. You won't be able to see it again.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
