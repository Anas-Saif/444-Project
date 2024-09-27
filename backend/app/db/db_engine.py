## utils
from os import getenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
## schema
from db.schema import Base


db_url = getenv("DB_URL")
engine = create_async_engine(db_url, echo=False)

async def create_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

DB_session = async_sessionmaker(engine, expire_on_commit=False)