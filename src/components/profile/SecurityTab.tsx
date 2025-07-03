import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const SecurityTab: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Mock security settings - these would come from admin config in real implementation
  const securitySettings = {
    twoFactorEnabled: true,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expiryDays: 90,
    },
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15, // minutes
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      // TODO: Implement 2FA setup
      console.log("2FA setup would be implemented here");
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error setting up 2FA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    try {
      // TODO: Implement 2FA disable
      console.log("2FA disable would be implemented here");
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error disabling 2FA:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Security Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Security Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div
              className={`w-3 h-3 rounded-full ${
                securitySettings.twoFactorEnabled
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            ></div>
            <div>
              <div className="font-medium text-gray-900">
                Two-Factor Authentication
              </div>
              <div className="text-sm text-gray-500">
                {securitySettings.twoFactorEnabled ? "Enabled" : "Disabled"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div>
              <div className="font-medium text-gray-900">Password Policy</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div>
              <div className="font-medium text-gray-900">
                Session Management
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Two-Factor Authentication
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">2FA Status</div>
              <div className="text-sm text-gray-500">
                {securitySettings.twoFactorEnabled
                  ? "Two-factor authentication is currently enabled for your account."
                  : "Two-factor authentication is not enabled. Enable it for enhanced security."}
              </div>
            </div>
            <button
              onClick={
                securitySettings.twoFactorEnabled
                  ? handleDisable2FA
                  : handleEnable2FA
              }
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                securitySettings.twoFactorEnabled
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {securitySettings.twoFactorEnabled
                    ? "Disabling..."
                    : "Enabling..."}
                </div>
              ) : securitySettings.twoFactorEnabled ? (
                "Disable 2FA"
              ) : (
                "Enable 2FA"
              )}
            </button>
          </div>

          {!securitySettings.twoFactorEnabled && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-lg">ℹ️</div>
                <div>
                  <div className="font-medium text-blue-900">
                    Why enable 2FA?
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    Two-factor authentication adds an extra layer of security to
                    your account by requiring a second form of verification in
                    addition to your password.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Policy */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Password Policy
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">Minimum Length</div>
              <div className="text-2xl font-bold text-blue-600">
                {securitySettings.passwordPolicy.minLength} characters
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">Password Expiry</div>
              <div className="text-2xl font-bold text-blue-600">
                {securitySettings.passwordPolicy.expiryDays} days
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium text-gray-900">Requirements</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    securitySettings.passwordPolicy.requireUppercase
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-sm text-gray-700">
                  Uppercase letters (A-Z)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    securitySettings.passwordPolicy.requireLowercase
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-sm text-gray-700">
                  Lowercase letters (a-z)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    securitySettings.passwordPolicy.requireNumbers
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-sm text-gray-700">Numbers (0-9)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    securitySettings.passwordPolicy.requireSpecialChars
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-sm text-gray-700">
                  Special characters
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Session Management
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">Session Timeout</div>
              <div className="text-2xl font-bold text-blue-600">
                {securitySettings.sessionTimeout} minutes
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">
                Max Login Attempts
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {securitySettings.maxLoginAttempts} attempts
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 text-lg">⚠️</div>
              <div>
                <div className="font-medium text-yellow-900">
                  Admin Configuration Required
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  Security policies are configured by administrators. Contact
                  your system administrator to modify these settings.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Security Events
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-gray-900">
                  Successful login
                </div>
                <div className="text-sm text-gray-500">Today at 9:30 AM</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">Chrome • 192.168.1.100</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <div className="font-medium text-gray-900">
                  Password changed
                </div>
                <div className="text-sm text-gray-500">
                  Yesterday at 2:15 PM
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">Safari • 192.168.1.100</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div>
                <div className="font-medium text-gray-900">
                  Failed login attempt
                </div>
                <div className="text-sm text-gray-500">
                  3 days ago at 11:45 PM
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">Unknown • 203.0.113.45</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;
