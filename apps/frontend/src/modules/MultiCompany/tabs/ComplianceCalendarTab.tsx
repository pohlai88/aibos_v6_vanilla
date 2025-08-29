import React, { useState, useEffect } from 'react';
import { ComplianceCalendar } from '../components/ComplianceCalendar';
import { StatutoryItem } from '@/types/statutory';
import { supabase } from '@/lib/supabase';

interface ComplianceCalendarTabProps {
  organizationId: string;
}

const ComplianceCalendarTab: React.FC<ComplianceCalendarTabProps> = ({ organizationId }) => {
  const [statutoryItems, setStatutoryItems] = useState<StatutoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState('UTC');
  const [region, setRegion] = useState('US');

  useEffect(() => {
    fetchStatutoryItems();
    // Get timezone from browser or organization settings
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [organizationId]);

  const fetchStatutoryItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('statutory_items')
        .select('*')
        .eq('organization_id', organizationId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setStatutoryItems(data || []);
    } catch (error) {
      // Handle error silently or show user-friendly error
      setStatutoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: { id: string; title: string; resource?: StatutoryItem }) => {
    // TODO: Implement event details modal
    void event; // Silence unused variable warning
  };

  const handleDateSelect = (date: Date) => {
    // TODO: Implement new event creation
    void date; // Silence unused variable warning
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Compliance Calendar</h3>
        <div className="flex items-center space-x-4">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="US">United States</option>
            <option value="EU">European Union</option>
            <option value="UK">United Kingdom</option>
            <option value="SG">Singapore</option>
            <option value="AU">Australia</option>
          </select>
        </div>
      </div>

      <ComplianceCalendar
        timezone={timezone}
        region={region}
        statutoryItems={statutoryItems}
        onEventClick={handleEventClick}
        onDateSelect={handleDateSelect}
        className="min-h-[600px]"
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Calendar Features:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• View statutory deadlines and compliance requirements</li>
          <li>• Regional compliance dates automatically included</li>
          <li>• Color-coded priorities (Critical, High, Medium, Low)</li>
          <li>• Multi-timezone support for global organizations</li>
          <li>• Export calendar events to external calendar applications</li>
        </ul>
      </div>
    </div>
  );
};

export default ComplianceCalendarTab; 