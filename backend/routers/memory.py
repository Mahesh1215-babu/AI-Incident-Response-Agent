from fastapi import APIRouter, Depends
from typing import Optional
from backend.database.db import get_db_collection
from backend.memory.hindsight import HindsightMemoryEngine
from backend.utils.helpers import get_current_user_from_token

router = APIRouter(tags=["Memory Explorer"])


@router.get("/memory/search")
async def search_memory(
    q: Optional[str] = None,
    filter_type: Optional[str] = None,  # Server, Database, Application
    current_user: dict = Depends(get_current_user_from_token)
):
    """
    Search memories collection.
    If search term is provided, queries Hindsight Memory Engine.
    Otherwise, returns all memories.
    """
    mem_col = get_db_collection("memories")

    if q and q.strip():
        # Perform text search similarity via hindsight engine
        similar = await HindsightMemoryEngine.search_similar_memories(title=q, logs=q, limit=20)

        # Apply local metadata filter if set
        if filter_type and filter_type != "All":
            filtered = []
            for mem in similar:
                text_to_search = f"{mem.get('title', '')} {mem.get('root_cause', '')} {mem.get('final_resolution', '')}".lower(
                )
                if filter_type.lower() in text_to_search:
                    filtered.append(mem)
            return filtered

        return similar

    # Return all memories if query empty
    query = {}
    if filter_type and filter_type != "All":
        query["$or"] = [
            {"title": {"$regex": filter_type, "$options": "i"}},
            {"root_cause": {"$regex": filter_type, "$options": "i"}},
            {"final_resolution": {"$regex": filter_type, "$options": "i"}}
        ]

    cursor = mem_col.find(query).sort("timestamp", -1)
    memories = await cursor.to_list(100)

    for mem in memories:
        mem["id"] = str(mem["_id"])
        # default score if not searched
        mem["similarity_score"] = 1.0

    return memories


@router.get("/memory/reflect")
async def reflect_memory(
    query: str,
    current_user: dict = Depends(get_current_user_from_token)
):
    return await HindsightMemoryEngine.reflect(query)
