'use client';

import { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, Users, CheckCircle } from 'lucide-react';
import { Input, Button, Modal, Checkbox } from '@/components/common';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'organization' | 'content' | 'team' | 'billing';
}

interface Role {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  permissions: string[];
  isSystem: boolean;
}

export default function RolesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const permissions: Permission[] = [
    { id: 'org.view', name: 'View Organization', description: 'View organization settings', category: 'organization' },
    { id: 'org.edit', name: 'Edit Organization', description: 'Modify organization settings', category: 'organization' },
    { id: 'team.view', name: 'View Team', description: 'View team members', category: 'team' },
    { id: 'team.invite', name: 'Invite Members', description: 'Invite new team members', category: 'team' },
    { id: 'team.remove', name: 'Remove Members', description: 'Remove team members', category: 'team' },
    { id: 'content.create', name: 'Create Content', description: 'Create knowledge bases and datasets', category: 'content' },
    { id: 'content.edit', name: 'Edit Content', description: 'Edit existing content', category: 'content' },
    { id: 'content.delete', name: 'Delete Content', description: 'Delete content', category: 'content' },
    { id: 'billing.view', name: 'View Billing', description: 'View billing information', category: 'billing' },
    { id: 'billing.manage', name: 'Manage Billing', description: 'Update payment methods', category: 'billing' },
  ];

  const roles: Role[] = [
    {
      id: '1',
      name: 'Owner',
      description: 'Full access to all organization features',
      memberCount: 1,
      permissions: permissions.map(p => p.id),
      isSystem: true,
    },
    {
      id: '2',
      name: 'Admin',
      description: 'Manage organization and team settings',
      memberCount: 3,
      permissions: ['org.view', 'org.edit', 'team.view', 'team.invite', 'team.remove', 'content.create', 'content.edit', 'content.delete', 'billing.view'],
      isSystem: true,
    },
    {
      id: '3',
      name: 'Content Manager',
      description: 'Create and manage content',
      memberCount: 5,
      permissions: ['content.create', 'content.edit', 'content.delete', 'team.view'],
      isSystem: false,
    },
    {
      id: '4',
      name: 'Viewer',
      description: 'Read-only access',
      memberCount: 8,
      permissions: ['org.view', 'team.view', 'content.view'],
      isSystem: false,
    },
  ];

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Roles & Permissions</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manage roles and their permissions for your organization</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Role
          </Button>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="w-4 h-4 text-[var(--color-aithen-teal)]" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                  {role.isSystem && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700">
                      System
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{role.description}</p>
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{role.memberCount} member{role.memberCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
              {!role.isSystem && (
                <div className="flex items-center space-x-1">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((permId) => {
                  const perm = permissions.find(p => p.id === permId);
                  return perm ? (
                    <span
                      key={permId}
                      className="px-1.5 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700"
                    >
                      {perm.name}
                    </span>
                  ) : null;
                })}
                {role.permissions.length > 3 && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium text-gray-500 dark:text-gray-500">
                    +{role.permissions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setRoleName('');
          setRoleDescription('');
          setSelectedPermissions([]);
        }}
        title="Create Role"
        size="lg"
        footer={
          <div className="flex justify-end space-x-1.5">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setRoleName('');
                setRoleDescription('');
                setSelectedPermissions([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert(`Role "${roleName}" created with ${selectedPermissions.length} permissions`);
                setShowCreateModal(false);
                setRoleName('');
                setRoleDescription('');
                setSelectedPermissions([]);
              }}
              disabled={!roleName.trim() || selectedPermissions.length === 0}
            >
              Create Role
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Role Name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="e.g., Content Manager"
            required
          />
          <Input
            label="Description"
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
            placeholder="Brief description of this role"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permissions
            </label>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {perms.map((perm) => (
                      <Checkbox
                        key={perm.id}
                        label={perm.name}
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        helperText={perm.description}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
