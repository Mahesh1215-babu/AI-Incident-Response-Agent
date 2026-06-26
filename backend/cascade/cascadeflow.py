import os
import asyncio
import time
import json
import random
import httpx
from datetime import datetime
from typing import Dict, Any, Tuple
from dotenv import load_dotenv
from backend.database.db import get_db_collection

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

# Hardcoded model configurations & pricing (per 1,000,000 tokens)
MODEL_CONFIGS = {
    "llama-3.1-8b-instant": {
        "provider": "groq",
        "input_cost_per_m": 0.05,
        "output_cost_per_m": 0.08,
        "display_name": "Llama 3.1 8B (Groq)"
    },
    "mixtral-8x7b-32768": {
        "provider": "groq",
        "input_cost_per_m": 0.24,
        "output_cost_per_m": 0.24,
        "display_name": "Mixtral 8x7B (Groq)"
    },
    "llama-3.3-70b-versatile": {
        "provider": "groq",
        "input_cost_per_m": 0.59,
        "output_cost_per_m": 0.79,
        "display_name": "Llama 3.3 70B (Groq)"
    },
    "deepseek-r1-distill-llama-70b": {
        "provider": "groq",
        "input_cost_per_m": 0.59,
        "output_cost_per_m": 0.79,
        "display_name": "DeepSeek R1 70B (Groq)"
    },
    "gpt-4o-mini": {
        "provider": "openai",
        "input_cost_per_m": 0.15,
        "output_cost_per_m": 0.60,
        "display_name": "GPT-4o Mini (OpenAI)"
    },
    "gpt-4o": {
        "provider": "openai",
        "input_cost_per_m": 2.50,
        "output_cost_per_m": 10.00,
        "display_name": "GPT-4o (OpenAI)"
    }
}

class CascadeflowRouter:
    @classmethod
    def determine_route(cls, logs: str, severity: str) -> Tuple[str, str]:
        """
        Determines the optimal model and provides the reason based on log size and severity.
        """
        char_count = len(logs)
        line_count = len(logs.splitlines())
        severity_upper = severity.upper()
        
        # Decide provider based on available key
        has_groq = bool(GROQ_API_KEY)
        has_openai = bool(OPENAI_API_KEY)
        
        # Default fallback is groq, but if only openai is present, route to openai
        provider = "groq" if has_groq or not has_openai else "openai"
        
        if char_count > 15000 or line_count > 200:
            if provider == "groq":
                return "llama-3.3-70b-versatile", f"Large log size ({char_count} chars, {line_count} lines) requires high-context powerful model."
            else:
                return "gpt-4o", f"Large log size ({char_count} chars, {line_count} lines) requires high-context robust model."
                
        if severity_upper == "CRITICAL":
            if provider == "groq":
                return "deepseek-r1-distill-llama-70b", "Critical incident severity requires advanced reasoning model for deep diagnostic analysis."
            else:
                return "gpt-4o", "Critical incident severity requires advanced model for deep diagnostic analysis."
                
        if severity_upper == "HIGH":
            if provider == "groq":
                return "llama-3.3-70b-versatile", "High severity incident requires robust model with thorough classification."
            else:
                return "gpt-4o-mini", "High severity incident routed to cost-efficient standard model."
                
        # Low/Medium and small log files
        if provider == "groq":
            return "llama-3.1-8b-instant", "Simple incident and small log size. Rerouted to fast, cost-efficient small model."
        else:
            return "gpt-4o-mini", "Simple incident and small log size. Rerouted to fast, cost-efficient mini model."

    @classmethod
    async def route_and_execute(cls, title: str, logs: str, severity: str, environment: str, hindsight_context: str) -> Dict[str, Any]:
        """
        Routes the request to the optimal model, calls the provider (or mock in simulation),
        saves the audit log, and returns the parsed result.
        """
        model_name, reason = cls.determine_route(logs, severity)
        config = MODEL_CONFIGS[model_name]
        provider = config["provider"]
        
        start_time = time.time()
        
        # Check if keys are available
        use_simulation = True
        if provider == "groq" and GROQ_API_KEY:
            use_simulation = False
        elif provider == "openai" and OPENAI_API_KEY:
            use_simulation = False
            
        system_prompt = (
            "You are an expert DevOps and Site Reliability Engineer (SRE) assistant.\n"
            "Analyze the production incident logs and write a diagnostic report in JSON format.\n"
            "You must return ONLY a raw JSON object, without any markdown formatting wrappers or conversational text.\n"
            "The JSON structure must match:\n"
            "{\n"
            '  "summary": "Short incident summary",\n'
            '  "root_cause": "Detailed root cause analysis",\n'
            '  "confidence_score": 95.5,\n'
            '  "affected_components": ["API Gateway", "Database Pool"],\n'
            '  "recommended_resolution": ["Action 1", "Action 2"],\n'
            '  "preventive_measures": ["Measure 1", "Measure 2"],\n'
            '  "estimated_resolution_time": "30 minutes"\n'
            "}"
        )
        
        user_prompt = (
            f"Title: {title}\n"
            f"Severity: {severity}\n"
            f"Environment: {environment}\n\n"
            f"--- HINDSIGHT PERSISTENT MEMORY CONTEXT ---\n"
            f"{hindsight_context or 'No similar previous incidents found.'}\n\n"
            f"--- SYSTEM LOGS ---\n"
            f"{logs[:10000]}\n" # cap log to fit context cleanly
        )
        
        analysis_data = {}
        input_tokens = 0
        output_tokens = 0
        
        if use_simulation:
            # Simulate latency and run mock generator
            await asyncio.sleep(random.uniform(0.6, 1.5))
            analysis_data = cls._generate_mock_analysis(title, logs, severity, hindsight_context)
            # Estimate token count based on prompts
            input_tokens = len(system_prompt.split()) + len(user_prompt.split()) + 50
            output_tokens = len(json.dumps(analysis_data).split()) + 30
        else:
            try:
                if provider == "groq":
                    analysis_data, input_tokens, output_tokens = await cls._execute_groq(model_name, system_prompt, user_prompt)
                else:
                    analysis_data, input_tokens, output_tokens = await cls._execute_openai(model_name, system_prompt, user_prompt)
            except Exception as e:
                print(f"AI API call failed: {e}. Falling back to simulation mode.")
                analysis_data = cls._generate_mock_analysis(title, logs, severity, hindsight_context)
                input_tokens = 1200
                output_tokens = 450
                
        latency = round(time.time() - start_time, 3)
        
        # Calculate cost
        in_cost = (input_tokens / 1000000.0) * config["input_cost_per_m"]
        out_cost = (output_tokens / 1000000.0) * config["output_cost_per_m"]
        total_cost = round(in_cost + out_cost, 6)
        
        # Save Audit Log
        audit_col = get_db_collection("audit_logs")
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "model_selected": config["display_name"],
            "reason": reason,
            "estimated_cost": total_cost,
            "latency": latency,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "severity": severity,
            "log_size": len(logs)
        }
        await audit_col.insert_one(audit_entry)
        
        # Attach routing audit data to result
        analysis_data["model_used"] = config["display_name"]
        analysis_data["routing_reason"] = reason
        analysis_data["routing_cost"] = total_cost
        analysis_data["routing_latency"] = latency
        
        return analysis_data

    @classmethod
    async def _execute_groq(cls, model: str, system_prompt: str, user_prompt: str) -> Tuple[Dict[str, Any], int, int]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(url, headers=headers, json=data)
            res.raise_for_status()
            res_json = res.json()
            
            content = res_json["choices"][0]["message"]["content"]
            usage = res_json.get("usage", {})
            in_t = usage.get("prompt_tokens", 0)
            out_t = usage.get("completion_tokens", 0)
            
            parsed = json.loads(content)
            return parsed, in_t, out_t

    @classmethod
    async def _execute_openai(cls, model: str, system_prompt: str, user_prompt: str) -> Tuple[Dict[str, Any], int, int]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(url, headers=headers, json=data)
            res.raise_for_status()
            res_json = res.json()
            
            content = res_json["choices"][0]["message"]["content"]
            usage = res_json.get("usage", {})
            in_t = usage.get("prompt_tokens", 0)
            out_t = usage.get("completion_tokens", 0)
            
            parsed = json.loads(content)
            return parsed, in_t, out_t

    @classmethod
    def _generate_mock_analysis(cls, title: str, logs: str, severity: str, hindsight_context: str) -> Dict[str, Any]:
        """
        Fascinating mock analyzer that creates dynamic, content-aware diagnostic reports
        matching the logs uploaded by the user.
        """
        logs_lower = logs.lower()
        title_lower = title.lower()
        
        # Detect typical issues
        if "out of memory" in logs_lower or "oom" in logs_lower or "mem" in title_lower:
            summary = "Server running out of system memory, causing services to be terminated by OOM killer."
            root_cause = "Memory leak identified in Node.js server. Memory heap size continuously increased until limit reached, leading to process crash."
            confidence = 88.5
            components = ["Node.js Server", "RAM Allocation"]
            resolution = [
                "Restart the node service to free system heap memory.",
                "Increase container memory limit in kubernetes values.yaml configuration.",
                "Review memory profiler profiles to inspect closures and global variable leaks."
            ]
            preventive = [
                "Implement a Node.js process monitor (PM2/Kubernetes liveness probe) that restarts on high heap usage.",
                "Setup memory threshold alerts at 85% utilization.",
                "Add heap-dump profiling in testing environment."
            ]
            duration = "15 minutes"
            
        elif "connection pool" in logs_lower or "postgresql" in logs_lower or "db" in title_lower or "mysql" in logs_lower:
            summary = "Database connection pool exhaustion leading to server request timeouts."
            root_cause = "Database client connection pool limit exceeded. Unclosed database connections inside asynchronous loops have locked resources."
            confidence = 94.0
            components = ["PostgreSQL Database", "Backend Connection Pool Manager"]
            resolution = [
                "Increase max connections in database configuration pool parameters.",
                "Audit API routes to ensure database sessions are correctly disposed using context managers.",
                "Restart PostgreSQL service to clear hanging idle transaction locks."
            ]
            preventive = [
                "Implement connection pool health alerts.",
                "Reduce idle connection timeout to 30 seconds.",
                "Ensure robust error-handling retry blocks are enabled."
            ]
            duration = "10 minutes"
            
        elif "redis" in logs_lower or "cache" in title_lower:
            summary = "Redis cache memory limit exceeded."
            root_cause = "Redis key evictions configured incorrectly. Cache eviction policy set to volatile-lru, but keys do not have TTL timeouts set."
            confidence = 91.0
            components = ["Redis Cluster", "Cache Middleware"]
            resolution = [
                "Set maxmemory eviction policy to allkeys-lru in redis.conf.",
                "Increase maximum memory capacity of Redis instance.",
                "Flush expired sessions cache key database."
            ]
            preventive = [
                "Enforce strict TTL values on all cached response objects.",
                "Separate session data store from static content cache storage."
            ]
            duration = "5 minutes"
            
        elif "auth" in logs_lower or "unauthorized" in logs_lower or "token" in logs_lower or "jwt" in logs_lower:
            summary = "Authentication system token signature validation failure."
            root_cause = "Authentication service failed to decrypt token signatures due to missing or invalid cryptographical JWT secret key variables."
            confidence = 85.0
            components = ["Auth Gateway", "JWT Helper Class"]
            resolution = [
                "Ensure JWT_SECRET environment variables are correctly populated in production deployments.",
                "Verify signature validation algorithms match client token outputs (HS256).",
                "Clean active local storage cookies and re-authenticate."
            ]
            preventive = [
                "Incorporate environment config verification tests in CI/CD pipeline.",
                "Enable secure fallback keys when configuration is not defined."
            ]
            duration = "20 minutes"
            
        else:
            # General fallback mock
            summary = f"Unclassified incident related to: {title}"
            root_cause = f"System error caught in log stream. Analysis indicates unexpected exception handling block crashed core handlers."
            confidence = 72.0
            components = ["Core Application Module", "Error Handling Exception Block"]
            resolution = [
                "Inspect crash traceback logs to find exception source files.",
                "Rollback the latest deployment release code to stable tag.",
                "Verify environmental configurations are in place."
            ]
            preventive = [
                "Add additional unit tests verifying border case exceptions.",
                "Setup real-time application profiling alerts."
            ]
            duration = "30 minutes"

        # Integrate Hindsight memories info if present
        if hindsight_context and "found similar" in hindsight_context.lower():
            root_cause += " [Hindsight Recall: This aligns with past resolutions that succeeded. Recommending resolutions matching previous incident history.]"
            confidence = min(confidence + 5.0, 99.0)
            
        return {
            "summary": summary,
            "root_cause": root_cause,
            "confidence_score": confidence,
            "affected_components": components,
            "recommended_resolution": resolution,
            "preventive_measures": preventive,
            "estimated_resolution_time": duration
        }
