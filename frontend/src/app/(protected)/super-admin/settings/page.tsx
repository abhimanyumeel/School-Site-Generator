'use client';

import { useState } from 'react';
import { Switch } from '@headlessui/react';
import { 
  BellIcon, 
  EnvelopeIcon, 
  GlobeAltIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface Settings {
  notifications: {
    emailAlerts: boolean;
    websiteUpdates: boolean;
    newSchoolRegistrations: boolean;
    securityAlerts: boolean;
  };
  email: {
    supportEmail: string;
    notificationEmail: string;
    defaultReplyTo: string;
  };
  website: {
    maxUploadSize: number;
    allowedFileTypes: string[];
    defaultLanguage: string;
    maintenanceMode: boolean;
  };
  security: {
    requireMFA: boolean;
    sessionTimeout: number;
    passwordExpiration: number;
    ipWhitelist: string[];
  };
  schools: {
    autoApproveRegistrations: boolean;
    defaultWebsiteLimit: number;
    requireVerification: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      emailAlerts: true,
      websiteUpdates: true,
      newSchoolRegistrations: true,
      securityAlerts: true
    },
    email: {
      supportEmail: 'support@example.com',
      notificationEmail: 'notifications@example.com',
      defaultReplyTo: 'no-reply@example.com'
    },
    website: {
      maxUploadSize: 10,
      allowedFileTypes: ['.jpg', '.png', '.pdf', '.doc', '.docx'],
      defaultLanguage: 'en',
      maintenanceMode: false
    },
    security: {
      requireMFA: true,
      sessionTimeout: 30,
      passwordExpiration: 90,
      ipWhitelist: []
    },
    schools: {
      autoApproveRegistrations: false,
      defaultWebsiteLimit: 1,
      requireVerification: true
    }
  });

  const handleToggle = (category: keyof Settings, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting as keyof typeof prev[typeof category]]
      }
    }));
  };

  const handleInputChange = (category: keyof Settings, setting: string, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const saveSettings = async () => {
    // In real app, make API call here
    console.log('Saving settings:', settings);
    // Show success message
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-10 divide-y divide-gray-900/10">
        {/* Notifications Settings */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              <BellIcon className="h-6 w-6 inline-block mr-2 text-gray-400" />
              Notifications
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Configure how you want to receive notifications and alerts.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="space-y-6">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <Switch.Group key={key} as="div" className="flex items-center justify-between">
                    <Switch.Label as="span" className="text-sm font-medium text-gray-900" passive>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Switch.Label>
                    <Switch
                      checked={value}
                      onChange={() => handleToggle('notifications', key)}
                      className={`${
                        value ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          value ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </Switch>
                  </Switch.Group>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              <EnvelopeIcon className="h-6 w-6 inline-block mr-2 text-gray-400" />
              Email Configuration
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Manage email addresses used for system communications.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="space-y-6">
                {Object.entries(settings.email).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-900">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type="email"
                      value={value}
                      onChange={(e) => handleInputChange('email', key, e.target.value)}
                      className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Website Settings */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              <GlobeAltIcon className="h-6 w-6 inline-block mr-2 text-gray-400" />
              Website Settings
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Configure global website settings and defaults.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Max Upload Size (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.website.maxUploadSize}
                    onChange={(e) => handleInputChange('website', 'maxUploadSize', parseInt(e.target.value))}
                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  />
                </div>

                <Switch.Group as="div" className="flex items-center justify-between">
                  <Switch.Label as="span" className="text-sm font-medium text-gray-900" passive>
                    Maintenance Mode
                  </Switch.Label>
                  <Switch
                    checked={settings.website.maintenanceMode}
                    onChange={() => handleToggle('website', 'maintenanceMode')}
                    className={`${
                      settings.website.maintenanceMode ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2`}
                  >
                    <span
                      aria-hidden="true"
                      className={`${
                        settings.website.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </Switch>
                </Switch.Group>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              <ShieldCheckIcon className="h-6 w-6 inline-block mr-2 text-gray-400" />
              Security
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Manage security settings and access controls.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="space-y-6">
                <Switch.Group as="div" className="flex items-center justify-between">
                  <Switch.Label as="span" className="text-sm font-medium text-gray-900" passive>
                    Require MFA
                  </Switch.Label>
                  <Switch
                    checked={settings.security.requireMFA}
                    onChange={() => handleToggle('security', 'requireMFA')}
                    className={`${
                      settings.security.requireMFA ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2`}
                  >
                    <span
                      aria-hidden="true"
                      className={`${
                        settings.security.requireMFA ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </Switch>
                </Switch.Group>

                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* School Settings */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              <UserGroupIcon className="h-6 w-6 inline-block mr-2 text-gray-400" />
              School Settings
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Configure default settings for schools.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="space-y-6">
                <Switch.Group as="div" className="flex items-center justify-between">
                  <Switch.Label as="span" className="text-sm font-medium text-gray-900" passive>
                    Auto-approve Registrations
                  </Switch.Label>
                  <Switch
                    checked={settings.schools.autoApproveRegistrations}
                    onChange={() => handleToggle('schools', 'autoApproveRegistrations')}
                    className={`${
                      settings.schools.autoApproveRegistrations ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2`}
                  >
                    <span
                      aria-hidden="true"
                      className={`${
                        settings.schools.autoApproveRegistrations ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </Switch>
                </Switch.Group>

                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Default Website Limit
                  </label>
                  <input
                    type="number"
                    value={settings.schools.defaultWebsiteLimit}
                    onChange={(e) => handleInputChange('schools', 'defaultWebsiteLimit', parseInt(e.target.value))}
                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex items-center justify-end gap-x-6 pt-10">
          <button
            type="button"
            onClick={saveSettings}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
