"""initial schema with password_reset_tokens

Revision ID: 0001
Revises:
Create Date: 2026-08-14
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id",              UUID(as_uuid=True), primary_key=True),
        sa.Column("email",           sa.String(255),     nullable=False),
        sa.Column("full_name",       sa.String(255),     nullable=False),
        sa.Column("phone",           sa.String(50),      nullable=True),
        sa.Column("hashed_password", sa.String(255),     nullable=False),
        sa.Column("is_active",       sa.Boolean(),       nullable=False, server_default="true"),
        sa.Column("created_at",      sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at",      sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "password_reset_tokens",
        sa.Column("id",         UUID(as_uuid=True), primary_key=True),
        sa.Column("email",      sa.String(255),     nullable=False),
        sa.Column("otp",        sa.String(6),       nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used",       sa.Boolean(),       nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_password_reset_tokens_email", "password_reset_tokens", ["email"])

    op.create_table(
        "recommendation_history",
        sa.Column("id",          UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id",     UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("latitude",    sa.Float(),         nullable=False),
        sa.Column("longitude",   sa.Float(),         nullable=False),
        sa.Column("nitrogen",    sa.Float(),         nullable=True),
        sa.Column("phosphorus",  sa.Float(),         nullable=True),
        sa.Column("potassium",   sa.Float(),         nullable=True),
        sa.Column("ph",          sa.Float(),         nullable=True),
        sa.Column("soil_source", sa.String(50),      nullable=True),
        sa.Column("temperature", sa.Float(),         nullable=True),
        sa.Column("humidity",    sa.Float(),         nullable=True),
        sa.Column("rainfall",    sa.Float(),         nullable=True),
        sa.Column("top_crops",   sa.Text(),          nullable=True),
        sa.Column("created_at",  sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_recommendation_history_user_id", "recommendation_history", ["user_id"])


def downgrade() -> None:
    op.drop_table("recommendation_history")
    op.drop_table("password_reset_tokens")
    op.drop_table("users")
