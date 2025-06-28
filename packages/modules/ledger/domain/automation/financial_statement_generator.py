"""
Automated Financial Statement Generator (template-based)
"""
def generate_statement(data: dict, statement_type: str = 'income') -> str:
    """Generate a simple financial statement from data (stub for template/AI enrichment)."""
    if statement_type == 'income':
        return f"Revenue: {data.get('revenue', 0)}\nExpenses: {data.get('expenses', 0)}\nNet Profit: {data.get('profit', 0)}"
    if statement_type == 'balance_sheet':
        return f"Assets: {data.get('assets', 0)}\nLiabilities: {data.get('liabilities', 0)}\nEquity: {data.get('equity', 0)}"
    return "Statement type not supported."
