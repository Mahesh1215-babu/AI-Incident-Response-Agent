import math
import re
from datetime import datetime
from typing import List, Dict, Any, Tuple
from backend.database.db import get_db_collection

# Standard set of english stop words to improve TF-IDF accuracy
STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
    'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here',
    'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in',
    'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor',
    'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'shan&apos;t', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that',
    'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd',
    'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
    'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres',
    'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd',
    'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves'
}

def tokenize(text: str) -> List[str]:
    """
    Lowercase text, remove special characters/punctuation, and split into words.
    Filters out stop words and short numbers.
    """
    if not text:
        return []
    text = text.lower()
    # Replace non-alphanumeric characters with spaces
    words = re.findall(r'\b[a-z0-9_-]{2,}\b', text)
    return [w for w in words if w not in STOP_WORDS]

def compute_tf(tokens: List[str]) -> Dict[str, float]:
    """
    Computes term frequency (TF) for a list of tokens.
    Uses log-normalization.
    """
    tf = {}
    for token in tokens:
        tf[token] = tf.get(token, 0) + 1
    
    # Log normalize to reduce impact of extremely common log terms like dates or error labels
    for token in tf:
        tf[token] = 1 + math.log(tf[token])
    return tf

def compute_cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """
    Computes the cosine similarity between two sparse TF-IDF vectors.
    """
    intersection = set(vec1.keys()) & set(vec2.keys())
    if not intersection:
        return 0.0
        
    dot_product = sum(vec1[x] * vec2[x] for x in intersection)
    
    sum1 = sum(val ** 2 for val in vec1.values())
    sum2 = sum(val ** 2 for val in vec2.values())
    
    magnitude = math.sqrt(sum1) * math.sqrt(sum2)
    if not magnitude:
        return 0.0
        
    return dot_product / magnitude

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
        Finds previous incident memories that are similar to the incoming incident.
        """
        memories = await cls.get_all_memories()
        if not memories:
            return []

        # Tokenize search text
        search_text = f"{title} {logs}"
        search_tokens = tokenize(search_text)
        if not search_tokens:
            return []
            
        search_tf = compute_tf(search_tokens)

        # Build vocabulary across all memories for IDF
        all_docs_tokens = []
        for mem in memories:
            mem_text = f"{mem.get('title', '')} {mem.get('logs', '')} {mem.get('root_cause', '')} {mem.get('final_resolution', '')}"
            all_docs_tokens.append(tokenize(mem_text))
            
        # Compute IDF
        num_docs = len(memories)
        idf = {}
        for doc_tokens in all_docs_tokens:
            unique_tokens = set(doc_tokens)
            for token in unique_tokens:
                idf[token] = idf.get(token, 0) + 1
                
        for token in idf:
            # Add-one smoothing for IDF
            idf[token] = math.log((1 + num_docs) / (1 + idf[token])) + 1.0

        # Calculate TF-IDF for search query
        query_tfidf = {}
        for token, tf_val in search_tf.items():
            query_tfidf[token] = tf_val * idf.get(token, 1.0)

        results = []
        for i, mem in enumerate(memories):
            mem_tokens = all_docs_tokens[i]
            if not mem_tokens:
                continue
                
            mem_tf = compute_tf(mem_tokens)
            
            # Calculate TF-IDF for this memory
            mem_tfidf = {}
            for token, tf_val in mem_tf.items():
                mem_tfidf[token] = tf_val * idf.get(token, 1.0)
                
            similarity = compute_cosine_similarity(query_tfidf, mem_tfidf)
            
            # Format output memory data
            if similarity > 0.05: # threshold
                mem_copy = dict(mem)
                mem_copy["_id"] = str(mem_copy["_id"])
                mem_copy["similarity_score"] = round(similarity, 4)
                results.append(mem_copy)

        # Sort by similarity score descending
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:limit]

    @classmethod
    async def add_memory(cls, incident: Dict[str, Any], feedback: Dict[str, Any]) -> Dict[str, Any]:
        """
        Saves a resolved incident into Hindsight Memory.
        """
        mem_col = get_db_collection("memories")
        
        # Check if a memory for this incident already exists
        existing = await mem_col.find_one({"incident_id": str(incident["_id"])})
        
        # Ensure recommended_resolution is a list
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
        
        if existing:
            await mem_col.update_one({"_id": existing["_id"]}, {"$set": new_memory})
            new_memory["id"] = str(existing["_id"])
        else:
            res = await mem_col.insert_one(new_memory)
            new_memory["id"] = str(res.inserted_id)
            
        return new_memory

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
        
        # Extract resolutions and find the most common successful one
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
            "engineer_notes": engineer_notes[:3] # return top 3 notes
        }
