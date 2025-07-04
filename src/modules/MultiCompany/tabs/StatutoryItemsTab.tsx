import React, { useState, useEffect } from 'react';
import { statutoryMaintenanceService } from '@/lib/statutoryService';
import { StatutoryItem, STATUTORY_CATEGORIES, STATUTORY_SUBCATEGORIES, PRIORITY_LEVELS, STATUS_OPTIONS } from '@/types/statutory';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';

interface StatutoryItemsTabProps {
  organizationId: string;
}

const StatutoryItemsTab: React.FC<StatutoryItemsTabProps> = ({ organizationId }) => {
  const [statutoryItems, setStatutoryItems] = useState<StatutoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StatutoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    title: '',
    description: '',
    due_date: '',
    frequency: 'annual' as const,
    priority: 'medium' as const,
    notes: '',
    tags: [] as string[]
  });

  useEffect(() => {
    fetchStatutoryItems();
  }, [organizationId]);

  const fetchStatutoryItems = async () => {
    try {
      setLoading(true);
      const items = await statutoryMaintenanceService.statutory.getStatutoryItems(organizationId);
      setStatutoryItems(items);
    } catch (error) {
      console.error('Error fetching statutory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = () => {
    setEditingItem(null);
    setFormData({
      category: '',
      subcategory: '',
      title: '',
      description: '',
      due_date: '',
      frequency: 'annual',
      priority: 'medium',
      notes: '',
      tags: []
    });
    setShowModal(true);
  };

  const handleEditItem = (item: StatutoryItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      subcategory: item.subcategory || '',
      title: item.title,
      description: item.description || '',
      due_date: item.due_date || '',
      frequency: (item.frequency || 'annual') as 'annual',
      priority: item.priority as 'medium',
      notes: item.notes || '',
      tags: item.tags || []
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const itemData = {
        organization_id: organizationId,
        ...formData,
        status: 'pending' as const
      };

      if (editingItem) {
        await statutoryMaintenanceService.statutory.updateStatutoryItem(editingItem.id, itemData);
      } else {
        await statutoryMaintenanceService.statutory.createStatutoryItem(itemData);
      }

      setShowModal(false);
      fetchStatutoryItems();
    } catch (error) {
      console.error('Error saving statutory item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this statutory item?')) {
      try {
        await statutoryMaintenanceService.statutory.deleteStatutoryItem(id);
        fetchStatutoryItems();
      } catch (error) {
        console.error('Error deleting statutory item:', error);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: StatutoryItem['status']) => {
    try {
      await statutoryMaintenanceService.statutory.updateStatutoryItem(id, { 
        status: newStatus,
        completed_date: newStatus === 'completed' ? new Date().toISOString() : undefined
      });
      fetchStatutoryItems();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredItems = statutoryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesPriority = !filterPriority || item.priority === filterPriority;

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <LoadingSpinner message="Loading statutory items..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Statutory Items</h2>
          <p className="text-gray-600">Manage compliance requirements and maintenance tasks</p>
        </div>
        <Button
          onClick={handleCreateItem}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          + Add Statutory Item
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <SearchInput
              placeholder="Search items..."
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={setSearchTerm}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {STATUTORY_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              {PRIORITY_LEVELS.map(priority => (
                <option key={priority} value={priority}>{priority.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No Statutory Items Found"
          description={statutoryItems.length === 0 
            ? "Get started by adding your first statutory item." 
            : "No items match your current filters."}
          icon="📋"
        />
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Category:</span>
                      <p className="text-gray-900">{item.category}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Frequency:</span>
                      <p className="text-gray-900">{item.frequency?.replace('_', ' ').toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Due Date:</span>
                      <p className={`font-medium ${item.due_date ? 
                        (getDaysUntilDue(item.due_date) < 0 ? 'text-red-600' : 
                         getDaysUntilDue(item.due_date) <= 30 ? 'text-yellow-600' : 'text-gray-900') : 'text-gray-500'}`}>
                        {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'Not set'}
                        {item.due_date && (
                          <span className="ml-2 text-sm">
                            ({getDaysUntilDue(item.due_date)} days {getDaysUntilDue(item.due_date) < 0 ? 'overdue' : 'remaining'})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-gray-600 mb-3">{item.description}</p>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.tags.map(tag => (
                        <span key={tag} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.notes && (
                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <span className="text-sm font-medium text-gray-500">Notes:</span>
                      <p className="text-gray-700 text-sm">{item.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value as StatutoryItem['status'])}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                  <Button
                    onClick={() => handleEditItem(item)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeleteItem(item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Statutory Item' : 'Add Statutory Item'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Category</option>
                {STATUTORY_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!formData.category}
              >
                <option value="">Select Subcategory</option>
                {formData.category && STATUTORY_SUBCATEGORIES[formData.category as keyof typeof STATUTORY_SUBCATEGORIES]?.map(subcategory => (
                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter statutory item title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority} value={priority}>{priority.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter additional notes"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={() => setShowModal(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            disabled={!formData.category || !formData.title}
          >
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default StatutoryItemsTab;
