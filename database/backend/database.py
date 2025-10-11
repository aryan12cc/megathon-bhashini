import psycopg2
from psycopg2.extras import RealDictCursor
from pymongo import MongoClient
from config import settings
from contextlib import contextmanager


# PostgreSQL Connection
def get_postgres_connection():
    """Get PostgreSQL database connection"""
    return psycopg2.connect(settings.POSTGRES_URL, cursor_factory=RealDictCursor)


@contextmanager
def get_postgres_cursor():
    """Context manager for PostgreSQL cursor"""
    conn = get_postgres_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


# MongoDB Connection
def get_mongodb_client():
    """Get MongoDB client"""
    return MongoClient(settings.MONGODB_URL)


def get_mongodb():
    """Get MongoDB database instance"""
    client = get_mongodb_client()
    return client.vaidyavaani


# Test connections
def test_connections():
    """Test database connections"""
    try:
        # Test PostgreSQL
        with get_postgres_cursor() as cursor:
            cursor.execute("SELECT 1")
            print("✅ PostgreSQL connection successful")
        
        # Test MongoDB
        db = get_mongodb()
        db.command('ping')
        print("✅ MongoDB connection successful")
        
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False
