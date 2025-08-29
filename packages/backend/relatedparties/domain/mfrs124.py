from typing import Dict, List

class RelatedPartyManager:
    def __init__(self):
        self.relationships = {}
    
    def add_relationship(self, entity1: str, entity2: str, nature: str):
        """MFRS 124.9 relationship criteria"""
        key = frozenset({entity1, entity2})
        self.relationships[key] = {
            "parties": {entity1, entity2},
            "nature": nature,
            "transactions": []
        }
    
    def log_transaction(self, party1: str, party2: str, amount: float, description: str):
        """MFRS 124.17 disclosure requirements"""
        key = frozenset({party1, party2})
        if key in self.relationships:
            self.relationships[key]["transactions"].append({
                "amount": amount,
                "description": description,
                "disclosure_required": True
            })
    
    def generate_disclosures(self) -> List[Dict]:
        return [
            {
                "parties": list(rel["parties"]),
                "nature": rel["nature"],
                "total_transactions": sum(t["amount"] for t in rel["transactions"])
            }
            for rel in self.relationships.values()
        ] 