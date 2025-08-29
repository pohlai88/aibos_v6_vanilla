"""
Fixed Assets Module
Handles depreciation, disposal, revaluation, and component accounting.
"""

def calculate_depreciation(asset, method="straight_line"):
    """
    Calculate depreciation for a fixed asset.
    Args:
        asset (dict): Asset data (cost, useful_life, residual_value, etc.)
        method (str): Depreciation method (straight_line, reducing_balance)
    Returns:
        dict: Depreciation calculation result.
    """
    cost = asset.get("cost", 0)
    useful_life = asset.get("useful_life", 1)
    residual_value = asset.get("residual_value", 0)
    if method == "straight_line":
        depreciation = (cost - residual_value) / useful_life
    elif method == "reducing_balance":
        rate = 0.2  # Example rate
        depreciation = (cost - residual_value) * rate
    else:
        depreciation = 0
    # Placeholder for component accounting and revaluation
    component_details = None  # TODO: Implement component accounting
    return {
        "method": method,
        "depreciation": depreciation,
        "component_details": component_details,
        "message": f"Depreciation calculated using {method}. Component accounting pending."
    }
