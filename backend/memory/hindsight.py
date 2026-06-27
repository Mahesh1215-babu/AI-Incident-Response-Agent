import os
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv
from backend.database.db import get_db_collection
from hindsight_client import Hindsight

# Load environment configurations
load_dotenv()

HINDSIGHT_BASE_URL = os.getenv("HINDSIGHT_BASE_URL", "").strip() or "http://localhost:8888"
HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY", "").strip()
HINDSIGHT_BANK_ID = os.getenv("HINDSIGHT_BANK_ID", "incidents").strip()

# Global health status tracking
# None = unchecked/not initialized, True = connected, False = degraded/offline
hindsight_healthy = None
hindsight_client_instance = None

def get_hindsight_client():
    global hindsight_client_instance
    if hindsight_client_instance is not None:
        return hindsight_client_instance
    try:
        hindsight_client_instance = Hindsight(base_url=HINDSIGHT_BASE_URL, api_key=HINDSIGHT_API_KEY)
        return hindsight_client_instance
    except Exception as e:
        print(f"Hindsight initialization error: {e}")
        return None

async def init_hindsight():
    """
    Initializes the Hindsight client, verifies server health, and ensures the bank exists.
    Updates the hindsight_healthy global state accordingly.
    """
    global hindsight_healthy
    client = get_hindsight_client()
    if not client:
        hindsight_healthy = False
        print("Hindsight: UNREACHABLE — falling back to simulation mode for memory")
        return False

    try:
        # Check connection
        await client.aget_version()
        
        # Idempotent bank creation
        try:
            await client.acreate_bank(bank_id=HINDSIGHT_BANK_ID, name="Incident Response Bank")
        except Exception as e:
            # Check specifically for "already exists" (usually HTTP 409 Conflict)
            err_str = str(e).lower()
            is_already_exists = False
            try:
                from aiohttp import ClientResponseError
                if isinstance(e, ClientResponseError):
                    if e.status == 409 or "already exists" in err_str or "conflict" in err_str:
                        is_already_exists = True
            except ImportError:
                pass
            
            if not is_already_exists and ("already exists" in err_str or "conflict" in err_str or "409" in err_str):
                is_already_exists = True
                
            if not is_already_exists:
                # Other error (like authorization, server error, etc.) -> bubble up
                raise e

        hindsight_healthy = True
        print(f"Hindsight: connected ({HINDSIGHT_BASE_URL}, bank={HINDSIGHT_BANK_ID})")
        return True
    except Exception as e:
        hindsight_healthy = False
        print(f"Hindsight: UNREACHABLE — falling back to simulation mode for memory (Error: {e})")
        return False


class HindsightMemoryEngine:
    @staticmethod
    async def get_all_memories() -> List[Dict[str, Any]]:
        mem_col = get_db_collection("memories")
        # Fetch all memories
        cursor = mem_col.find({})
        return await cursor.to_list(1000)

    @classmethod
    async def search_similar_memories(cls, title: str, logs: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Finds previous incident memories using the real Hindsight SDK.
        If the server is offline/degraded, falls back gracefully to a local DB keyword search with a warning.
        """
        global hindsight_healthy
        if hindsight_healthy is None:
            await init_hindsight()

        if not hindsight_healthy:
            return await cls._fallback_local_search(title, logs, limit)

        client = get_hindsight_client()
        if not client:
            return await cls._fallback_local_search(title, logs, limit)

        query_text = f"{title}\n{logs}"

        def _recall():
            try:
                return client.recall(
                    bank_id=HINDSIGHT_BANK_ID,
                    query=query_text,
                    max_tokens=4096,
                )
            except Exception as e:
                print(f"Hindsight recall error: {e}")
                return None

        recall_result = await asyncio.to_thread(_recall)
        if not recall_result or not hasattr(recall_result, 'results'):
            # Connection lost or client error during request
            hindsight_healthy = False
            print("Hindsight connection lost during recall. Failing back to local search.")
            return await cls._fallback_local_search(title, logs, limit)

        results = []
        for r in recall_result.results:
            if hasattr(r, 'metadata') and isinstance(r.metadata, dict):
                mem_dict = r.metadata.copy()
                mem_dict["similarity_score"] = 0.99  # Semantic match
                mem_dict["id"] = mem_dict.get("id", str(mem_dict.get("_id", "")))
                results.append(mem_dict)

        return results[:limit]

    @classmethod
    async def _fallback_local_search(cls, title: str, logs: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Fallback keyword/regex search against local database when Hindsight is offline.
        Prepends a clearly-labeled warning stub memory.
        """
        mem_col = get_db_collection("memories")
        words = set([w.strip().lower() for w in title.split() if len(w.strip()) > 2])
        query = {}
        if words:
            query["$or"] = []
            for w in words:
                query["$or"].extend([
                    {"title": {"$regex": w, "$options": "i"}},
                    {"root_cause": {"$regex": w, "$options": "i"}}
                ])

        cursor = mem_col.find(query).sort("timestamp", -1)
        local_results = await cursor.to_list(limit)

        results = []
        for mem in local_results:
            mem_dict = mem.copy()
            mem_dict["id"] = str(mem_dict.get("_id", ""))
            mem_dict["similarity_score"] = 0.8
            results.append(mem_dict)

        # Prepend a clearly-labeled degraded mode warning stub
        warning_stub = {
            "id": "degraded_warning",
            "title": "[DEGRADED MODE] Hindsight memory server is offline/unreachable",
            "logs": "",
            "root_cause": "Hindsight server at HINDSIGHT_BASE_URL is not running or unreachable.",
            "final_resolution": "The system has automatically fallen back to the local database. Start the Hindsight memory server via Docker or configure your credentials in the environment variables to activate full semantic recall.",
            "is_success": False,
            "similarity_score": 1.0,
            "engineer_notes": "Memory feature degraded. Cascadeflow/AI diagnostics remain fully operational.",
            "timestamp": datetime.utcnow().isoformat()
        }
        results.insert(0, warning_stub)
        return results[:limit]

    @classmethod
    async def add_memory(cls, incident: Dict[str, Any], feedback: Dict[str, Any]) -> Dict[str, Any]:
        """
        Saves a resolved incident into Hindsight Memory (both locally for listing and in Hindsight for recall).
        """
        mem_col = get_db_collection("memories")
        existing = await mem_col.find_one({"incident_id": str(incident["_id"])})

        recommended_res = incident.get("recommended_resolution", [])
        if isinstance(recommended_res, str):
            recommended_res = [recommended_res]

        new_memory = {
            "incident_id": str(incident["_id"]),
            "title": incident["title"],
            "logs": incident["logs"],
            "root_cause": incident.get("root_cause", "Unknown"),
            "recommended_solution": recommended_res,
            "final_resolution": feedback["final_resolution"],
            "resolution_time_minutes": feedback["resolution_time_minutes"],
            "engineer_notes": feedback.get("engineer_notes", ""),
            "is_success": feedback["is_success"],
            "timestamp": incident.get("created_at") or datetime.utcnow().isoformat()
        }

        # Save locally for exact listing
        if existing:
            await mem_col.update_one({"_id": existing["_id"]}, {"$set": new_memory})
            new_memory["id"] = str(existing["_id"])
        else:
            res = await mem_col.insert_one(new_memory)
            new_memory["id"] = str(res.inserted_id)

        # Retain in Hindsight
        global hindsight_healthy
        if hindsight_healthy is None:
            await init_hindsight()

        if hindsight_healthy:
            client = get_hindsight_client()
            if client:
                content = (
                    f"Title: {new_memory['title']}\n"
                    f"Logs: {new_memory['logs']}\n"
                    f"Root Cause: {new_memory['root_cause']}\n"
                    f"Resolution: {new_memory['final_resolution']}\n"
                    f"Notes: {new_memory['engineer_notes']}"
                )
                tags = ["incident"]
                if new_memory.get("is_success"):
                    tags.append("successful")

                def _retain():
                    try:
                        client.retain(
                            bank_id=HINDSIGHT_BANK_ID,
                            content=content,
                            context="incident resolution",
                            tags=tags,
                            metadata=new_memory
                        )
                        return True
                    except Exception as e:
                        print(f"Hindsight retain error: {e}")
                        return False

                success = await asyncio.to_thread(_retain)
                if not success:
                    hindsight_healthy = False
                    print("Hindsight connection lost during retain call.")

        return new_memory

    @classmethod
    async def reflect(cls, query: str) -> Dict[str, Any]:
        """
        Synthesizes an answer based on Hindsight memory facts.
        """
        global hindsight_healthy
        if hindsight_healthy is None:
            await init_hindsight()

        if not hindsight_healthy:
            return {
                "answer": "Hindsight Memory: DEGRADED mode. Hindsight server is unreachable. Offline mode is active using local fallback database.",
                "based_on": []
            }

        client = get_hindsight_client()
        if not client:
            return {
                "answer": "Hindsight Memory: DEGRADED mode. Hindsight client is not initialized.",
                "based_on": []
            }

        def _reflect():
            try:
                return client.reflect(bank_id=HINDSIGHT_BANK_ID, query=query)
            except Exception as e:
                print(f"Hindsight reflect error: {e}")
                return None

        reflect_result = await asyncio.to_thread(_reflect)
        if reflect_result:
            return {
                "answer": getattr(reflect_result, "text", "No answer could be synthesized."),
                "based_on": getattr(reflect_result, "based_on", [])
            }

        hindsight_healthy = False
        print("Hindsight connection lost during reflect call.")
        return {
            "answer": "Hindsight Memory: DEGRADED mode (Connection lost).",
            "based_on": []
        }

    @classmethod
    async def get_memory_insights(cls, search_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes search results and calculates resolution success rate and recommended solutions.
        """
        if not search_results:
            return {
                "count": 0,
                "most_successful_fix": None,
                "success_rate": 0.0,
                "engineer_notes": []
            }

        success_count = sum(1 for m in search_results if m.get("is_success", True))
        success_rate = (success_count / len(search_results)) * 100.0

        resolutions = {}
        engineer_notes = []
        for mem in search_results:
            if mem.get("is_success", True):
                res = mem.get("final_resolution", "")
                if res:
                    resolutions[res] = resolutions.get(res, 0) + 1
            if mem.get("engineer_notes"):
                engineer_notes.append(mem["engineer_notes"])

        most_successful_fix = None
        if resolutions:
            most_successful_fix = max(resolutions, key=resolutions.get)

        return {
            "count": len(search_results),
            "most_successful_fix": most_successful_fix,
            "success_rate": round(success_rate, 2),
            "engineer_notes": engineer_notes[:3]
        }
