// ============================================================================
// ENHANCED TIMEZONE UTILITIES
// ============================================================================

// Type declarations for Intl.supportedValuesOf
declare global {
  interface Intl {
    supportedValuesOf?(type: 'timeZone'): string[];
  }
}

// Memoization cache for timezone options
let timezoneOptionsCache: Array<{ value: string; label: string; group?: string }> | null = null;
let timezoneGroupsCache: Record<string, Array<{ value: string; label: string }>> | null = null;

// ============================================================================
// CORE TIMEZONE FUNCTIONS
// ============================================================================

/**
 * Get timezone options with fallback for non-standard environments
 * Memoized for performance
 */
export const getTimezoneOptions = (): Array<{ value: string; label: string; group?: string }> => {
  if (timezoneOptionsCache) {
    return timezoneOptionsCache;
  }

  try {
    // Modern browsers support Intl.supportedValuesOf
    if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
      const timezones = Intl.supportedValuesOf('timeZone');
      const options = timezones.map((tz: string) => ({
        value: tz,
        label: formatTimezoneDisplay(tz),
        group: getTimezoneGroup(tz)
      }));
      timezoneOptionsCache = options;
      return options;
    }
  } catch (error) {
    console.warn('Intl.supportedValuesOf not available, using fallback timezones');
  }

  // Fallback to common timezones
  const fallbackTimezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];

  const options = fallbackTimezones.map(tz => ({
    value: tz,
    label: formatTimezoneDisplay(tz),
    group: getTimezoneGroup(tz)
  }));

  timezoneOptionsCache = options;
  return options;
};

/**
 * Get timezone options grouped by region
 * Memoized for performance
 */
export const getTimezoneGroups = (): Record<string, Array<{ value: string; label: string }>> => {
  if (timezoneGroupsCache) {
    return timezoneGroupsCache;
  }

  const options = getTimezoneOptions();
  const groups: Record<string, Array<{ value: string; label: string }>> = {};

  options.forEach(option => {
    const group = option.group || 'Other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push({
      value: option.value,
      label: option.label
    });
  });

  timezoneGroupsCache = groups;
  return timezoneGroupsCache;
};

/**
 * Get timezone group based on timezone name
 */
export const getTimezoneGroup = (timezone: string): string => {
  if (timezone === 'UTC') return 'UTC';
  
  const parts = timezone.split('/');
  if (parts.length < 2) return 'Other';
  
  const region = parts[0];
  
  // Map regions to user-friendly names
  const regionMap: Record<string, string> = {
    'America': 'Americas',
    'Europe': 'Europe',
    'Asia': 'Asia',
    'Australia': 'Australia & Pacific',
    'Pacific': 'Australia & Pacific',
    'Africa': 'Africa',
    'Atlantic': 'Atlantic',
    'Indian': 'Indian Ocean',
    'Arctic': 'Arctic'
  };
  
  return regionMap[region] || 'Other';
};

/**
 * Format timezone for display with offset
 */
export const formatTimezoneDisplay = (timezone: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const formatted = formatter.formatToParts(now);
    const timeZonePart = formatted.find(part => part.type === 'timeZoneName');
    
    if (timeZonePart) {
      return `${timezone} (${timeZonePart.value})`;
    }
    
    return timezone;
  } catch (error) {
    return timezone;
  }
};

/**
 * Get pretty UTC offset display
 */
export const getPrettyUTCOffset = (timezone: string): string => {
  try {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTime + (now.getTimezoneOffset() * 60000));
    
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const formatted = formatter.formatToParts(targetTime);
    const timeZonePart = formatted.find(part => part.type === 'timeZoneName');
    
    if (timeZonePart && (timeZonePart.value.includes('GMT') || timeZonePart.value.includes('UTC'))) {
      return timeZonePart.value;
    }
    
    // Calculate offset manually
    const targetOffset = new Date().toLocaleString('en', { timeZone: timezone, timeZoneName: 'short' });
    
    return `${timezone} (${targetOffset.split(' ').pop()})`;
  } catch (error) {
    return timezone;
  }
};

/**
 * Validate timezone string
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get current user timezone
 */
export const getCurrentTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return 'UTC';
  }
};

/**
 * Clear memoization cache (useful for testing or when timezone data changes)
 */
export const clearTimezoneCache = (): void => {
  timezoneOptionsCache = null;
  timezoneGroupsCache = null;
};

// ============================================================================
// SELECT OPTIONS FOR FORMS
// ============================================================================

/**
 * Get timezone options formatted for select components
 */
export const getTimezoneSelectOptions = (grouped = false) => {
  if (grouped) {
    const groups = getTimezoneGroups();
    return Object.entries(groups).map(([groupName, options]) => ({
      label: groupName,
      options: options.map(opt => ({
        value: opt.value,
        label: opt.label
      }))
    }));
  }
  
  return getTimezoneOptions().map(opt => ({
    value: opt.value,
    label: opt.label
  }));
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format date in specific timezone
 */
export const formatDateInTimezone = (
  date: Date, 
  timezone: string, 
  options: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    return new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      ...options
    }).format(date);
  } catch (error) {
    console.warn(`Failed to format date in timezone ${timezone}:`, error);
    return date.toLocaleString();
  }
};

/**
 * Convert date between timezones
 */
export const convertTimezone = (date: Date, fromTimezone: string, toTimezone: string): Date => {
  try {
    const fromFormatter = new Intl.DateTimeFormat('en', {
      timeZone: fromTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const fromParts = fromFormatter.formatToParts(date);
    
    // Create new date in target timezone
    const convertedDate = new Date();
    convertedDate.setFullYear(parseInt(fromParts.find(p => p.type === 'year')?.value || '0'));
    convertedDate.setMonth(parseInt(fromParts.find(p => p.type === 'month')?.value || '0') - 1);
    convertedDate.setDate(parseInt(fromParts.find(p => p.type === 'day')?.value || '0'));
    convertedDate.setHours(parseInt(fromParts.find(p => p.type === 'hour')?.value || '0'));
    convertedDate.setMinutes(parseInt(fromParts.find(p => p.type === 'minute')?.value || '0'));
    convertedDate.setSeconds(parseInt(fromParts.find(p => p.type === 'second')?.value || '0'));
    
    return convertedDate;
  } catch (error) {
    console.warn(`Failed to convert timezone from ${fromTimezone} to ${toTimezone}:`, error);
    return date;
  }
};

export default {
  getTimezoneOptions,
  getTimezoneGroups,
  getTimezoneSelectOptions,
  formatTimezoneDisplay,
  getPrettyUTCOffset,
  isValidTimezone,
  getCurrentTimezone,
  clearTimezoneCache,
  formatDateInTimezone,
  convertTimezone
}; 