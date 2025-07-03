import React, { useState, useEffect } from "react";
import { Organization, UserOrganization } from "@/types/organization";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";

interface OrganizationSwitcherProps {
  organizations: Organization[];
  userOrganizations: UserOrganization[];
  onSwitch: () => void;
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  organizations,
  userOrganizations,
  onSwitch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    // Get current organization from localStorage or context
    const currentOrgId = localStorage.getItem("currentOrganizationId");
    if (currentOrgId) {
      const org = organizations.find((o) => o.id === currentOrgId);
      setCurrentOrg(org || null);
    } else {
      // Set first available organization as current
      const primaryOrg = userOrganizations.find((uo) => uo.is_primary);
      if (primaryOrg) {
        const org = organizations.find(
          (o) => o.id === primaryOrg.organization_id
        );
        setCurrentOrg(org || null);
        if (org) {
          localStorage.setItem("currentOrganizationId", org.id);
        }
      }
    }
  }, [organizations, userOrganizations]);

  const handleSwitchOrganization = async (org: Organization) => {
    setSwitching(true);
    try {
      // Update current organization in localStorage
      localStorage.setItem("currentOrganizationId", org.id);
      setCurrentOrg(org);

      // Update primary organization in database if needed
      const userOrg = userOrganizations.find(
        (uo) => uo.organization_id === org.id
      );
      if (userOrg && !userOrg.is_primary) {
        // Clear other primary organizations
        await supabase
          .from("user_organizations")
          .update({ is_primary: false })
          .eq("user_id", userOrg.user_id);

        // Set this organization as primary
        await supabase
          .from("user_organizations")
          .update({ is_primary: true })
          .eq("id", userOrg.id);
      }

      // Trigger refresh
      onSwitch();

      // Close dropdown
      setIsOpen(false);

      // Reload page to update context
      window.location.reload();
    } catch (error) {
      console.error("Error switching organization:", error);
    } finally {
      setSwitching(false);
    }
  };

  const getUserRole = (orgId: string): string => {
    const userOrg = userOrganizations.find(
      (uo) => uo.organization_id === orgId
    );
    return userOrg?.role || "No access";
  };

  const accessibleOrganizations = organizations.filter((org) => {
    const userOrg = userOrganizations.find(
      (uo) => uo.organization_id === org.id
    );
    return userOrg && userOrg.status === "active";
  });

  if (accessibleOrganizations.length <= 1) {
    return null; // Don't show switcher if user only has access to one organization
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-xs">
              {currentOrg?.name.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
          <span className="font-medium text-sm">
            {currentOrg?.name || "Select Organization"}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Switch Organization
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {accessibleOrganizations.map((org) => {
                const isCurrent = org.id === currentOrg?.id;
                const userRole = getUserRole(org.id);

                return (
                  <button
                    key={org.id}
                    onClick={() => handleSwitchOrganization(org)}
                    disabled={switching || isCurrent}
                    className={`w-full p-3 rounded-lg border transition-colors ${
                      isCurrent
                        ? "bg-blue-50 border-blue-200 cursor-default"
                        : "hover:bg-gray-50 border-gray-200"
                    } ${switching ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCurrent ? "bg-blue-100" : "bg-gray-100"
                          }`}
                        >
                          <span
                            className={`font-semibold text-sm ${
                              isCurrent ? "text-blue-600" : "text-gray-600"
                            }`}
                          >
                            {org.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center space-x-2">
                          <p
                            className={`text-sm font-medium truncate ${
                              isCurrent ? "text-blue-900" : "text-gray-900"
                            }`}
                          >
                            {org.name}
                          </p>
                          {isCurrent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Current
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 capitalize">
                            {userRole}
                          </span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-500 capitalize">
                            {org.size_category}
                          </span>
                        </div>

                        {org.industry && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {org.industry}
                          </p>
                        )}
                      </div>

                      {switching && isCurrent && (
                        <div className="flex-shrink-0">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                You have access to {accessibleOrganizations.length} organization
                {accessibleOrganizations.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
