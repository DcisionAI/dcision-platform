import SettingsLayout from './layout';
import { useState } from 'react';
import { Switch } from '@headlessui/react';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  type: 'email' | 'slack' | 'webhook';
  enabled: boolean;
}

type ChannelType = 'email' | 'slack' | 'webhook';

interface NotificationChannel {
  id: string;
  type: ChannelType;
  value: string;
  verified: boolean;
}

interface NewChannelForm {
  type: ChannelType;
  value: string;
}

export default function NotificationsSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'api_errors',
      title: 'API Errors',
      description: 'Get notified when API errors occur',
      type: 'email',
      enabled: true
    },
    {
      id: 'usage_alerts',
      title: 'Usage Alerts',
      description: 'Receive alerts when approaching usage limits',
      type: 'slack',
      enabled: true
    },
    {
      id: 'new_features',
      title: 'New Features',
      description: 'Stay updated about new features and improvements',
      type: 'email',
      enabled: false
    },
    {
      id: 'security',
      title: 'Security Alerts',
      description: 'Get notified about important security events',
      type: 'email',
      enabled: true
    }
  ]);

  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: 'email_1',
      type: 'email',
      value: 'notifications@dcisionai.com',
      verified: true
    },
    {
      id: 'slack_1',
      type: 'slack',
      value: '#dcisionai-alerts',
      verified: true
    }
  ]);

  const [newChannel, setNewChannel] = useState<NewChannelForm>({
    type: 'email',
    value: ''
  });

  const handleToggleSetting = (id: string) => {
    setSettings(settings.map(setting =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ));
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle adding new notification channel
    const channelId = `${newChannel.type}_${Date.now()}`;
    const newChannelEntry: NotificationChannel = {
      id: channelId,
      type: newChannel.type,
      value: newChannel.value,
      verified: false
    };
    setChannels([...channels, newChannelEntry]);
    setNewChannel({ type: 'email', value: '' });
  };

  const handleRemoveChannel = (id: string) => {
    setChannels(channels.filter(channel => channel.id !== id));
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-docs-heading">Notifications</h1>
          <p className="mt-1 text-sm text-docs-muted">
            Manage your notification preferences and channels
          </p>
        </div>

        {/* Notification Settings */}
        <div className="bg-docs-section rounded-lg border border-docs-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-docs-heading mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              {settings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex-1 pr-4">
                    <h3 className="text-sm font-medium text-docs-text">{setting.title}</h3>
                    <p className="text-sm text-docs-muted">{setting.description}</p>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onChange={() => handleToggleSetting(setting.id)}
                    className={`${
                      setting.enabled ? 'bg-docs-accent' : 'bg-docs-muted'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-docs-accent focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        setting.enabled ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="bg-docs-section rounded-lg border border-docs-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-docs-heading mb-4">Notification Channels</h2>
            
            {/* Add New Channel */}
            <form onSubmit={handleAddChannel} className="mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="channelType" className="block text-sm font-medium text-docs-text">
                    Type
                  </label>
                  <select
                    id="channelType"
                    value={newChannel.type}
                    onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value as ChannelType })}
                    className="mt-1 block w-full rounded-md border-docs-border bg-docs-bg text-docs-text sm:text-sm px-3 py-2"
                  >
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label htmlFor="channelValue" className="block text-sm font-medium text-docs-text">
                    {newChannel.type === 'email' ? 'Email Address' : 
                     newChannel.type === 'slack' ? 'Channel Name' : 'Webhook URL'}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type={newChannel.type === 'email' ? 'email' : 'text'}
                      id="channelValue"
                      value={newChannel.value}
                      onChange={(e) => setNewChannel({ ...newChannel, value: e.target.value })}
                      className="block w-full rounded-md border-docs-border bg-docs-bg text-docs-text sm:text-sm px-3 py-2"
                      placeholder={
                        newChannel.type === 'email' ? 'notifications@company.com' :
                        newChannel.type === 'slack' ? '#alerts' :
                        'https://webhook.site/...'
                      }
                    />
                    <button
                      type="submit"
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-docs-accent hover:bg-docs-accent/90"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Channels List */}
            <div className="space-y-4">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-4 border border-docs-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-docs-text capitalize">
                      {channel.type}:
                    </span>
                    <span className="text-sm text-docs-text">{channel.value}</span>
                    {channel.verified && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    {!channel.verified && (
                      <button
                        type="button"
                        className="text-sm text-docs-accent hover:text-docs-accent/90"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveChannel(channel.id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Remove
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