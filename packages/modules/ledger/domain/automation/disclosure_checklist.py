"""
Interactive Disclosure Checklist (dynamic, MFRS-compliant)
"""
DISCLOSURE_QUESTIONS = [
    {"id": "revenue", "question": "Did the entity recognize revenue during the period? (MFRS 15)"},
    {"id": "leases", "question": "Does the entity have leases requiring MFRS 16 disclosure?"},
    {"id": "financial_instruments", "question": "Are there financial instruments to disclose under MFRS 9?"},
    # Add more as needed
]

def generate_checklist(answers: dict) -> list:
    """Return required disclosures based on answers."""
    required = []
    for q in DISCLOSURE_QUESTIONS:
        if answers.get(q["id"]):
            required.append(q["question"])
    return required
