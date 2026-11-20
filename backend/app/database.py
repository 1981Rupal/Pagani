import logging
from typing import Optional
from pymongo import AsyncMongoClient, ASCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings
from app.catalogue import VEHICLES, EXTERIOR_THEMES, INTERIOR_THEMES

logger = logging.getLogger("pagani.database")

client: Optional[AsyncMongoClient] = None
is_connected: bool = False
connection_error: Optional[str] = None


async def get_client() -> Optional[AsyncMongoClient]:
    global client
    return client


def get_db():
    global client
    if client and is_connected:
        return client[settings.mongodb_database]
    return None


async def init_db() -> bool:
    """Initialize AsyncMongoClient, verify connection, ensure indexes, and seed catalogue."""
    global client, is_connected, connection_error

    uri = settings.mongodb_uri.strip() or settings.mongodb_url.strip()
    if not uri:
        is_connected = False
        connection_error = "Neither MONGODB_URI nor MONGODB_URL is configured. Operating in local in-memory fallback mode."
        logger.info("MongoDB Atlas: Connection string not configured. Operating in local fallback mode.")
        return False

    try:
        logger.info("Connecting to MongoDB Atlas via AsyncMongoClient...")
        client = AsyncMongoClient(
            uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=10000,
            retryWrites=True,
            w="majority",
            appname=settings.app_name,
        )

        # Ping database to confirm live cloud connection
        await client.admin.command("ping")
        is_connected = True
        connection_error = None
        logger.info(f"MongoDB Atlas: Successfully connected to database '{settings.mongodb_database}'")

        # Setup collections and indexes
        await _ensure_indexes()

        # Seed initial catalogue data if empty
        await _seed_catalogue()

        return True

    except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
        is_connected = False
        connection_error = f"Atlas connection failed: {exc}"
        logger.warning(f"MongoDB Atlas: {connection_error}. Operating in local fallback mode.")
        return False
    except Exception as exc:
        is_connected = False
        connection_error = f"Database initialization error: {exc}"
        logger.error(f"MongoDB Atlas error: {exc}")
        return False


async def close_db():
    """Close MongoDB connection pool gracefully during shutdown."""
    global client, is_connected
    if client:
        logger.info("Closing MongoDB Atlas connection pool...")
        await client.close()
        client = None
        is_connected = False


async def _ensure_indexes():
    """Create indexes for all 7 required collections."""
    db = get_db()
    if db is None:
        return

    try:
        # 1. users
        await db.users.create_index([("email", ASCENDING)], unique=True, sparse=True)
        await db.users.create_index([("created_at", ASCENDING)])

        # 2. vehicles
        await db.vehicles.create_index([("id", ASCENDING)], unique=True)

        # 3. vehicle_options
        await db.vehicle_options.create_index(
            [("vehicle_id", ASCENDING), ("option_path", ASCENDING)],
            unique=True
        )

        # 4. design_configurations
        await db.design_configurations.create_index([("id", ASCENDING)], unique=True)
        await db.design_configurations.create_index([("vehicle_id", ASCENDING)])
        await db.design_configurations.create_index([("user_id", ASCENDING)], sparse=True)
        await db.design_configurations.create_index([("updated_at", ASCENDING)])

        # 5. ai_proposals
        await db.ai_proposals.create_index([("id", ASCENDING)], unique=True)
        await db.ai_proposals.create_index([("vehicle_id", ASCENDING)])
        await db.ai_proposals.create_index([("created_at", ASCENDING)])

        # 6. design_versions
        await db.design_versions.create_index([("configuration_id", ASCENDING)])
        await db.design_versions.create_index(
            [("configuration_id", ASCENDING), ("version_number", ASCENDING)],
            unique=True
        )
        await db.design_versions.create_index([("created_at", ASCENDING)])

        # 7. design_themes
        await db.design_themes.create_index([("id", ASCENDING)], unique=True)
        await db.design_themes.create_index([("vehicle_id", ASCENDING), ("theme_type", ASCENDING)])

        logger.info("MongoDB Atlas: Indexes ensured across all 7 collections.")
    except Exception as exc:
        logger.warning(f"Failed to ensure all indexes: {exc}")


async def _seed_catalogue():
    """Seed vehicles, vehicle_options, and design_themes if not present."""
    db = get_db()
    if db is None:
        return

    try:
        # Seed vehicles
        count = await db.vehicles.count_documents({})
        if count == 0:
            for v_id, v_data in VEHICLES.items():
                doc = {
                    "id": v_id,
                    "name": v_data["name"],
                    "model_year_label": v_data.get("model_year_label", ""),
                }
                await db.vehicles.update_one({"id": v_id}, {"$set": doc}, upsert=True)

                # Seed options
                for opt_path, opt_values in v_data.get("options", {}).items():
                    opt_doc = {
                        "vehicle_id": v_id,
                        "option_path": opt_path,
                        "allowed_values": opt_values,
                    }
                    await db.vehicle_options.update_one(
                        {"vehicle_id": v_id, "option_path": opt_path},
                        {"$set": opt_doc},
                        upsert=True,
                    )

        # Seed themes
        theme_count = await db.design_themes.count_documents({})
        if theme_count == 0:
            for theme in EXTERIOR_THEMES:
                doc = {**theme, "vehicle_id": "pagani_utopia", "theme_type": "exterior"}
                await db.design_themes.update_one({"id": theme["id"]}, {"$set": doc}, upsert=True)
            for theme in INTERIOR_THEMES:
                doc = {**theme, "vehicle_id": "pagani_utopia", "theme_type": "interior"}
                await db.design_themes.update_one({"id": theme["id"]}, {"$set": doc}, upsert=True)

        logger.info("MongoDB Atlas: Catalogue data verified and seeded.")
    except Exception as exc:
        logger.warning(f"Catalogue seed warning: {exc}")

