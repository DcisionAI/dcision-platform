import SettingsLayout from './layout';
import { useState } from 'react';
import { UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export default function TeamSettings() {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamMember['role']>('member');
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'user_1',
      name: 'John Doe',
      email: 'john@dcisionai.com',
      role: 'admin',
      joinedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'user_2',
      name: 'Jane Smith',
      email: 'jane@dcisionai.com',
      role: 'member',
      joinedAt: '2024-02-15T00:00:00Z'
    }
  ]);

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle member invitation
    console.log('Inviting new member:', { email: newMemberEmail, role: newMemberRole });
    setNewMemberEmail('');
    setNewMemberRole('member');
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(member => member.id !== id));
  };

  const handleRoleChange = (id: string, newRole: TeamMember['role']) => {
    setMembers(members.map(member =>
      member.id === id ? { ...member, role: newRole } : member
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-docs-heading">Team Members</h1>
          <p className="mt-1 text-sm text-docs-muted">
            Manage your team members and their access levels
          </p>
        </div>

        {/* Invite New Member */}
        <div className="bg-docs-section rounded-lg border border-docs-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-docs-heading mb-4">Invite New Member</h2>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-docs-text">
                    Email Address
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      id="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="block w-full rounded-md border-docs-border bg-docs-bg shadow-sm text-docs-text sm:text-sm px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-docs-text">
                    Role
                  </label>
                  <div className="mt-1">
                    <select
                      id="role"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as TeamMember['role'])}
                      className="block w-full rounded-md border-docs-border bg-docs-bg shadow-sm text-docs-text sm:text-sm px-3 py-2"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-docs-accent hover:bg-docs-accent/90"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-docs-section rounded-lg border border-docs-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-docs-heading mb-4">Current Team Members</h2>
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-docs-border rounded-lg"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-docs-text">{member.name}</h3>
                    <div className="text-sm text-docs-muted">{member.email}</div>
                    <div className="text-xs text-docs-muted">
                      Joined {formatDate(member.joinedAt)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as TeamMember['role'])}
                      className="rounded-md border-docs-border bg-docs-bg text-docs-text text-sm px-3 py-1"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-docs-muted hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
} 