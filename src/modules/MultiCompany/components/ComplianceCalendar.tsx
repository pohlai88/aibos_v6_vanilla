import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment-timezone';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { StatutoryItem } from '@/types/statutory';

interface ComplianceCalendarProps {
  timezone: string;
  region: string;
  statutoryItems?: StatutoryItem[];
  onEventClick?: (event: any) => void;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description?: string;
}

const localizer = momentLocalizer(moment);

export const ComplianceCalendar: React.FC<ComplianceCalendarProps> = ({
  timezone = 'UTC',
  region = 'US',
  statutoryItems = [],
  onEventClick,
  onDateSelect,
  className = ''
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // Convert statutory items to calendar events
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = statutoryItems.map(item => {
      const startDate = moment.tz(item.due_date, timezone).toDate();
      const endDate = moment.tz(item.due_date, timezone).add(1, 'day').toDate();
      
      return {
        id: item.id,
        title: item.title,
        start: startDate,
        end: endDate,
        allDay: true,
        priority: item.priority,
        category: item.category,
        description: item.description,
        resource: item
      };
    });

    setEvents(calendarEvents);
  }, [statutoryItems, timezone]);

  // Get event styling based on priority
  const eventStyleGetter = (event: CalendarEvent) => {
    const priorityColors = {
      low: '#10B981',      // Green
      medium: '#F59E0B',   // Yellow
      high: '#EF4444',     // Red
      critical: '#7C3AED'  // Purple
    };

    return {
      style: {
        backgroundColor: priorityColors[event.priority],
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        padding: '2px 4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }
    };
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    onEventClick?.(event);
  };

  // Handle date selection
  const handleSelect = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    onDateSelect?.(start);
  };

  // Get region-specific holidays and compliance dates
  const getRegionComplianceDates = (): CalendarEvent[] => {
    const currentYear = moment().year();
    const regionDates: { [key: string]: any[] } = {
      US: [
        { title: 'Tax Filing Deadline', date: `${currentYear}-04-15`, priority: 'critical' },
        { title: 'Annual Report Due', date: `${currentYear}-12-31`, priority: 'high' },
        { title: 'Quarterly Tax Payment', date: `${currentYear}-01-15`, priority: 'medium' }
      ],
      EU: [
        { title: 'GDPR Compliance Review', date: `${currentYear}-05-25`, priority: 'critical' },
        { title: 'Annual Financial Report', date: `${currentYear}-06-30`, priority: 'high' },
        { title: 'VAT Filing', date: `${currentYear}-01-31`, priority: 'medium' }
      ],
      UK: [
        { title: 'Corporation Tax Return', date: `${currentYear}-01-31`, priority: 'critical' },
        { title: 'Annual Accounts Filing', date: `${currentYear}-09-30`, priority: 'high' },
        { title: 'VAT Return', date: `${currentYear}-01-31`, priority: 'medium' }
      ]
    };

    return (regionDates[region] || []).map((item, index) => ({
      id: `region-${index}`,
      title: item.title,
      start: moment.tz(item.date, timezone).toDate(),
      end: moment.tz(item.date, timezone).add(1, 'day').toDate(),
      allDay: true,
      priority: item.priority,
      category: 'Regional Compliance',
      description: `Regional compliance requirement for ${region}`
    }));
  };

  // Combine statutory items with regional compliance dates
  const allEvents = [...events, ...getRegionComplianceDates()];

  // Custom toolbar component
  const CustomToolbar = (toolbar: any) => {
    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const goToPrevious = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const changeView = (viewName: 'month' | 'week' | 'day') => {
      toolbar.onView(viewName);
      setView(viewName);
    };

    return (
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Today
          </button>
          <button
            onClick={goToPrevious}
            className="p-1 text-gray-600 hover:text-gray-800"
          >
            ‹
          </button>
          <button
            onClick={goToNext}
            className="p-1 text-gray-600 hover:text-gray-800"
          >
            ›
          </button>
          <h2 className="text-lg font-semibold text-gray-900 ml-4">
            {toolbar.label}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600">
            {timezone} • {region}
          </div>
          <div className="flex border border-gray-300 rounded">
            <button
              onClick={() => changeView('month')}
              className={`px-3 py-1 text-sm ${
                view === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => changeView('week')}
              className={`px-3 py-1 text-sm ${
                view === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => changeView('day')}
              className={`px-3 py-1 text-sm ${
                view === 'day' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Priority legend
  const PriorityLegend = () => (
    <div className="flex items-center space-x-4 p-3 bg-gray-50 border-t border-gray-200">
      <span className="text-sm font-medium text-gray-700">Priority:</span>
      {Object.entries({
        low: '#10B981',
        medium: '#F59E0B', 
        high: '#EF4444',
        critical: '#7C3AED'
      }).map(([priority, color]) => (
        <div key={priority} className="flex items-center space-x-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: color }}
          ></div>
          <span className="text-xs text-gray-600 capitalize">{priority}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`compliance-calendar ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Calendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleEventClick}
          onSelectSlot={handleSelect}
          selectable
          toolbar={true}
          components={{
            toolbar: CustomToolbar
          }}
          views={{
            month: true,
            week: true,
            day: true
          }}
          defaultView="month"
          step={60}
          timeslots={1}
          className="compliance-calendar-main"
        />
        <PriorityLegend />
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            Selected Date: {moment(selectedDate).format('MMMM D, YYYY')}
          </h3>
          <p className="text-sm text-blue-700">
            Click to add new compliance item for this date
          </p>
        </div>
      )}

      {/* Timezone and region info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <strong>Timezone:</strong> {timezone} • <strong>Region:</strong> {region}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          All dates are displayed in your selected timezone. Regional compliance dates are automatically included.
        </div>
      </div>
    </div>
  );
};

export default ComplianceCalendar; 