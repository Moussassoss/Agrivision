"""drop phone column from users

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-15
"""
from alembic import op

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column('users', 'phone')


def downgrade() -> None:
    import sqlalchemy as sa
    op.add_column('users', sa.Column('phone', sa.String(50), nullable=True))
