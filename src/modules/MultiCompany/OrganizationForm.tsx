import React, { useState, useEffect } from "react";
import { Organization, OrganizationFormData } from "@/types/organization";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface OrganizationFormProps {
  organization?: Organization | null;
  onSubmit: (data: OrganizationFormData) => void;
  onCancel: () => void;
  organizations: Organization[];
}

export const OrganizationForm: React.FC<OrganizationFormProps> = ({
  organization,
  onSubmit,
  onCancel,
  organizations,
}) => {
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: "",
    slug: "",
    legal_name: "",
    industry: "",
    size_category: "sme",
    parent_organization_id: "",
    org_type: "independent",
    website_url: "",
    timezone: "UTC",
    locale: "en-US",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        slug: organization.slug,
        legal_name: organization.legal_name || "",
        industry: organization.industry || "",
        size_category: organization.size_category,
        parent_organization_id: organization.parent_organization_id || "",
        org_type: organization.org_type,
        website_url: organization.website_url || "",
        timezone: organization.timezone,
        locale: organization.locale,
      });
    }
  }, [organization]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required";
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = "Organization slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug =
        "Slug must contain only lowercase letters, numbers, and hyphens";
    }

    // Check for duplicate slug (excluding current organization)
    const slugExists = organizations.some(
      (org) => org.slug === formData.slug && org.id !== organization?.id
    );
    if (slugExists) {
      newErrors.slug = "This slug is already taken";
    }

    if (formData.website_url && !isValidUrl(formData.website_url)) {
      newErrors.website_url = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof OrganizationFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    handleInputChange("name", name);

    // Auto-generate slug if it's empty or matches the old name
    if (
      !formData.slug ||
      formData.slug === generateSlug(organization?.name || "")
    ) {
      handleInputChange("slug", generateSlug(name));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {organization ? "Edit Organization" : "Create New Organization"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Basic Information
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleNameChange(e.target.value)
              }
              placeholder="Enter organization name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Slug *
            </label>
            <Input
              type="text"
              value={formData.slug}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange("slug", e.target.value)
              }
              placeholder="organization-slug"
              className={errors.slug ? "border-red-500" : ""}
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              Used in URLs and API endpoints
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Legal Name
            </label>
            <Input
              type="text"
              value={formData.legal_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange("legal_name", e.target.value)
              }
              placeholder="Legal business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <Input
              type="text"
              value={formData.industry}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange("industry", e.target.value)
              }
              placeholder="e.g., Technology, Healthcare, Finance"
            />
          </div>
        </div>

        {/* Organization Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Organization Details
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size Category
            </label>
            <select
              value={formData.size_category}
              onChange={(e) =>
                handleInputChange("size_category", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="startup">Startup</option>
              <option value="sme">SME</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Type
            </label>
            <select
              value={formData.org_type}
              onChange={(e) => handleInputChange("org_type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="independent">Independent</option>
              <option value="mother">Parent Company</option>
              <option value="subsidiary">Subsidiary</option>
              <option value="branch">Branch</option>
            </select>
          </div>

          {formData.org_type !== "independent" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Organization
              </label>
              <select
                value={formData.parent_organization_id}
                onChange={(e) =>
                  handleInputChange("parent_organization_id", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select parent organization</option>
                {organizations
                  .filter((org) => org.id !== organization?.id)
                  .map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <Input
              type="url"
              value={formData.website_url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange("website_url", e.target.value)
              }
              placeholder="https://example.com"
              className={errors.website_url ? "border-red-500" : ""}
            />
            {errors.website_url && (
              <p className="text-red-500 text-sm mt-1">{errors.website_url}</p>
            )}
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Regional Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => handleInputChange("timezone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Shanghai">Shanghai</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Locale
            </label>
            <select
              value={formData.locale}
              onChange={(e) => handleInputChange("locale", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="ja-JP">Japanese</option>
              <option value="zh-CN">Chinese (Simplified)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : organization
            ? "Update Organization"
            : "Create Organization"}
        </Button>
      </div>
    </form>
  );
};
