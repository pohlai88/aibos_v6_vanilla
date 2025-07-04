"""
Payroll Module
Handles statutory calculations (PCB/EPF/SOCSO/EIS), payslip generation, leave accruals, and reporting.
"""

def calculate_payroll(employee, period, include_statutory=True):
    """
    Calculate payroll for an employee for a given period.
    Args:
        employee (dict): Employee data (salary, allowances, deductions, etc.)
        period (str): Payroll period (e.g., '2025-06')
        include_statutory (bool): Whether to include statutory deductions
    Returns:
        dict: Payroll calculation result.
    """
    salary = employee.get("salary", 0)
    allowances = employee.get("allowances", 0)
    deductions = employee.get("deductions", 0)
    gross = salary + allowances
    net = gross - deductions
    statutory = {}
    if include_statutory:
        statutory = {
            "PCB": gross * 0.11,  # Example
            "EPF": gross * 0.09,
            "SOCSO": gross * 0.005,
            "EIS": gross * 0.002
        }
        net -= sum(statutory.values())
    # Placeholder for payslip generation and leave accruals
    payslip = None  # TODO: Implement payslip generation
    return {
        "period": period,
        "gross": gross,
        "net": net,
        "statutory": statutory,
        "payslip": payslip,
        "message": "Payroll calculated. Payslip and leave accruals pending."
    }
