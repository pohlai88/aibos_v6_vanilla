from decimal import Decimal

class ConsolidatedEntity:
    def __init__(self):
        self.subsidiaries = []
    
    def add_subsidiary(self, name: str, ownership_pct: Decimal, assets: Decimal = Decimal("0")):
        """MFRS 110.Appendix A control criteria"""
        if ownership_pct >= Decimal("0.50"):
            self.subsidiaries.append({
                "name": name,
                "ownership": ownership_pct,
                "assets": assets,
                "consolidated": True
            })
    
    def eliminate_transactions(self) -> Decimal:
        """MFRS 110.B86 intercompany elimination (stub)"""
        # In a real implementation, this would track and sum intercompany transactions
        return Decimal("0")
    
    def combined_financials(self) -> dict:
        """MFRS 110.19 consolidation requirements"""
        return {
            "total_assets": sum(sub["assets"] for sub in self.subsidiaries),
            "intercompany_eliminations": self.eliminate_transactions()
        } 