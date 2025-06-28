# Contributing to AIbos Ledger

Thank you for your interest in contributing to AIbos Ledger! This document provides guidelines and instructions for developers who want to contribute to the project.

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/aibos.git
   cd aibos
   ```

2. **Install dependencies**
   ```bash
   # Install development dependencies
   make install-dev
   
   # Or manually:
   pip install -e ".[dev,test]"
   pre-commit install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start services with Docker Compose**
   ```bash
   make docker-run
   # Or manually:
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   make migrate
   ```

6. **Seed demo data**
   ```bash
   make seed-demo
   ```

7. **Start the development server**
   ```bash
   make run
   ```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
make test

# Run with coverage
make test-cov

# Run specific test file
pytest tests/unit/ledger/test_journal_entries.py -v

# Run integration tests only
pytest tests/integration/ -m integration
```

### Test Coverage
We aim for >80% test coverage. Generate coverage reports:
```bash
make test-cov
# Open htmlcov/index.html in your browser
```

## 📝 Code Style

### Formatting
We use [Black](https://black.readthedocs.io/) for code formatting and [isort](https://pycqa.github.io/isort/) for import sorting.

```bash
# Format code
make format

# Check formatting
make lint
```

### Type Hints
We use [mypy](https://mypy.readthedocs.io/) for static type checking. All public functions should have type hints.

```bash
# Run type checking
make type-check
```

### Pre-commit Hooks
Pre-commit hooks automatically run formatting, linting, and type checking on commit:

```bash
# Install pre-commit hooks
pre-commit install

# Run all hooks manually
make pre-commit-all
```

## 🏗️ Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes
- Follow the coding standards below
- Add tests for new functionality
- Update documentation as needed

### 3. Run Quality Checks
```bash
make check-all
```

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add new journal entry validation"
```

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

## 📋 Coding Standards

### Python Code Style

1. **Follow PEP 8** with Black formatting
2. **Use type hints** for all function parameters and return values
3. **Write docstrings** for all public functions and classes
4. **Use meaningful variable names**
5. **Keep functions small and focused**

### Example
```python
from typing import List, Optional
from decimal import Decimal
from uuid import UUID

def create_journal_entry(
    reference: str,
    description: str,
    amount: Decimal,
    account_id: UUID,
    created_by: Optional[UUID] = None
) -> JournalEntry:
    """
    Create a new journal entry.
    
    Args:
        reference: Unique reference for the entry
        description: Human-readable description
        amount: Transaction amount
        account_id: Target account ID
        created_by: User ID who created the entry
        
    Returns:
        JournalEntry: The created journal entry
        
    Raises:
        ValueError: If reference is empty or amount is invalid
    """
    if not reference:
        raise ValueError("Reference is required")
    
    if amount <= 0:
        raise ValueError("Amount must be positive")
    
    # Implementation...
```

### Database Migrations

1. **Create migrations** for all schema changes
2. **Use descriptive names** for migration files
3. **Test migrations** on both up and down
4. **Include rollback scripts** for production safety

### API Design

1. **Use RESTful conventions**
2. **Version your APIs** (e.g., `/api/v1/`)
3. **Return consistent error responses**
4. **Use proper HTTP status codes**
5. **Include pagination** for list endpoints

### Error Handling

1. **Use specific exception types**
2. **Provide meaningful error messages**
3. **Log errors appropriately**
4. **Don't expose sensitive information**

## 🧪 Testing Guidelines

### Unit Tests
- Test individual functions and methods
- Use descriptive test names
- Mock external dependencies
- Aim for >90% coverage on business logic

### Integration Tests
- Test component interactions
- Use test databases
- Clean up after tests
- Test API endpoints

### Test Structure
```python
import pytest
from decimal import Decimal
from packages.modules.ledger.domain import LedgerService, AccountType

class TestJournalEntryCreation:
    """Test journal entry creation functionality."""
    
    @pytest.fixture
    def ledger_service(self):
        """Create a ledger service for testing."""
        return LedgerService()
    
    def test_create_valid_journal_entry(self, ledger_service):
        """Test creating a valid journal entry."""
        # Arrange
        reference = "TEST-001"
        description = "Test entry"
        
        # Act
        entry = ledger_service.create_journal_entry(reference, description)
        
        # Assert
        assert entry.reference == reference
        assert entry.description == description
        assert entry.status == WorkflowStatus.DRAFT
```

## 📚 Documentation

### Code Documentation
- Use Google-style docstrings
- Document all public APIs
- Include usage examples
- Explain complex business logic

### API Documentation
- Use FastAPI's automatic documentation
- Add detailed descriptions
- Include request/response examples
- Document error codes

### README Updates
- Update README.md for new features
- Include setup instructions
- Add usage examples
- Document configuration options

## 🔒 Security

### Data Protection
- Never log sensitive data
- Use environment variables for secrets
- Validate all inputs
- Implement proper authentication

### Multi-tenancy
- Always enforce tenant isolation
- Use tenant context in all operations
- Validate tenant access permissions
- Test cross-tenant data access

## 🚀 Deployment

### Environment Configuration
- Use environment-specific configs
- Validate required environment variables
- Use secrets management in production
- Implement health checks

### Database Migrations
- Always backup before migrations
- Test migrations in staging
- Use transaction-safe migrations
- Monitor migration performance

## 🤝 Pull Request Process

1. **Create a descriptive PR title**
2. **Fill out the PR template**
3. **Link related issues**
4. **Ensure all checks pass**
5. **Request reviews from maintainers**
6. **Address review feedback**
7. **Squash commits before merge**

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## 🆘 Getting Help

### Resources
- [API Documentation](http://localhost:8000/docs)
- [Issue Tracker](https://github.com/your-org/aibos/issues)
- [Discussions](https://github.com/your-org/aibos/discussions)

### Contact
- **Technical Questions**: Create a GitHub issue
- **Security Issues**: Email security@aibos.com
- **General Support**: Email support@aibos.com

## 📄 License

By contributing to AIbos Ledger, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AIbos Ledger! 🎉 