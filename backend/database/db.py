import os
import json
import uuid
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "").strip()

# Try to import motor and pymongo
use_mongodb = False
db_client = None
mongodb_db = None

if MONGO_URI:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import pymongo
        db_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        # Try to verify connection (ping)
        # We run this in the background or check on first request.
        # For setup, we'll initialize the client.
        mongodb_db = db_client.get_database("incident_agent")
        use_mongodb = True
        print("MongoDB URI detected. Initializing MongoDB client connection...")
    except Exception as e:
        print(f"Failed to initialize MongoDB client: {e}. Falling back to local JSON DB.")
        use_mongodb = False
else:
    print("No MONGO_URI provided in .env. Using local JSON database.")

# Ensure local data directory exists
LOCAL_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(LOCAL_DATA_DIR, exist_ok=True)

class LocalJSONCollection:
    def __init__(self, collection_name: str):
        self.file_path = os.path.join(LOCAL_DATA_DIR, f"{collection_name}.json")
        self.lock = asyncio.Lock()
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w") as f:
                json.dump([], f)

    def _read_data(self):
        try:
            with open(self.file_path, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_data(self, data):
        try:
            with open(self.file_path, "w") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            print(f"Error writing to {self.file_path}: {e}")

    def _match_query(self, doc, query):
        if not query:
            return True
        for key, val in query.items():
            # Handle special MongoDB operators if any
            if isinstance(val, dict):
                # E.g., {"$gt": val} or {"$in": [...]}
                doc_val = doc.get(key)
                for op, op_val in val.items():
                    if op == "$in":
                        if doc_val not in op_val:
                            return False
                    elif op == "$nin":
                        if doc_val in op_val:
                            return False
                    elif op == "$regex":
                        import re
                        ignore_case = "$options" in val and "i" in val["$options"]
                        flags = re.IGNORECASE if ignore_case else 0
                        pattern = op_val
                        if not doc_val or not re.search(pattern, str(doc_val), flags):
                            return False
                    elif op == "$gt":
                        if not doc_val or doc_val <= op_val:
                            return False
                    elif op == "$gte":
                        if not doc_val or doc_val < op_val:
                            return False
                    elif op == "$lt":
                        if not doc_val or doc_val >= op_val:
                            return False
                    elif op == "$lte":
                        if not doc_val or doc_val > op_val:
                            return False
                    elif op == "$ne":
                        if doc_val == op_val:
                            return False
                continue

            # Standard equality check
            # Handle standard _id queries which might be ObjectId, but in JSON it is string
            if key == "_id" and isinstance(val, dict) and "$in" in val:
                if str(doc.get("_id")) not in [str(x) for x in val["$in"]]:
                    return False
            elif key == "_id":
                if str(doc.get("_id")) != str(val):
                    return False
            elif doc.get(key) != val:
                return False
        return True

    async def insert_one(self, document: dict):
        async with self.lock:
            data = self._read_data()
            doc_copy = dict(document)
            if "_id" not in doc_copy:
                doc_copy["_id"] = str(uuid.uuid4())
            else:
                doc_copy["_id"] = str(doc_copy["_id"])
            
            # Convert datetime objects to ISO strings for JSON storage
            for k, v in doc_copy.items():
                if isinstance(v, datetime):
                    doc_copy[k] = v.isoformat()
            
            data.append(doc_copy)
            self._write_data(data)
            
            class InsertResult:
                def __init__(self, inserted_id):
                    self.inserted_id = inserted_id
            return InsertResult(doc_copy["_id"])

    async def find_one(self, query: dict = None):
        async with self.lock:
            data = self._read_data()
            for doc in data:
                if self._match_query(doc, query):
                    return doc
            return None

    def find(self, query: dict = None):
        # Returns a cursor-like wrapper
        class LocalCursor:
            def __init__(self, collection, q):
                self.collection = collection
                self.q = q
                self._sort_key = None
                self._sort_direction = 1
                self._skip_val = 0
                self._limit_val = None

            def sort(self, key_or_list, direction=1):
                if isinstance(key_or_list, list):
                    # List of tuples e.g. [('timestamp', -1)]
                    self._sort_key = key_or_list[0][0]
                    self._sort_direction = key_or_list[0][1]
                else:
                    self._sort_key = key_or_list
                    self._sort_direction = direction
                return self

            def skip(self, val):
                self._skip_val = val
                return self

            def limit(self, val):
                self._limit_val = val
                return self

            async def to_list(self, length=None):
                async with self.collection.lock:
                    data = self.collection._read_data()
                    results = []
                    for doc in data:
                        if self.collection._match_query(doc, self.q):
                            results.append(doc)
                    
                    if self._sort_key:
                        reverse = self._sort_direction == -1
                        # Handle missing keys or None
                        def get_key(d):
                            val = d.get(self._sort_key)
                            return val if val is not None else ""
                        try:
                            results.sort(key=get_key, reverse=reverse)
                        except Exception:
                            pass # Fallback if types mismatch
                    
                    start = self._skip_val
                    end = None
                    if self._limit_val is not None:
                        end = start + self._limit_val
                    elif length is not None:
                        end = start + length
                        
                    return results[start:end] if end is not None else results[start:]

            def __aiter__(self):
                # Simple async iterator
                self._index = 0
                self._items = None
                return self

            async def __anext__(self):
                if self._items is None:
                    self._items = await self.to_list()
                if self._index < len(self._items):
                    item = self._items[self._index]
                    self._index += 1
                    return item
                else:
                    raise StopAsyncIteration

        return LocalCursor(self, query)

    async def update_one(self, query: dict, update: dict):
        async with self.lock:
            data = self._read_data()
            matched_index = -1
            for idx, doc in enumerate(data):
                if self._match_query(doc, query):
                    matched_index = idx
                    break
            
            if matched_index != -1:
                doc = data[matched_index]
                # Apply $set operator if present
                if "$set" in update:
                    for k, v in update["$set"].items():
                        if isinstance(v, datetime):
                            v = v.isoformat()
                        doc[k] = v
                else:
                    # Direct update
                    for k, v in update.items():
                        if isinstance(v, datetime):
                            v = v.isoformat()
                        doc[k] = v
                
                data[matched_index] = doc
                self._write_data(data)
                
                class UpdateResult:
                    def __init__(self, modified_count):
                        self.modified_count = modified_count
                return UpdateResult(1)
            
            class UpdateResultZero:
                def __init__(self):
                    self.modified_count = 0
            return UpdateResultZero()

    async def delete_one(self, query: dict):
        async with self.lock:
            data = self._read_data()
            matched_index = -1
            for idx, doc in enumerate(data):
                if self._match_query(doc, query):
                    matched_index = idx
                    break
            
            if matched_index != -1:
                data.pop(matched_index)
                self._write_data(data)
                
                class DeleteResult:
                    def __init__(self, deleted_count):
                        self.deleted_count = deleted_count
                return DeleteResult(1)
            
            class DeleteResultZero:
                def __init__(self):
                    self.deleted_count = 0
            return DeleteResultZero()

    async def count_documents(self, query: dict = None):
        async with self.lock:
            data = self._read_data()
            count = 0
            for doc in data:
                if self._match_query(doc, query):
                    count += 1
            return count

class LocalDatabase:
    def __init__(self):
        self.collections = {}

    def get_collection(self, name: str):
        if name not in self.collections:
            self.collections[name] = LocalJSONCollection(name)
        return self.collections[name]

# Helper function to get database collections
def get_db_collection(name: str):
    """
    Returns a collection wrapper. If MONGO_URI is set and motor client connected,
    it returns the async motor collection. Otherwise, it returns the local JSON fallback collection.
    """
    global use_mongodb, mongodb_db
    if use_mongodb and mongodb_db is not None:
        try:
            return mongodb_db.get_collection(name)
        except Exception as e:
            print(f"Error accessing MongoDB collection {name}: {e}. Falling back to local JSON DB.")
            # fallback for this call
    
    # Use Local DB fallback
    if not hasattr(get_db_collection, "_local_db"):
        get_db_collection._local_db = LocalDatabase()
    return get_db_collection._local_db.get_collection(name)

async def test_db_connection():
    """
    Verify if MongoDB connection actually works, otherwise update use_mongodb state.
    """
    global use_mongodb, db_client
    if use_mongodb and db_client:
        try:
            # The ismaster command is cheap and does not require auth.
            await db_client.admin.command('ismaster')
            print("MongoDB Atlas connection established successfully!")
        except Exception as e:
            print(f"MongoDB connection ping failed: {e}. Defaulting to Local JSON database.")
            use_mongodb = False
