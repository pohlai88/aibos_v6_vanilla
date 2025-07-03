import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Organization, UserOrganization } from "@/types/organization";
import { OrganizationForm } from "./OrganizationForm";
import { OrganizationTable } from "./OrganizationTable";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface MultiCompanyPageProps {
  className?: string;
}

export const MultiCompanyPage: React.FC<MultiCompanyPageProps> = ({
  className = "",
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userOrganizations, setUserOrganizations] = useState<
    UserOrganization[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchOrganizations();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setLoading(true);

      // Fetch organizations the user has access to
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .order("name");

      if (orgsError) throw orgsError;

      // Fetch user-organization relationships
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from("user_organizations")
        .select("*")
        .eq("user_id", currentUser?.id);

      if (userOrgsError) throw userOrgsError;

      setOrganizations(orgs || []);
      setUserOrganizations(userOrgs || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = () => {
    setEditingOrg(null);
    setShowForm(true);
  };

  const handleEditOrganization = (org: Organization) => {
    setEditingOrg(org);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingOrg(null);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingOrg) {
        // Update existing organization
        const { error } = await supabase
          .from("organizations")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.id,
          })
          .eq("id", editingOrg.id);

        if (error) throw error;
      } else {
        // Create new organization
        const { error } = await supabase.from("organizations").insert({
          ...formData,
          created_by: currentUser?.id,
          updated_by: currentUser?.id,
        });

        if (error) throw error;
      }

      await fetchOrganizations();
      handleFormClose();
    } catch (error) {
      console.error("Error saving organization:", error);
    }
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 ${className}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Organization Management
              </h1>
              <p className="text-gray-600">
                Manage your organizations and multi-tenant setup
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <OrganizationSwitcher
                organizations={organizations}
                userOrganizations={userOrganizations}
                onSwitch={fetchOrganizations}
              />
              <Button
                onClick={handleCreateOrganization}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                + New Organization
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                  className="w-full"
                />
              </div>
              <div className="text-sm text-gray-500">
                {filteredOrganizations.length} of {organizations.length}{" "}
                organizations
              </div>
            </div>
          </div>
        </div>

        {/* Organization Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <OrganizationTable
            organizations={filteredOrganizations}
            userOrganizations={userOrganizations}
            onEdit={handleEditOrganization}
            onRefresh={fetchOrganizations}
            currentUser={currentUser}
          />
        </div>

        {/* Organization Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <OrganizationForm
                organization={editingOrg}
                onSubmit={handleFormSubmit}
                onCancel={handleFormClose}
                organizations={organizations}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
