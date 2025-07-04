"""
Unit tests for Cryptographic Audit Trail Implementation
Tests Merkle tree functionality, data integrity, and audit trail operations.
"""

import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, timezone, timedelta
from uuid import UUID, uuid4
import json
import hashlib
import uuid
from packages.modules.ledger.domain.tenant_service import set_tenant_context

from packages.modules.ledger.domain.cryptographic_audit_trail import (
    AuditEntry,
    MerkleNode,
    MerkleTree,
    SecureAuditTrail,
    AuditTrailManager,
    log_audit_event,
    verify_audit_integrity,
    get_audit_trail
)

set_tenant_context(uuid.uuid4())

class TestMerkleTree:
    """Test Merkle tree functionality"""
    
    def test_empty_tree(self):
        """Test empty Merkle tree"""
        tree = MerkleTree()
        assert tree.root is None
        assert tree.leaf_count == 0
        assert tree.get_root_hash() is None
        assert tree.get_tree_height() == 0
    
    def test_single_leaf(self):
        """Test Merkle tree with single leaf"""
        tree = MerkleTree()
        entry_id = uuid4()
        entry_hash = hashlib.sha3_256(b"test").hexdigest()
        
        leaf = tree.add_leaf(entry_hash, entry_id)
        
        assert tree.root is not None
        assert tree.root.hash_value == entry_hash
        assert tree.leaf_count == 1
        assert tree.get_tree_height() == 0
        assert leaf.entry_id == entry_id
    
    def test_two_leaves(self):
        """Test Merkle tree with two leaves"""
        tree = MerkleTree()
        entry_id1 = uuid4()
        entry_id2 = uuid4()
        hash1 = hashlib.sha3_256(b"test1").hexdigest()
        hash2 = hashlib.sha3_256(b"test2").hexdigest()
        
        tree.add_leaf(hash1, entry_id1)
        tree.add_leaf(hash2, entry_id2)
        
        assert tree.root is not None
        assert tree.leaf_count == 2
        assert tree.get_tree_height() == 1
        
        # Verify root hash is combination of two leaves
        expected_root = hashlib.sha3_256((hash1 + hash2).encode()).hexdigest()
        assert tree.get_root_hash() == expected_root
    
    def test_three_leaves(self):
        """Test Merkle tree with three leaves"""
        tree = MerkleTree()
        entry_ids = [uuid4() for _ in range(3)]
        hashes = [hashlib.sha3_256(f"test{i}".encode()).hexdigest() for i in range(3)]
        
        for entry_id, hash_val in zip(entry_ids, hashes):
            tree.add_leaf(hash_val, entry_id)
        
        assert tree.root is not None
        assert tree.leaf_count == 3
        assert tree.get_tree_height() == 2
        
        # Third leaf should be paired with itself
        expected_root = hashlib.sha3_256(
            (hashlib.sha3_256((hashes[0] + hashes[1]).encode()).hexdigest() + 
             hashlib.sha3_256((hashes[2] + hashes[2]).encode()).hexdigest()).encode()
        ).hexdigest()
        assert tree.get_root_hash() == expected_root
    
    def test_merkle_path(self):
        """Test Merkle path generation and verification"""
        tree = MerkleTree()
        entry_ids = [uuid4() for _ in range(4)]
        hashes = [hashlib.sha3_256(f"test{i}".encode()).hexdigest() for i in range(4)]
        
        for entry_id, hash_val in zip(entry_ids, hashes):
            tree.add_leaf(hash_val, entry_id)
        
        # Test path for first entry
        path = tree.get_merkle_path(entry_ids[0])
        assert len(path) == 2  # Height of tree
        
        # Verify path
        assert tree.verify_merkle_path(hashes[0], path, tree.get_root_hash())
        
        # Test path for second entry
        path2 = tree.get_merkle_path(entry_ids[1])
        assert tree.verify_merkle_path(hashes[1], path2, tree.get_root_hash())
        
        # Test invalid path
        assert not tree.verify_merkle_path(hashes[0], path2, tree.get_root_hash())


class TestSecureAuditTrail:
    """Test SecureAuditTrail functionality"""
    
    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for test storage"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def audit_trail(self, temp_dir):
        """Create audit trail instance"""
        storage_path = Path(temp_dir) / "test_audit.db"
        return SecureAuditTrail(str(storage_path))
    
    def test_initialization(self, temp_dir):
        """Test audit trail initialization"""
        storage_path = Path(temp_dir) / "test_audit.db"
        audit_trail = SecureAuditTrail(str(storage_path))
        
        assert audit_trail.storage_path == storage_path
        assert audit_trail.merkle_tree is not None
        assert storage_path.exists()
    
    def test_add_entry(self, audit_trail):
        """Test adding audit entry"""
        tenant_id = uuid4()
        user_id = uuid4()
        resource_id = uuid4()
        
        entry = audit_trail.add_entry(
            tenant_id=tenant_id,
            action="CREATE",
            resource_type="JOURNAL_ENTRY",
            details={"amount": 1000, "currency": "MYR"},
            user_id=user_id,
            resource_id=resource_id
        )
        
        assert entry.id is not None
        assert entry.tenant_id == tenant_id
        assert entry.user_id == user_id
        assert entry.action == "CREATE"
        assert entry.resource_type == "JOURNAL_ENTRY"
        assert entry.resource_id == resource_id
        assert entry.details == {"amount": 1000, "currency": "MYR"}
        assert entry.entry_hash is not None
        assert entry.previous_hash is None  # First entry
        assert len(entry.merkle_path) >= 0
    
    def test_add_multiple_entries(self, audit_trail):
        """Test adding multiple entries"""
        tenant_id = uuid4()
        user_id = uuid4()
        
        entries = []
        for i in range(5):
            entry = audit_trail.add_entry(
                tenant_id=tenant_id,
                action=f"ACTION_{i}",
                resource_type="TEST",
                details={"index": i},
                user_id=user_id
            )
            entries.append(entry)
        
        assert len(entries) == 5
        assert audit_trail.merkle_tree.leaf_count == 5
        
        # Verify each entry has previous hash
        for i, entry in enumerate(entries):
            if i > 0:
                assert entry.previous_hash == entries[i-1].entry_hash
    
    def test_get_audit_trail(self, audit_trail):
        """Test retrieving audit trail"""
        tenant_id = uuid4()
        user_id = uuid4()
        
        # Add entries
        for i in range(3):
            audit_trail.add_entry(
                tenant_id=tenant_id,
                action=f"ACTION_{i}",
                resource_type="TEST",
                details={"index": i},
                user_id=user_id
            )
        
        # Get trail
        trail = audit_trail.get_audit_trail(tenant_id)
        assert len(trail) == 3
        assert trail[0].action == "ACTION_2"  # Most recent first
        assert trail[2].action == "ACTION_0"
    
    def test_get_audit_trail_with_filters(self, audit_trail):
        """Test retrieving audit trail with filters"""
        tenant_id = uuid4()
        user_id = uuid4()
        
        # Add entries with different actions
        audit_trail.add_entry(
            tenant_id=tenant_id,
            action="CREATE",
            resource_type="JOURNAL",
            details={"test": 1},
            user_id=user_id
        )
        audit_trail.add_entry(
            tenant_id=tenant_id,
            action="UPDATE",
            resource_type="JOURNAL",
            details={"test": 2},
            user_id=user_id
        )
        audit_trail.add_entry(
            tenant_id=tenant_id,
            action="CREATE",
            resource_type="INVOICE",
            details={"test": 3},
            user_id=user_id
        )
        
        # Filter by action
        create_entries = audit_trail.get_audit_trail(tenant_id, action="CREATE")
        assert len(create_entries) == 2
        
        # Filter by resource type
        journal_entries = audit_trail.get_audit_trail(tenant_id, resource_type="JOURNAL")
        assert len(journal_entries) == 2
        
        # Filter by both
        filtered = audit_trail.get_audit_trail(tenant_id, action="CREATE", resource_type="JOURNAL")
        assert len(filtered) == 1
    
    def test_verify_entry_integrity(self, audit_trail):
        """Test entry integrity verification"""
        tenant_id = uuid4()
        user_id = uuid4()
        
        entry = audit_trail.add_entry(
            tenant_id=tenant_id,
            action="TEST",
            resource_type="TEST",
            details={"test": "data"},
            user_id=user_id
        )
        
        # Verify integrity
        assert audit_trail.verify_entry_integrity(entry.id)
        
        # Test with non-existent entry
        assert not audit_trail.verify_entry_integrity(uuid4())
    
    def test_verify_audit_trail_integrity(self, audit_trail):
        """Test full audit trail integrity verification"""
        tenant_id = uuid4()
        user_id = uuid4()
        
        # Add multiple entries
        for i in range(5):
            audit_trail.add_entry(
                tenant_id=tenant_id,
                action=f"ACTION_{i}",
                resource_type="TEST",
                details={"index": i},
                user_id=user_id
            )
        
        # Verify integrity
        result = audit_trail.verify_audit_trail_integrity(tenant_id)
        
        assert result['tenant_id'] == str(tenant_id)
        assert result['total_entries'] == 5
        assert result['verified_entries'] == 5
        assert result['failed_entries'] == 0
        assert result['overall_integrity'] is True
    
    def test_export_audit_trail_json(self, audit_trail):
        """Test exporting audit trail as JSON"""
        tenant_id = uuid4()
        user_id = uuid4()
        
        # Add entries
        for i in range(3):
            audit_trail.add_entry(
                tenant_id=tenant_id,
                action=f"ACTION_{i}",
                resource_type="TEST",
                details={"index": i},
                user_id=user_id
            )
        
        # Export as JSON
        json_export = audit_trail.export_audit_trail(tenant_id, format="json")
        export_data = json.loads(json_export)
        
        assert export_data['tenant_id'] == str(tenant_id)
        assert export_data['total_entries'] == 3
        assert len(export_data['entries']) == 3
        assert export_data['merkle_root'] is not None
    
    def test_export_audit_trail_csv(self, audit_trail):
        """Test exporting audit trail as CSV"""
        tenant_id = uuid4()
        user_id = uuid4()
        
        # Add entries
        for i in range(2):
            audit_trail.add_entry(
                tenant_id=tenant_id,
                action=f"ACTION_{i}",
                resource_type="TEST",
                details={"index": i},
                user_id=user_id
            )
        
        # Export as CSV
        csv_export = audit_trail.export_audit_trail(tenant_id, format="csv")
        
        assert "ID,Timestamp,User ID,Action,Resource Type" in csv_export
        assert "ACTION_0" in csv_export
        assert "ACTION_1" in csv_export
    
    def test_export_invalid_format(self, audit_trail):
        """Test export with invalid format"""
        tenant_id = uuid4()
        
        with pytest.raises(ValueError, match="Unsupported export format"):
            audit_trail.export_audit_trail(tenant_id, format="invalid")


class TestAuditTrailManager:
    """Test AuditTrailManager functionality"""
    
    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for test storage"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def manager(self, temp_dir):
        """Create audit trail manager"""
        return AuditTrailManager(str(Path(temp_dir) / "audit_trails"))
    
    def test_get_audit_trail(self, manager):
        """Test getting audit trail for tenant"""
        tenant_id = uuid4()
        audit_trail = manager.get_audit_trail(tenant_id)
        
        assert audit_trail is not None
        assert isinstance(audit_trail, SecureAuditTrail)
        
        # Should return same instance for same tenant
        audit_trail2 = manager.get_audit_trail(tenant_id)
        assert audit_trail is audit_trail2
    
    def test_add_entry(self, manager):
        """Test adding entry through manager"""
        tenant_id = uuid4()
        user_id = uuid4()
        
        entry = manager.add_entry(
            tenant_id=tenant_id,
            action="TEST",
            resource_type="TEST",
            details={"test": "data"},
            user_id=user_id
        )
        
        assert entry.tenant_id == tenant_id
        assert entry.user_id == user_id
        assert entry.action == "TEST"
    
    def test_verify_tenant_integrity(self, manager):
        """Test tenant integrity verification through manager"""
        tenant_id = uuid4()
        user_id = uuid4()
        
        # Add entries
        for i in range(3):
            manager.add_entry(
                tenant_id=tenant_id,
                action=f"ACTION_{i}",
                resource_type="TEST",
                details={"index": i},
                user_id=user_id
            )
        
        # Verify integrity
        result = manager.verify_tenant_integrity(tenant_id)
        
        assert result['tenant_id'] == str(tenant_id)
        assert result['total_entries'] == 3
        assert result['overall_integrity'] is True


class TestConvenienceFunctions:
    """Test convenience functions"""
    
    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for test storage"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    def test_log_audit_event(self, temp_dir, monkeypatch):
        """Test log_audit_event convenience function"""
        # Mock the global manager to use temp directory
        from packages.modules.ledger.domain.cryptographic_audit_trail import audit_trail_manager
        original_storage = audit_trail_manager.storage_base_path
        audit_trail_manager.storage_base_path = Path(temp_dir) / "audit_trails"
        
        try:
            tenant_id = uuid4()
            user_id = uuid4()
            
            entry = log_audit_event(
                tenant_id=tenant_id,
                action="TEST",
                resource_type="TEST",
                details={"test": "data"},
                user_id=user_id
            )
            
            assert entry.tenant_id == tenant_id
            assert entry.user_id == user_id
            assert entry.action == "TEST"
        finally:
            audit_trail_manager.storage_base_path = original_storage
    
    def test_verify_audit_integrity(self, temp_dir, monkeypatch):
        """Test verify_audit_integrity convenience function"""
        # Mock the global manager to use temp directory
        from packages.modules.ledger.domain.cryptographic_audit_trail import audit_trail_manager
        original_storage = audit_trail_manager.storage_base_path
        audit_trail_manager.storage_base_path = Path(temp_dir) / "audit_trails"
        
        try:
            tenant_id = uuid4()
            user_id = uuid4()
            
            # Add entries
            for i in range(2):
                log_audit_event(
                    tenant_id=tenant_id,
                    action=f"ACTION_{i}",
                    resource_type="TEST",
                    details={"index": i},
                    user_id=user_id
                )
            
            # Verify integrity
            result = verify_audit_integrity(tenant_id)
            
            assert result['tenant_id'] == str(tenant_id)
            assert result['total_entries'] == 2
            assert result['overall_integrity'] is True
        finally:
            audit_trail_manager.storage_base_path = original_storage
    
    def test_get_audit_trail(self, temp_dir, monkeypatch):
        """Test get_audit_trail convenience function"""
        # Mock the global manager to use temp directory
        from packages.modules.ledger.domain.cryptographic_audit_trail import audit_trail_manager
        original_storage = audit_trail_manager.storage_base_path
        audit_trail_manager.storage_base_path = Path(temp_dir) / "audit_trails"
        
        try:
            tenant_id = uuid4()
            user_id = uuid4()
            
            # Add entries
            for i in range(3):
                log_audit_event(
                    tenant_id=tenant_id,
                    action=f"ACTION_{i}",
                    resource_type="TEST",
                    details={"index": i},
                    user_id=user_id
                )
            
            # Get trail
            trail = get_audit_trail(tenant_id)
            
            assert len(trail) == 3
            assert trail[0].action == "ACTION_2"  # Most recent first
        finally:
            audit_trail_manager.storage_base_path = original_storage


class TestIntegration:
    """Integration tests for cryptographic audit trail"""
    
    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for test storage"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    def test_full_audit_workflow(self, temp_dir):
        """Test complete audit workflow"""
        storage_path = Path(temp_dir) / "integration_test.db"
        audit_trail = SecureAuditTrail(str(storage_path))
        
        tenant_id = uuid4()
        user_id = uuid4()
        resource_id = uuid4()
        
        # Simulate journal entry creation
        entry1 = audit_trail.add_entry(
            tenant_id=tenant_id,
            action="CREATE",
            resource_type="JOURNAL_ENTRY",
            details={
                "debit_account": "1000",
                "credit_account": "2000",
                "amount": 5000.00,
                "currency": "MYR",
                "description": "Test entry"
            },
            user_id=user_id,
            resource_id=resource_id
        )
        
        # Simulate journal entry modification
        entry2 = audit_trail.add_entry(
            tenant_id=tenant_id,
            action="UPDATE",
            resource_type="JOURNAL_ENTRY",
            details={
                "previous_amount": 5000.00,
                "new_amount": 5500.00,
                "reason": "Correction"
            },
            user_id=user_id,
            resource_id=resource_id
        )
        
        # Simulate journal entry deletion
        entry3 = audit_trail.add_entry(
            tenant_id=tenant_id,
            action="DELETE",
            resource_type="JOURNAL_ENTRY",
            details={
                "reason": "Duplicate entry",
                "deleted_by": str(user_id)
            },
            user_id=user_id,
            resource_id=resource_id
        )
        
        # Verify all entries
        assert audit_trail.verify_entry_integrity(entry1.id)
        assert audit_trail.verify_entry_integrity(entry2.id)
        assert audit_trail.verify_entry_integrity(entry3.id)
        
        # Get audit trail
        trail = audit_trail.get_audit_trail(tenant_id)
        assert len(trail) == 3
        
        # Verify chronological order
        assert trail[0].action == "DELETE"  # Most recent
        assert trail[1].action == "UPDATE"
        assert trail[2].action == "CREATE"  # Oldest
        
        # Verify hash chain
        assert trail[1].previous_hash == trail[2].entry_hash
        assert trail[0].previous_hash == trail[1].entry_hash
        
        # Verify overall integrity
        integrity_result = audit_trail.verify_audit_trail_integrity(tenant_id)
        assert integrity_result['overall_integrity'] is True
        assert integrity_result['verified_entries'] == 3
        assert integrity_result['failed_entries'] == 0
    
    def test_multi_tenant_isolation(self, temp_dir):
        """Test multi-tenant isolation"""
        manager = AuditTrailManager(str(Path(temp_dir) / "audit_trails"))
        
        tenant1_id = uuid4()
        tenant2_id = uuid4()
        user_id = uuid4()
        
        # Add entries for both tenants
        entry1 = manager.add_entry(
            tenant_id=tenant1_id,
            action="TEST1",
            resource_type="TEST",
            details={"tenant": "1"},
            user_id=user_id
        )
        
        entry2 = manager.add_entry(
            tenant_id=tenant2_id,
            action="TEST2",
            resource_type="TEST",
            details={"tenant": "2"},
            user_id=user_id
        )
        
        # Verify isolation
        trail1 = manager.get_tenant_audit_trail(tenant1_id)
        trail2 = manager.get_tenant_audit_trail(tenant2_id)
        
        assert len(trail1) == 1
        assert len(trail2) == 1
        assert trail1[0].tenant_id == tenant1_id
        assert trail2[0].tenant_id == tenant2_id
        assert trail1[0].action == "TEST1"
        assert trail2[0].action == "TEST2"
    
    def test_merkle_tree_integrity_under_load(self, temp_dir):
        """Test Merkle tree integrity under load"""
        storage_path = Path(temp_dir) / "load_test.db"
        audit_trail = SecureAuditTrail(str(storage_path))
        
        tenant_id = uuid4()
        user_id = uuid4()
        
        # Add many entries
        entries = []
        for i in range(100):
            entry = audit_trail.add_entry(
                tenant_id=tenant_id,
                action=f"ACTION_{i}",
                resource_type="TEST",
                details={"index": i, "data": "x" * 100},  # Large details
                user_id=user_id
            )
            entries.append(entry)
        
        # Verify all entries
        for entry in entries:
            assert audit_trail.verify_entry_integrity(entry.id)
        
        # Verify overall integrity
        integrity_result = audit_trail.verify_audit_trail_integrity(tenant_id)
        assert integrity_result['overall_integrity'] is True
        assert integrity_result['verified_entries'] == 100
        assert integrity_result['failed_entries'] == 0
        
        # Verify Merkle tree properties
        assert audit_trail.merkle_tree.leaf_count == 100
        assert audit_trail.merkle_tree.get_root_hash() is not None
        assert audit_trail.merkle_tree.get_tree_height() > 0 