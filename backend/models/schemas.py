from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = "engineer" # engineer, admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Incident Analysis Schemas ---
class IncidentCreate(BaseModel):
    title: str
    logs: str
    severity: str # Low, Medium, High, Critical
    environment: str # Development, Testing, Production, Cloud, On-premise

class FeedbackSubmit(BaseModel):
    incident_id: str
    final_resolution: str
    resolution_time_minutes: int
    engineer_notes: Optional[str] = ""
    is_success: bool # success or failure

class IncidentResponse(BaseModel):
    id: str
    title: str
    logs: str
    severity: str
    environment: str
    status: str # Open, Resolved
    created_by: str
    created_at: str
    
    # AI generated analysis
    summary: Optional[str] = None
    root_cause: Optional[str] = None
    confidence_score: Optional[float] = None
    affected_components: Optional[List[str]] = []
    recommended_resolution: Optional[List[str]] = []
    preventive_measures: Optional[List[str]] = []
    estimated_resolution_time: Optional[str] = None
    
    # Cascadeflow selection meta
    model_used: Optional[str] = None
    routing_reason: Optional[str] = None
    routing_cost: Optional[float] = 0.0
    routing_latency: Optional[float] = 0.0
    
    # Hindsight memories list
    matched_memories: Optional[List[Dict[str, Any]]] = []
    
    # Feedback / resolution data
    final_resolution: Optional[str] = None
    resolution_time_minutes: Optional[int] = None
    engineer_notes: Optional[str] = None
    is_success: Optional[bool] = None
    resolved_at: Optional[str] = None

# --- Hindsight Memory Schemas ---
class MemoryResponse(BaseModel):
    id: str
    incident_id: str
    title: str
    logs: str
    root_cause: str
    recommended_solution: List[str]
    final_resolution: str
    resolution_time_minutes: int
    engineer_notes: str
    is_success: bool
    similarity_score: Optional[float] = 0.0
    timestamp: str

# --- Cascadeflow Audit Logs ---
class AuditLogResponse(BaseModel):
    id: str
    incident_id: Optional[str] = None
    timestamp: str
    model_selected: str
    reason: str
    estimated_cost: float
    latency: float
    input_tokens: int
    output_tokens: int
    total_tokens: int
    severity: str
    log_size: int

# --- Reports & Analytics ---
class RepeatedIncident(BaseModel):
    pattern: str
    count: int
    severity: str
    last_occurred: str

class ReportDashboard(BaseModel):
    total_incidents: int
    open_incidents: int
    resolved_incidents: int
    critical_incidents: int
    average_resolution_time_minutes: float
    recent_activity: List[Dict[str, Any]]
    
    # AI/Cascadeflow stats
    model_usage: Dict[str, int]
    cascadeflow_cost_savings: float
    total_tokens_used: int
    total_cost: float
    
    # Hindsight stats
    total_memories: int
    memory_recall_count: int
    
    # Failure trends
    common_failures: List[Dict[str, Any]] # e.g. [{"category": "DB", "count": 10}]
    weekly_breakdown: List[Dict[str, Any]] # e.g. [{"week": "Week 1", "resolved": 5, "unresolved": 2}]
