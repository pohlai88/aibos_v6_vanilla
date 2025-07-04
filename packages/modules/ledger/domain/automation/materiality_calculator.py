"""
Materiality Calculator (quantitative + qualitative)
"""
def calculate_materiality(financials: dict, threshold_pct: float = 0.05) -> dict:
    """Calculate materiality threshold for disclosures (default 5% of revenue)."""
    revenue = float(financials.get('revenue', 0))
    threshold = revenue * threshold_pct
    return {
        'materiality_threshold': threshold,
        'is_material': lambda amount: abs(amount) >= threshold
    }
