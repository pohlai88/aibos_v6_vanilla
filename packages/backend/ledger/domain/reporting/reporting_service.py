"""
Reporting Module
Handles cash flow, segment, and management accounts reporting.
"""

def generate_cash_flow_statement(transactions, method="direct"):
    """
    Generate a cash flow statement.
    Args:
        transactions (list): List of transactions (dicts with type, amount, etc.)
        method (str): Method (direct, indirect)
    Returns:
        dict: Cash flow statement result.
    """
    if method == "direct":
        inflows = sum(t["amount"] for t in transactions if t.get("type") == "inflow")
        outflows = sum(t["amount"] for t in transactions if t.get("type") == "outflow")
        net_cash = inflows - outflows
    else:
        # Placeholder for indirect method
        net_cash = 0  # TODO: Implement indirect method
    return {
        "method": method,
        "net_cash": net_cash,
        "message": f"Cash flow statement generated using {method} method. Indirect method pending."
    }
