'use client';

import { useState } from 'react';
import { Users, UserPlus, Mail, Shield, MoreVertical, Search, Filter, Trash2, Edit2 } from 'lucide-react';
import { Input, Button, Modal, Select } from '@/components/common';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  joinedAt: string;
  lastActive?: string;
}

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'owner',
      status: 'active',
      joinedAt: '2024-01-01',
      lastActive: '2024-01-15',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'admin',
      status: 'active',
      joinedAt: '2024-01-05',
      lastActive: '2024-01-15',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'member',
      status: 'invited',
      joinedAt: '2024-01-10',
    },
    {
      id: '4',
      name: 'Alice Williams',
      email: 'alice@example.com',
      role: 'viewer',
      status: 'active',
      joinedAt: '2024-01-12',
      lastActive: '2024-01-14',
    },
  ];

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'member', label: 'Member' },
    { value: 'viewer', label: 'Viewer' },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'admin':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'member':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'viewer':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'invited':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'suspended':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Team Members</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manage your organization's team members and their permissions</p>
          </div>
          <Button
            onClick={() => setShowInviteModal(true)}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Invite Member
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex items-center space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)]"
          />
        </div>
        <button className="flex items-center space-x-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>
      </div>

      {/* Team Members List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-aithen-teal)] flex items-center justify-center text-white text-sm font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <Mail className="w-3 h-3" />
                      <span>{member.email}</span>
                      <span>•</span>
                      <span>Joined {member.joinedAt}</span>
                      {member.lastActive && (
                        <>
                          <span>•</span>
                          <span>Active {member.lastActive}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {member.role !== 'owner' && (
                    <button className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteRole('member');
        }}
        title="Invite Team Member"
        size="md"
        footer={
          <div className="flex justify-end space-x-1.5">
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteModal(false);
                setInviteEmail('');
                setInviteRole('member');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // Handle invite
                alert(`Invitation sent to ${inviteEmail}`);
                setShowInviteModal(false);
                setInviteEmail('');
                setInviteRole('member');
              }}
              disabled={!inviteEmail.trim()}
            >
              Send Invitation
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
            required
          />
          <Select
            label="Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
            options={roleOptions}
            required
          />
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Admin:</strong> Full access to organization settings and team management
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              <strong>Member:</strong> Can create and manage content, limited settings access
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              <strong>Viewer:</strong> Read-only access to organization content
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
