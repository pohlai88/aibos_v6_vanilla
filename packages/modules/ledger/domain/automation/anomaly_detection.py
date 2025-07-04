"""
Machine Learning for Anomaly Detection (fraud, errors)
"""
def detect_anomalies(journal_entries: list) -> list:
    """Stub: Detect unusual or suspicious journal entries (ready for ML/AI enrichment)."""
    # Example: flag entries over a threshold or with duplicate refs
    flagged = []
    seen_refs = set()
    for entry in journal_entries:
        if entry.get('amount', 0) > 1_000_000:
            flagged.append({"reason": "High amount", **entry})
        if entry.get('reference') in seen_refs:
            flagged.append({"reason": "Duplicate reference", **entry})
        seen_refs.add(entry.get('reference'))
    return flagged
