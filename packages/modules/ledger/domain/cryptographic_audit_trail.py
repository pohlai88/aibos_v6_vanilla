"""
Cryptographic Audit Trail Implementation
Implements Merkle tree structure for immutable logging with SHA-3 hashing.
Ensures data integrity and provides tamper-proof audit trails for compliance.
"""

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from uuid import UUID, uuid4
import asyncio
from pathlib import Path
import sqlite3
import threading
from contextlib import contextmanager

logger = logging.getLogger(__name__)


@dataclass
class AuditEntry:
    """Represents a single audit entry with cryptographic integrity"""
    id: UUID = field(default_factory=uuid4)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    tenant_id: UUID = field(default_factory=uuid4)
    user_id: Optional[UUID] = None
    action: str = ""
    resource_type: str = ""
    resource_id: Optional[UUID] = None
    details: Dict[str, Any] = field(default_factory=dict)
    previous_hash: Optional[str] = None
    entry_hash: Optional[str] = None
    merkle_path: List[str] = field(default_factory=list)
    signature: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class MerkleNode:
    """Represents a node in the Merkle tree"""
    hash_value: str
    left_child: Optional['MerkleNode'] = None
    right_child: Optional['MerkleNode'] = None
    parent: Optional['MerkleNode'] = None
    is_leaf: bool = False
    entry_id: Optional[UUID] = None


class MerkleTree:
    """Implements a Merkle tree for cryptographic audit trail"""
    
    def __init__(self):
        self.root: Optional[MerkleNode] = None
        self.leaves: List[MerkleNode] = []
        self.leaf_count = 0
        
    def add_leaf(self, entry_hash: str, entry_id: UUID) -> MerkleNode:
        """Add a new leaf to the Merkle tree"""
        leaf = MerkleNode(
            hash_value=entry_hash,
            is_leaf=True,
            entry_id=entry_id
        )
        self.leaves.append(leaf)
        self.leaf_count += 1
        
        # Rebuild tree
        self._rebuild_tree()
        return leaf
    
    def _rebuild_tree(self):
        """Rebuild the entire Merkle tree"""
        if not self.leaves:
            self.root = None
            return
            
        # Create leaf nodes
        nodes = [leaf for leaf in self.leaves]
        
        # Build tree bottom-up
        while len(nodes) > 1:
            new_level = []
            
            for i in range(0, len(nodes), 2):
                left = nodes[i]
                right = nodes[i + 1] if i + 1 < len(nodes) else left
                
                # Create parent node
                combined_hash = left.hash_value + right.hash_value
                parent_hash = hashlib.sha3_256(combined_hash.encode()).hexdigest()
                
                parent = MerkleNode(
                    hash_value=parent_hash,
                    left_child=left,
                    right_child=right
                )
                
                left.parent = parent
                right.parent = parent
                
                new_level.append(parent)
            
            nodes = new_level
        
        self.root = nodes[0] if nodes else None
    
    def get_merkle_path(self, entry_id: UUID) -> List[str]:
        """Get the Merkle path for a specific entry"""
        # Find the leaf node
        leaf = None
        for l in self.leaves:
            if l.entry_id == entry_id:
                leaf = l
                break
        
        if not leaf:
            return []
        
        path = []
        current = leaf
        
        while current.parent:
            parent = current.parent
            if parent.left_child == current:
                # Current is left child, include right sibling
                path.append(parent.right_child.hash_value)
            else:
                # Current is right child, include left sibling
                path.append(parent.left_child.hash_value)
            current = parent
        
        return path
    
    def verify_merkle_path(self, entry_hash: str, merkle_path: List[str], root_hash: str) -> bool:
        """Verify a Merkle path"""
        current_hash = entry_hash
        
        for sibling_hash in merkle_path:
            combined_hash = current_hash + sibling_hash
            current_hash = hashlib.sha3_256(combined_hash.encode()).hexdigest()
        
        return current_hash == root_hash
    
    def get_root_hash(self) -> Optional[str]:
        """Get the current root hash"""
        return self.root.hash_value if self.root else None
    
    def get_tree_height(self) -> int:
        """Get the height of the Merkle tree"""
        if not self.root:
            return 0
        
        height = 0
        current = self.root
        while current.left_child:
            height += 1
            current = current.left_child
        
        return height


class SecureAuditTrail:
    """Implements a secure audit trail with cryptographic integrity"""
    
    def __init__(self, storage_path: str = "audit_trail.db"):
        self.merkle_tree = MerkleTree()
        self.storage_path = Path(storage_path)
        self.lock = threading.RLock()
        self._initialize_storage()
        
    def _initialize_storage(self):
        """Initialize the secure storage"""
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_entries (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    tenant_id TEXT NOT NULL,
                    user_id TEXT,
                    action TEXT NOT NULL,
                    resource_type TEXT NOT NULL,
                    resource_id TEXT,
                    details TEXT NOT NULL,
                    previous_hash TEXT,
                    entry_hash TEXT NOT NULL,
                    merkle_path TEXT NOT NULL,
                    signature TEXT,
                    created_at TEXT NOT NULL
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS merkle_roots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    root_hash TEXT NOT NULL,
                    leaf_count INTEGER NOT NULL,
                    timestamp TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_entries_tenant_id 
                ON audit_entries(tenant_id)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_entries_timestamp 
                ON audit_entries(timestamp)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_entries_action 
                ON audit_entries(action)
            """)
            
            conn.commit()
    
    @contextmanager
    def _get_connection(self):
        """Get a database connection with proper error handling"""
        conn = sqlite3.connect(self.storage_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        except Exception as e:
            logger.error(f"Database error: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def add_entry(
        self,
        tenant_id: UUID,
        action: str,
        resource_type: str,
        details: Dict[str, Any],
        user_id: Optional[UUID] = None,
        resource_id: Optional[UUID] = None
    ) -> AuditEntry:
        """Add a new audit entry with cryptographic integrity"""
        with self.lock:
            # Create audit entry
            entry = AuditEntry(
                tenant_id=tenant_id,
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=details
            )
            
            # Get previous hash
            previous_hash = self._get_latest_hash(tenant_id)
            entry.previous_hash = previous_hash
            
            # Compute entry hash
            entry_data = {
                'id': str(entry.id),
                'timestamp': entry.timestamp.isoformat(),
                'tenant_id': str(entry.tenant_id),
                'user_id': str(entry.user_id) if entry.user_id else None,
                'action': entry.action,
                'resource_type': entry.resource_type,
                'resource_id': str(entry.resource_id) if entry.resource_id else None,
                'details': entry.details,
                'previous_hash': entry.previous_hash
            }
            
            entry.entry_hash = hashlib.sha3_256(
                json.dumps(entry_data, sort_keys=True).encode()
            ).hexdigest()
            
            # Add to Merkle tree
            self.merkle_tree.add_leaf(entry.entry_hash, entry.id)
            
            # Get Merkle path
            entry.merkle_path = self.merkle_tree.get_merkle_path(entry.id)
            
            # Store in database
            self._store_entry(entry)
            
            # Update Merkle root
            self._store_merkle_root()
            
            logger.info(f"Added audit entry: {entry.id} for action: {action}")
            return entry
    
    def _get_latest_hash(self, tenant_id: UUID) -> Optional[str]:
        """Get the latest hash for a tenant"""
        with self._get_connection() as conn:
            cursor = conn.execute("""
                SELECT entry_hash FROM audit_entries 
                WHERE tenant_id = ? 
                ORDER BY timestamp DESC 
                LIMIT 1
            """, (str(tenant_id),))
            
            row = cursor.fetchone()
            return row['entry_hash'] if row else None
    
    def _store_entry(self, entry: AuditEntry):
        """Store an audit entry in the database"""
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO audit_entries (
                    id, timestamp, tenant_id, user_id, action, resource_type,
                    resource_id, details, previous_hash, entry_hash, merkle_path,
                    signature, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(entry.id),
                entry.timestamp.isoformat(),
                str(entry.tenant_id),
                str(entry.user_id) if entry.user_id else None,
                entry.action,
                entry.resource_type,
                str(entry.resource_id) if entry.resource_id else None,
                json.dumps(entry.details),
                entry.previous_hash,
                entry.entry_hash,
                json.dumps(entry.merkle_path),
                entry.signature,
                entry.created_at.isoformat()
            ))
            conn.commit()
    
    def _store_merkle_root(self):
        """Store the current Merkle root"""
        root_hash = self.merkle_tree.get_root_hash()
        if root_hash:
            with self._get_connection() as conn:
                conn.execute("""
                    INSERT INTO merkle_roots (root_hash, leaf_count, timestamp, created_at)
                    VALUES (?, ?, ?, ?)
                """, (
                    root_hash,
                    self.merkle_tree.leaf_count,
                    datetime.now(timezone.utc).isoformat(),
                    datetime.now(timezone.utc).isoformat()
                ))
                conn.commit()
    
    def verify_entry_integrity(self, entry_id: UUID) -> bool:
        """Verify the integrity of a specific audit entry"""
        # Get entry from database
        entry = self._get_entry(entry_id)
        if not entry:
            return False
        
        # Verify Merkle path
        root_hash = self.merkle_tree.get_root_hash()
        if not root_hash:
            return False
        
        return self.merkle_tree.verify_merkle_path(
            entry.entry_hash,
            entry.merkle_path,
            root_hash
        )
    
    def _get_entry(self, entry_id: UUID) -> Optional[AuditEntry]:
        """Get an audit entry from the database"""
        with self._get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM audit_entries WHERE id = ?
            """, (str(entry_id),))
            
            row = cursor.fetchone()
            if not row:
                return None
            
            return AuditEntry(
                id=UUID(row['id']),
                timestamp=datetime.fromisoformat(row['timestamp']),
                tenant_id=UUID(row['tenant_id']),
                user_id=UUID(row['user_id']) if row['user_id'] else None,
                action=row['action'],
                resource_type=row['resource_type'],
                resource_id=UUID(row['resource_id']) if row['resource_id'] else None,
                details=json.loads(row['details']),
                previous_hash=row['previous_hash'],
                entry_hash=row['entry_hash'],
                merkle_path=json.loads(row['merkle_path']),
                signature=row['signature'],
                created_at=datetime.fromisoformat(row['created_at'])
            )
    
    def get_audit_trail(
        self,
        tenant_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        limit: int = 100
    ) -> List[AuditEntry]:
        """Get audit trail for a tenant with filtering"""
        with self._get_connection() as conn:
            query = """
                SELECT * FROM audit_entries 
                WHERE tenant_id = ?
            """
            params = [str(tenant_id)]
            
            if start_date:
                query += " AND timestamp >= ?"
                params.append(start_date.isoformat())
            
            if end_date:
                query += " AND timestamp <= ?"
                params.append(end_date.isoformat())
            
            if action:
                query += " AND action = ?"
                params.append(action)
            
            if resource_type:
                query += " AND resource_type = ?"
                params.append(resource_type)
            
            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)
            
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
            entries = []
            for row in rows:
                entry = AuditEntry(
                    id=UUID(row['id']),
                    timestamp=datetime.fromisoformat(row['timestamp']),
                    tenant_id=UUID(row['tenant_id']),
                    user_id=UUID(row['user_id']) if row['user_id'] else None,
                    action=row['action'],
                    resource_type=row['resource_type'],
                    resource_id=UUID(row['resource_id']) if row['resource_id'] else None,
                    details=json.loads(row['details']),
                    previous_hash=row['previous_hash'],
                    entry_hash=row['entry_hash'],
                    merkle_path=json.loads(row['merkle_path']),
                    signature=row['signature'],
                    created_at=datetime.fromisoformat(row['created_at'])
                )
                entries.append(entry)
            
            return entries
    
    def get_merkle_root_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get history of Merkle roots"""
        with self._get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM merkle_roots 
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (limit,))
            
            rows = cursor.fetchall()
            return [
                {
                    'root_hash': row['root_hash'],
                    'leaf_count': row['leaf_count'],
                    'timestamp': datetime.fromisoformat(row['timestamp']),
                    'created_at': datetime.fromisoformat(row['created_at'])
                }
                for row in rows
            ]
    
    def verify_audit_trail_integrity(self, tenant_id: UUID) -> Dict[str, Any]:
        """Verify the integrity of the entire audit trail for a tenant"""
        entries = self.get_audit_trail(tenant_id, limit=1000)
        
        verification_results = {
            'tenant_id': str(tenant_id),
            'total_entries': len(entries),
            'verified_entries': 0,
            'failed_entries': 0,
            'failed_entry_ids': [],
            'overall_integrity': True
        }
        
        for entry in entries:
            if self.verify_entry_integrity(entry.id):
                verification_results['verified_entries'] += 1
            else:
                verification_results['failed_entries'] += 1
                verification_results['failed_entry_ids'].append(str(entry.id))
                verification_results['overall_integrity'] = False
        
        return verification_results
    
    def export_audit_trail(
        self,
        tenant_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        format: str = "json"
    ) -> str:
        """Export audit trail in specified format"""
        entries = self.get_audit_trail(tenant_id, start_date, end_date, limit=10000)
        
        if format.lower() == "json":
            export_data = {
                'tenant_id': str(tenant_id),
                'export_date': datetime.now(timezone.utc).isoformat(),
                'start_date': start_date.isoformat() if start_date else None,
                'end_date': end_date.isoformat() if end_date else None,
                'total_entries': len(entries),
                'merkle_root': self.merkle_tree.get_root_hash(),
                'entries': [
                    {
                        'id': str(entry.id),
                        'timestamp': entry.timestamp.isoformat(),
                        'user_id': str(entry.user_id) if entry.user_id else None,
                        'action': entry.action,
                        'resource_type': entry.resource_type,
                        'resource_id': str(entry.resource_id) if entry.resource_id else None,
                        'details': entry.details,
                        'entry_hash': entry.entry_hash,
                        'merkle_path': entry.merkle_path
                    }
                    for entry in entries
                ]
            }
            return json.dumps(export_data, indent=2)
        
        elif format.lower() == "csv":
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow([
                'ID', 'Timestamp', 'User ID', 'Action', 'Resource Type',
                'Resource ID', 'Details', 'Entry Hash', 'Merkle Path'
            ])
            
            # Write data
            for entry in entries:
                writer.writerow([
                    str(entry.id),
                    entry.timestamp.isoformat(),
                    str(entry.user_id) if entry.user_id else '',
                    entry.action,
                    entry.resource_type,
                    str(entry.resource_id) if entry.resource_id else '',
                    json.dumps(entry.details),
                    entry.entry_hash,
                    json.dumps(entry.merkle_path)
                ])
            
            return output.getvalue()
        
        else:
            raise ValueError(f"Unsupported export format: {format}")


class AuditTrailManager:
    """Manages multiple audit trails for different tenants"""
    
    def __init__(self, storage_base_path: str = "audit_trails"):
        self.storage_base_path = Path(storage_base_path)
        self.storage_base_path.mkdir(parents=True, exist_ok=True)
        self.audit_trails: Dict[UUID, SecureAuditTrail] = {}
        self.lock = threading.RLock()
    
    def get_audit_trail(self, tenant_id: UUID) -> SecureAuditTrail:
        """Get or create audit trail for a tenant"""
        with self.lock:
            if tenant_id not in self.audit_trails:
                storage_path = self.storage_base_path / f"tenant_{tenant_id}.db"
                self.audit_trails[tenant_id] = SecureAuditTrail(str(storage_path))
            
            return self.audit_trails[tenant_id]
    
    def add_entry(
        self,
        tenant_id: UUID,
        action: str,
        resource_type: str,
        details: Dict[str, Any],
        user_id: Optional[UUID] = None,
        resource_id: Optional[UUID] = None
    ) -> AuditEntry:
        """Add entry to tenant's audit trail"""
        audit_trail = self.get_audit_trail(tenant_id)
        return audit_trail.add_entry(
            tenant_id=tenant_id,
            action=action,
            resource_type=resource_type,
            details=details,
            user_id=user_id,
            resource_id=resource_id
        )
    
    def verify_tenant_integrity(self, tenant_id: UUID) -> Dict[str, Any]:
        """Verify integrity of tenant's audit trail"""
        audit_trail = self.get_audit_trail(tenant_id)
        return audit_trail.verify_audit_trail_integrity(tenant_id)
    
    def get_tenant_audit_trail(
        self,
        tenant_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        limit: int = 100
    ) -> List[AuditEntry]:
        """Get audit trail for a tenant"""
        audit_trail = self.get_audit_trail(tenant_id)
        return audit_trail.get_audit_trail(
            tenant_id=tenant_id,
            start_date=start_date,
            end_date=end_date,
            action=action,
            resource_type=resource_type,
            limit=limit
        )


# Global audit trail manager instance
audit_trail_manager = AuditTrailManager()


# Convenience functions for easy integration
def log_audit_event(
    tenant_id: UUID,
    action: str,
    resource_type: str,
    details: Dict[str, Any],
    user_id: Optional[UUID] = None,
    resource_id: Optional[UUID] = None
) -> AuditEntry:
    """Log an audit event with cryptographic integrity"""
    return audit_trail_manager.add_entry(
        tenant_id=tenant_id,
        action=action,
        resource_type=resource_type,
        details=details,
        user_id=user_id,
        resource_id=resource_id
    )


def verify_audit_integrity(tenant_id: UUID) -> Dict[str, Any]:
    """Verify the integrity of a tenant's audit trail"""
    return audit_trail_manager.verify_tenant_integrity(tenant_id)


def get_audit_trail(
    tenant_id: UUID,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    limit: int = 100
) -> List[AuditEntry]:
    """Get audit trail for a tenant"""
    return audit_trail_manager.get_tenant_audit_trail(
        tenant_id=tenant_id,
        start_date=start_date,
        end_date=end_date,
        action=action,
        resource_type=resource_type,
        limit=limit
    ) 