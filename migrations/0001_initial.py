# Example Alembic migration script (placeholder)
# Place real migration scripts in this folder for DB schema changes

"""
Revision ID: 0001_initial
Revises: 
Create Date: 2025-06-29
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Example: create a table
    op.create_table(
        'example_table',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(50), nullable=False)
    )

def downgrade():
    op.drop_table('example_table')
