import { supabase } from './supabase';

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

export class SearchService {
  // Global search across all accessible entities
  async globalSearch(
    searchTerm: string, 
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    if (!searchTerm.trim()) return [];

    const results: SearchResult[] = [];
    const limit = filters.limit || 10;

    try {
      // Search employees (respects RLS automatically)
      const employeeResults = await this.searchEmployees(searchTerm, limit);
      results.push(...employeeResults);

      // Search organizations (respects RLS automatically)
      const orgResults = await this.searchOrganizations(searchTerm, limit);
      results.push(...orgResults);

      // Search departments (respects RLS automatically)
      const deptResults = await this.searchDepartments(searchTerm, limit);
      results.push(...deptResults);

      // Filter by type if specified
      if (filters.types && filters.types.length > 0) {
        return results.filter(result => filters.types!.includes(result.type));
      }

      // Sort by relevance and limit results
      return results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);

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