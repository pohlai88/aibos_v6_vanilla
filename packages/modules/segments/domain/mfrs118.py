from typing import List, Dict

class BusinessSegment:
    def __init__(self):
        self.segments = []
    
    def add_segment(self, name: str, revenue: float, assets: float):
        """MFRS 118.13 segment criteria"""
        if revenue >= 100000 or assets >= 500000:  # Materiality threshold
            self.segments.append({
                "name": name,
                "revenue": revenue,
                "assets": assets,
                "reportable": True
            })
    
    def generate_report(self) -> List[Dict]:
        """MFRS 118.32 disclosure requirements"""
        if not self.segments:
            return []
        
        total_revenue = sum(s["revenue"] for s in self.segments)
        return [
            {
                "segment": seg["name"],
                "percentage_of_revenue": seg["revenue"] / total_revenue,
                "asset_allocation": seg["assets"]
            }
            for seg in self.segments if seg["reportable"]
        ] 