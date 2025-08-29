import { supabase } from './supabase';
import Fuse from 'fuse.js';

export interface SearchResult {
  id: string;
  type: 'employee' | 'organization' | 'task' | 'project' | 'department';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon: string;
  relevance: number;
}

export interface SearchFilters {
  types?: string[];
  organization_id?: string;
  limit?: number;
}

// Fetch exclusion keywords/paths (stub, to be replaced with dynamic admin config fetch)
async function getSearchExclusions(): Promise<{ keyword: string; path_pattern?: string }[]> {
  // TODO: Replace with Supabase fetch from search_exclusions table
  return [
    { keyword: "pornography" },
    { keyword: "confidential" },
    { keyword: "secret" },
    // ...more, managed by admin config
  ];
}

// NOTE: This version uses a search_index table for global search, and will filter out admin-excluded keywords/paths (to be managed in AdminConfig).
// The exclusion list and index sync will be further enhanced in the AdminConfig upgrade.

export class SearchService {
  // Global search across all accessible entities
  async globalSearch(
    searchTerm: string, 
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    if (!searchTerm.trim()) return [];
    const limit = filters.limit || 1000; // Maximize results
    try {
      // Query the search_index table (no RLS)
      const { data, error } = await supabase
        .from('search_index')
        .select('*')
        .ilike('title', `%${searchTerm}%`)
        .limit(limit);
      if (error) throw error;
      let results: SearchResult[] = (data || []).map((row: any) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        subtitle: row.summary,
        description: row.tags,
        url: row.url,
        icon: row.icon || '🔎',
        relevance: 100 // TODO: Add better scoring
      }));
      // Filter out admin-excluded keywords/paths
      const exclusions = await getSearchExclusions();
      results = results.filter(r =>
        !exclusions.some(ex =>
          (ex.keyword && r.title?.toLowerCase().includes(ex.keyword)) ||
          (ex.path_pattern && r.url?.startsWith(ex.path_pattern))
        )
      );
      // Sort and return
      return results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
    } catch (error) {
      console.error('Global search error:', error);
      return [];
    }
  }

  // Search employees with RLS
  private async searchEmployees(searchTerm: string, limit: number): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, first_name, last_name, email, department, job_title, organization_id')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('first_name', { ascending: true });

      if (error) throw error;

      return (data || []).map(emp => ({
        id: emp.id,
        type: 'employee' as const,
        title: `${emp.first_name} ${emp.last_name}`,
        subtitle: emp.job_title || emp.department,
        description: emp.email,
        url: `/hrm/employees/${emp.id}`,
        icon: '👤',
        relevance: this.calculateRelevance(searchTerm, `${emp.first_name} ${emp.last_name} ${emp.email}`)
      }));

    } catch (error) {
      console.error('Employee search error:', error);
      return [];
    }
  }

  // Search organizations with RLS
  private async searchOrganizations(searchTerm: string, limit: number): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, org_type, description')
        .or(`name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(org => ({
        id: org.id,
        type: 'organization' as const,
        title: org.name,
        subtitle: org.org_type,
        description: org.description,
        url: `/organizations/${org.id}`,
        icon: '🏢',
        relevance: this.calculateRelevance(searchTerm, `${org.name} ${org.description || ''}`)
      }));

    } catch (error) {
      console.error('Organization search error:', error);
      return [];
    }
  }

  // Search departments with RLS
  private async searchDepartments(searchTerm: string, limit: number): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, description, organization_id')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(dept => ({
        id: dept.id,
        type: 'department' as const,
        title: dept.name,
        subtitle: 'Department',
        description: dept.description,
        url: `/departments/${dept.id}`,
        icon: '🏛️',
        relevance: this.calculateRelevance(searchTerm, `${dept.name} ${dept.description || ''}`)
      }));

    } catch (error) {
      console.error('Department search error:', error);
      return [];
    }
  }

  // Calculate search relevance score
  private calculateRelevance(searchTerm: string, text: string): number {
    const term = searchTerm.toLowerCase();
    const target = text.toLowerCase();
    
    // Exact match gets highest score
    if (target.includes(term)) {
      // Starts with search term gets higher score
      if (target.startsWith(term)) return 100;
      return 80;
    }
    
    // Partial word match
    const words = term.split(' ');
    const targetWords = target.split(' ');
    
    let score = 0;
    for (const word of words) {
      for (const targetWord of targetWords) {
        if (targetWord.startsWith(word)) {
          score += 60;
        } else if (targetWord.includes(word)) {
          score += 40;
        }
      }
    }
    
    return score;
  }

  // Quick search for autocomplete
  async quickSearch(searchTerm: string, limit: number = 5): Promise<SearchResult[]> {
    return this.globalSearch(searchTerm, { limit });
  }

  // Search with specific filters
  async searchByType(
    searchTerm: string, 
    type: string, 
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    return this.globalSearch(searchTerm, { ...filters, types: [type] });
  }
}

export const searchService = new SearchService();

// Fuzzy search helper for fallback suggestions
export function fuzzySearchResults(
  allResults: SearchResult[],
  searchTerm: string,
  limit: number = 3
): SearchResult[] {
  if (!searchTerm.trim() || allResults.length === 0) return [];
  const fuse = new Fuse(allResults, {
    keys: ['title', 'subtitle', 'description'],
    threshold: 0.4, // Adjust for strictness
    includeScore: true,
  });
  return fuse.search(searchTerm).slice(0, limit).map(r => r.item);
} 