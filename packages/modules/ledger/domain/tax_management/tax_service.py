"""
Tax Management Module
Automated tax calculations (GST/SST, VAT, WHT), LHDN integration, and tax reporting.
"""

def calculate_tax(transaction, tax_type="GST"):
    """
    Calculate tax for a transaction.
    Args:
        transaction (dict): Transaction data (amount, type, etc.)
        tax_type (str): Type of tax (GST, VAT, WHT, etc.)
    Returns:
        dict: Tax calculation result.
    """
    amount = transaction.get("amount", 0)
    if tax_type == "GST":
        rate = 0.06
    elif tax_type == "VAT":
        rate = 0.10
    elif tax_type == "WHT":
        rate = 0.05
    else:
        rate = 0.0
    tax = amount * rate
    # Placeholder for LHDN integration and advanced logic
    lhdn_status = None  # TODO: Integrate with LHDN APIs
    return {
        "tax_type": tax_type,
        "amount": amount,
        "tax": tax,
        "rate": rate,
        "lhdn_status": lhdn_status,
        "message": f"{tax_type} calculated. LHDN integration pending."
    }
