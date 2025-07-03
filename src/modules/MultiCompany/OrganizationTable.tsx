import React, { useState } from "react";
import { Organization, UserOrganization } from "@/types/organization";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";

interface OrganizationTableProps {
  organizations: Organization[];
  userOrganizations: UserOrganization[];
  onEdit: (org: Organization) => void;
  onRefresh: () => void;
  currentUser: any;
}

export const OrganizationTable: React.FC<OrganizationTableProps> = ({
  organizations,
  userOrganizations,
  onEdit,
  onRefresh,
  currentUser,
}) => {
  const [deletingOrg, setDeletingOrg] = useState<string | null>(null);

  const getUserRole = (orgId: string): string => {
    const userOrg = userOrganizations.find(
      (uo) => uo.organization_id === orgId
    );
    return userOrg?.role || "No access";
  };

  const canEdit = (orgId: string): boolean => {
    const userOrg = userOrganizations.find(
      (uo) => uo.organization_id === orgId
    );
    return ["owner", "admin"].includes(userOrg?.role || "");
  };

  const canDelete = (orgId: string): boolean => {
    const userOrg = userOrganizations.find(
      (uo) => uo.organization_id === orgId
    );
    return userOrg?.role === "owner";
  };

  const handleDelete = async (orgId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this organization? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingOrg(orgId);
    try {
      // Soft delete by updating status to archived
      const { error } = await supabase
        .from("organizations")
        .update({
          status: "archived",
          updated_at: new Date().toISOString(),
          updated_by: currentUser?.id,
        })
        .eq("id", orgId);

      if (error) throw error;

      onRefresh();
    } catch (error) {
      console.error("Error deleting organization:", error);
      alert("Failed to delete organization. Please try again.");
    } finally {
      setDeletingOrg(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      inactive: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
      suspended: { color: "bg-red-100 text-red-800", label: "Suspended" },
      archived: { color: "bg-yellow-100 text-yellow-800", label: "Archived" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.inactive;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getSizeBadge = (size: string) => {
    const sizeConfig = {
      startup: { color: "bg-blue-100 text-blue-800", label: "Startup" },
      sme: { color: "bg-purple-100 text-purple-800", label: "SME" },
      enterprise: {
        color: "bg-indigo-100 text-indigo-800",
        label: "Enterprise",
      },
    };

    const config =
      sizeConfig[size as keyof typeof sizeConfig] || sizeConfig.sme;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getParentName = (parentId: string | undefined) => {
    if (!parentId) return "-";
    const parent = organizations.find((org) => org.id === parentId);
    return parent?.name || "Unknown";
  };

  if (organizations.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No organizations found
        </h3>
        <p className="text-gray-500 mb-4">
          Get started by creating your first organization.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Organization
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Parent
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Your Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {organizations.map((org) => (
            <tr key={org.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {org.name}
                    </div>
                    <div className="text-sm text-gray-500">{org.slug}</div>
                    {org.industry && (
                      <div className="text-xs text-gray-400">
                        {org.industry}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 capitalize">
                  {org.org_type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {getParentName(org.parent_organization_id)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getSizeBadge(org.size_category)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(org.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 capitalize">
                  {getUserRole(org.id)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(org.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  {canEdit(org.id) && (
                    <Button
                      onClick={() => onEdit(org)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete(org.id) && (
                    <Button
                      onClick={() => handleDelete(org.id)}
                      disabled={deletingOrg === org.id}
                      className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50"
                    >
                      {deletingOrg === org.id ? "Deleting..." : "Delete"}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
