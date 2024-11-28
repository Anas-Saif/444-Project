import os
import sys
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from alembic import context

# Load environment variables
from os import getenv

# Add your project directory to sys.path
sys.path.append(os.path.abspath(os.path.jgoin(os.path.dirname(__file__), '..')))

from db.schema import Base 
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# Read the database URL from the environment variable
database_url = os.getenv('DB_URL')

if database_url is None:
    raise ValueError("DATABASE_URL environment variable not set.")

# Set the SQLAlchemy URL in the Alembic configuration
config.set_main_option('sqlalchemy.url', database_url)

# Set target metadata
target_metadata = Base.metadata

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,  
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,  
    )

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = create_async_engine(
        config.get_main_option("sqlalchemy.url"),
        future=True,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())