"""
Automated Disclosure Management (MFRS/IFRS compliant)
"""
from typing import List, Dict

DISCLOSURE_TEMPLATES = {
    'revenue': 'Revenue recognized: {amount} on {date}',
    'lease': 'Lease liability: {liability} for asset {asset}',
    # Add more templates as needed
}

def generate_disclosures(data: Dict) -> List[str]:
    """Generate disclosures using templates and transaction data."""
    disclosures = []
    for key, template in DISCLOSURE_TEMPLATES.items():
        if key in data:
            disclosures.append(template.format(**data[key]))
    return disclosures
