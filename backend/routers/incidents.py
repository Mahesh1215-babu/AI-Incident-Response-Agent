from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from backend.models.schemas import IncidentCreate, IncidentResponse, FeedbackSubmit
from backend.database.db import get_db_collection
from backend.memory.hindsight import HindsightMemoryEngine
from backend.cascade.cascadeflow import CascadeflowRouter
from backend.utils.helpers import get_current_user_from_token, get_admin_user

router = APIRouter(tags=["Incidents"])

@router.post("/upload-log")
async def upload_log(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user_from_token)
):
    """
    Parses and extracts text from .log, .txt, or .json log files.
    """
    filename = file.filename.lower()
    if not (filename.endswith(".log") or filename.endswith(".txt") or filename.endswith(".json")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a .log, .txt, or .json file."
        )
    try:
        contents = await file.read()
        log_text = contents.decode("utf-8", errors="ignore")
        return {"filename": file.filename, "log_text": log_text, "size": len(log_text)}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file: {e}"
        )

@router.post("/analyze", response_model=IncidentResponse)
async def analyze_incident(
    incident_data: IncidentCreate,
    current_user: dict = Depends(get_current_user_from_token)
):
    """
    Main incident analysis pipeline.
    1. Search Hindsight persistent memory for similar incidents.
    2. Dynamically route request to optimal model via cascadeflow.
    3. Generate root cause and resolution.
    4. Store incident record.
    """
    incidents_col = get_db_collection("incidents")
    
    # 1. Search previous memories using Hindsight Engine
    similar_memories = await HindsightMemoryEngine.search_similar_memories(
        title=incident_data.title,
        logs=incident_data.logs,
        limit=3
    )
    
    # 2. Format memories context for AI prompt
    memory_context = ""
    if similar_memories:
        memory_context = "Found similar past incidents in Hindsight memory:\n"
        for i, mem in enumerate(similar_memories):
            memory_context += (
                f"- Past Incident #{i+1}: '{mem.get('title')}'\n"
                f"  Root Cause: {mem.get('root_cause')}\n"
                f"  Resolution: {mem.get('final_resolution')}\n"
                f"  Resolution success rate: {mem.get('is_success')}\n"
                f"  Engineer Notes: {mem.get('engineer_notes', 'N/A')}\n"
            )
            
    # 3. Call Cascadeflow routing and run analysis
    analysis = await CascadeflowRouter.route_and_execute(
        title=incident_data.title,
        logs=incident_data.logs,
        severity=incident_data.severity,
        environment=incident_data.environment,
        hindsight_context=memory_context
    )
    
    # 4. Insert incident into DB
    new_incident = {
        "title": incident_data.title,
        "logs": incident_data.logs,
        "severity": incident_data.severity,
        "environment": incident_data.environment,
        "status": "Open",
        "created_by": current_user["email"],
        "created_at": datetime.utcnow().isoformat(),
        
        # AI output
        "summary": analysis.get("summary"),
        "root_cause": analysis.get("root_cause"),
        "confidence_score": analysis.get("confidence_score"),
        "affected_components": analysis.get("affected_components", []),
        "recommended_resolution": analysis.get("recommended_resolution", []),
        "preventive_measures": analysis.get("preventive_measures", []),
        "estimated_resolution_time": analysis.get("estimated_resolution_time"),
        
        # Cascadeflow routing detail
        "model_used": analysis.get("model_used"),
        "routing_reason": analysis.get("routing_reason"),
        "routing_cost": analysis.get("routing_cost", 0.0),
        "routing_latency": analysis.get("routing_latency", 0.0),
        
        # Hindsight results
        "matched_memories": similar_memories
    }
    
    res = await incidents_col.insert_one(new_incident)
    new_incident["id"] = str(res.inserted_id)
    
    return new_incident

@router.get("/incidents", response_model=List[IncidentResponse])
async def get_incidents(
    search: Optional[str] = None,
    severity: Optional[str] = None,
    environment: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user_from_token)
):
    """
    Get incident list with search, filter, and date ordering.
    """
    incidents_col = get_db_collection("incidents")
    query = {}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"logs": {"$regex": search, "$options": "i"}},
            {"root_cause": {"$regex": search, "$options": "i"}}
        ]
    if severity and severity != "All":
        query["severity"] = severity
    if environment and environment != "All":
        query["environment"] = environment
    if status and status != "All":
        query["status"] = status
        
    cursor = incidents_col.find(query).sort("created_at", -1)
    items = await cursor.to_list(100)
    
    # Map _id object/string to id
    for item in items:
        item["id"] = str(item["_id"])
    return items

@router.get("/incident/{id}", response_model=IncidentResponse)
async def get_incident(
    id: str,
    current_user: dict = Depends(get_current_user_from_token)
):
    incidents_col = get_db_collection("incidents")
    
    # Try finding by String ID or ObjectId
    query = {"_id": id}
    item = await incidents_col.find_one(query)
    
    if not item and ObjectId.is_valid(id):
        item = await incidents_col.find_one({"_id": ObjectId(id)})
        
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident report not found."
        )
        
    item["id"] = str(item["_id"])
    return item

@router.delete("/incident/{id}")
async def delete_incident(
    id: str,
    current_user: dict = Depends(get_admin_user) # Only admins can delete incidents
):
    incidents_col = get_db_collection("incidents")
    
    # Match query support
    query = {"_id": id}
    res = await incidents_col.delete_one(query)
    
    if res.deleted_count == 0 and ObjectId.is_valid(id):
        res = await incidents_col.delete_one({"_id": ObjectId(id)})
        
    if res.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident report not found or could not be deleted."
        )
        
    return {"message": "Incident report deleted successfully"}

@router.post("/feedback", response_model=IncidentResponse)
async def submit_feedback(
    feedback: FeedbackSubmit,
    current_user: dict = Depends(get_current_user_from_token)
):
    """
    Registers the engineer's final resolution details.
    This action triggers Hindsight Memory addition.
    """
    incidents_col = get_db_collection("incidents")
    incident_id = feedback.incident_id
    
    # Locate incident
    query = {"_id": incident_id}
    incident = await incidents_col.find_one(query)
    if not incident and ObjectId.is_valid(incident_id):
        query = {"_id": ObjectId(incident_id)}
        incident = await incidents_col.find_one(query)
        
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident report not found."
        )
        
    # Mark resolved and update status
    update_data = {
        "status": "Resolved",
        "final_resolution": feedback.final_resolution,
        "resolution_time_minutes": feedback.resolution_time_minutes,
        "engineer_notes": feedback.engineer_notes,
        "is_success": feedback.is_success,
        "resolved_at": datetime.utcnow().isoformat()
    }
    
    await incidents_col.update_one(query, {"$set": update_data})
    
    # Fetch updated incident
    updated_incident = await incidents_col.find_one(query)
    updated_incident["id"] = str(updated_incident["_id"])
    
    # Save into Hindsight persistent memory to make it searchable in future incidents
    await HindsightMemoryEngine.add_memory(updated_incident, update_data)
    
    return updated_incident
