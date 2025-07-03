/* global console */
import { supabase } from './supabase';
import { 
  EmployeeProfile, 
  EmployeeFormData, 
  EmployeeSearchFilters, 
  EmployeeListResponse,
  EmployeeBulkImportData,
  BulkImportResponse,
  EmployeeStats,
  EmployeeHierarchy,
  EmployeeBulkImportResult
} from '../types/employee';

export class EmployeeService {
  private table = 'employee_profiles';

  // Get all employees with pagination and filters
  async getEmployees(
    page: number = 1,
    limit: number = 20,
    filters: EmployeeSearchFilters = {}
  ): Promise<EmployeeListResponse> {
    try {
      let query = supabase
        .from(this.table)
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.employment_status) {
        query = query.eq('employment_status', filters.employment_status);
      }
      if (filters.recruitment_status) {
        query = query.eq('recruitment_status', filters.recruitment_status);
      }
      if (filters.manager_id) {
        query = query.eq('manager_id', filters.manager_id);
      }
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`);
      }
      if (filters.skills && filters.skills.length > 0) {
        query = query.overlaps('skills', filters.skills);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const total_pages = count ? Math.ceil(count / limit) : 0;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        total_pages
      };
    } catch (error) {
      // console.error('Error fetching employees:', error);
      throw error;
    }
  }

  // Get single employee by ID
  async getEmployee(id: string): Promise<EmployeeProfile> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // console.error('Error fetching employee:', error);
      throw error;
    }
  }

  // Get employee by email
  async getEmployeeByEmail(email: string): Promise<EmployeeProfile | null> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      // console.error('Error fetching employee by email:', error);
      throw error;
    }
  }

  // Create new employee
  async createEmployee(employeeData: EmployeeFormData): Promise<EmployeeProfile> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .insert([employeeData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // console.error('Error creating employee:', error);
      throw error;
    }
  }

  // Update employee
  async updateEmployee(id: string, employeeData: Partial<EmployeeFormData>): Promise<EmployeeProfile> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .update(employeeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // console.error('Error updating employee:', error);
      throw error;
    }
  }

  // Delete employee
  async deleteEmployee(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      // console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Bulk import employees
  async bulkImportEmployees(employees: EmployeeBulkImportData[]): Promise<BulkImportResponse> {
    try {
      const results: EmployeeBulkImportResult[] = [];
      let successful_imports = 0;
      let failed_imports = 0;

      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        const row_number = i + 1;

        try {
          // Validate required fields
          if (!employee.first_name || !employee.last_name || !employee.email) {
            results.push({
              success: false,
              row_number,
              errors: ['Missing required fields: first_name, last_name, email']
            });
            failed_imports++;
            continue;
          }

          // Check if email already exists
          const existingEmployee = await this.getEmployeeByEmail(employee.email);
          if (existingEmployee) {
            results.push({
              success: false,
              row_number,
              errors: [`Email ${employee.email} already exists`]
            });
            failed_imports++;
            continue;
          }

          // Prepare data for insertion
          const employeeData: EmployeeFormData = {
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            phone: employee.phone,
            position: employee.position,
            department: employee.department,
            employment_type: employee.employment_type as ('full_time' | 'part_time' | 'contract' | 'intern' | undefined),
            work_location: employee.work_location,
            skills: employee.skills ? employee.skills.split(',').map(s => s.trim()) : [],
            recruitment_status: employee.recruitment_status as ('applied' | 'screening' | 'interviewed' | 'offered' | 'hired' | 'rejected' | undefined),
            recruitment_source: employee.recruitment_source,
            employment_status: 'active'
          };

          // Insert employee
          await this.createEmployee(employeeData);
          
          results.push({
            success: true,
            data: employee,
            row_number
          });
          successful_imports++;

        } catch (error) {
          results.push({
            success: false,
            row_number,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          });
          failed_imports++;
        }
      }

      return {
        success: true,
        total_rows: employees.length,
        successful_imports,
        failed_imports,
        results
      };
    } catch (error) {
      // console.error('Error in bulk import:', error);
      throw error;
    }
  }

  // Get employee statistics
  async getEmployeeStats(): Promise<EmployeeStats> {
    try {
      // Get total employees
      const { count: total_employees } = await supabase
        .from(this.table)
        .select('*', { count: 'exact', head: true });

      // Get active employees
      const { count: active_employees } = await supabase
        .from(this.table)
        .select('*', { count: 'exact', head: true })
        .eq('employment_status', 'active');

      // Get by department
      const { data: deptData } = await supabase
        .from(this.table)
        .select('department');

      const by_department: Record<string, number> = {};
      deptData?.forEach(emp => {
        if (emp.department) {
          by_department[emp.department] = (by_department[emp.department] || 0) + 1;
        }
      });

      // Get by status
      const { data: statusData } = await supabase
        .from(this.table)
        .select('employment_status');

      const by_status: Record<string, number> = {};
      statusData?.forEach(emp => {
        by_status[emp.employment_status] = (by_status[emp.employment_status] || 0) + 1;
      });

      // Get by recruitment status
      const { data: recruitmentData } = await supabase
        .from(this.table)
        .select('recruitment_status')
        .not('recruitment_status', 'is', null);

      const by_recruitment_status: Record<string, number> = {};
      recruitmentData?.forEach(emp => {
        if (emp.recruitment_status) {
          by_recruitment_status[emp.recruitment_status] = (by_recruitment_status[emp.recruitment_status] || 0) + 1;
        }
      });

      // Get recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recent_hires } = await supabase
        .from(this.table)
        .select('*', { count: 'exact', head: true })
        .gte('hire_date', thirtyDaysAgo.toISOString().split('T')[0]);

      // Get upcoming reviews (next 30 days)
      const { count: upcoming_reviews } = await supabase
        .from(this.table)
        .select('*', { count: 'exact', head: true })
        .gte('next_review_date', new Date().toISOString().split('T')[0])
        .lte('next_review_date', thirtyDaysAgo.toISOString().split('T')[0]);

      return {
        total_employees: total_employees || 0,
        active_employees: active_employees || 0,
        by_department,
        by_status,
        by_recruitment_status,
        recent_hires: recent_hires || 0,
        upcoming_reviews: upcoming_reviews || 0
      };
    } catch (error) {
      // console.error('Error fetching employee stats:', error);
      throw error;
    }
  }

  // Get employee hierarchy
  async getEmployeeHierarchy(): Promise<EmployeeHierarchy[]> {
    try {
      const { data, error } = await supabase
        .from('employee_hierarchy')
        .select('*')
        .order('department', { ascending: true })
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // console.error('Error fetching employee hierarchy:', error);
      throw error;
    }
  }

  // Search employees
  async searchEmployees(searchTerm: string, limit: number = 10): Promise<EmployeeProfile[]> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // console.error('Error searching employees:', error);
      throw error;
    }
  }

  // Get employees by department
  async getEmployeesByDepartment(department: string): Promise<EmployeeProfile[]> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('department', department)
        .eq('employment_status', 'active')
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // console.error('Error fetching employees by department:', error);
      throw error;
    }
  }

  // Get managers (employees who have direct reports)
  async getManagers(): Promise<EmployeeProfile[]> {
    try {
      // First, get all unique manager_ids that are not null
      const { data: managerIdRows, error: idError } = await supabase
        .from(this.table)
        .select('manager_id')
        .not('manager_id', 'is', null);

      if (idError) throw idError;
      const managerIds = Array.from(new Set((managerIdRows || []).map(row => row.manager_id).filter(Boolean)));
      if (managerIds.length === 0) return [];

      // Now, fetch all employees whose id is in managerIds
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .in('id', managerIds)
        .eq('employment_status', 'active')
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // console.error('Error fetching managers:', error);
      throw error;
    }
  }

  // Get direct reports for a manager
  async getDirectReports(managerId: string): Promise<EmployeeProfile[]> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('manager_id', managerId)
        .eq('employment_status', 'active')
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // console.error('Error fetching direct reports:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const employeeService = new EmployeeService(); 