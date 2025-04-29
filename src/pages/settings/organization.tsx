import SettingsLayout from './layout';
import { useState } from 'react';

export default function OrganizationSettings() {
  const [orgName, setOrgName] = useState('DcisionAI');
  const [orgDomain, setOrgDomain] = useState('dcisionai.com');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Updating organization settings:', { orgName, orgDomain });
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-docs-heading">Organization Settings</h1>
          <p className="mt-1 text-sm text-docs-muted">
            Manage your organization's settings and preferences
          </p>
        </div>

        <div className="bg-docs-section rounded-lg border border-docs-border">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Name */}
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-docs-text">
                  Organization Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="block w-full rounded-md border-docs-border bg-docs-bg shadow-sm text-docs-text sm:text-sm px-3 py-2"
                  />
                </div>
                <p className="mt-2 text-sm text-docs-muted">
                  This is your organization's display name within DcisionAI
                </p>
              </div>

              {/* Organization Domain */}
              <div>
                <label htmlFor="orgDomain" className="block text-sm font-medium text-docs-text">
                  Organization Domain
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="orgDomain"
                    value={orgDomain}
                    onChange={(e) => setOrgDomain(e.target.value)}
                    className="block w-full rounded-md border-docs-border bg-docs-bg shadow-sm text-docs-text sm:text-sm px-3 py-2"
                  />
                </div>
                <p className="mt-2 text-sm text-docs-muted">
                  The domain associated with your organization
                </p>
              </div>

              {/* Organization ID */}
              <div>
                <label className="block text-sm font-medium text-docs-text">
                  Organization ID
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <code className="flex-1 block rounded-md border-docs-border bg-docs-bg text-docs-text px-3 py-2 text-sm font-mono">
                    org_6RNbVk2PH1xnlF3Y
                  </code>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-docs-border rounded-md text-sm font-medium text-docs-text hover:bg-docs-hover"
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-2 text-sm text-docs-muted">
                  Use this ID when making API requests on behalf of your organization
                </p>
              </div>

              {/* Danger Zone */}
              <div className="pt-6">
                <h3 className="text-sm font-medium text-red-500">Danger Zone</h3>
                <div className="mt-3 space-y-4">
                  <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800">Delete Organization</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            Once you delete your organization, there is no going back. Please be certain.
                          </p>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-docs-accent hover:bg-docs-accent/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
} 