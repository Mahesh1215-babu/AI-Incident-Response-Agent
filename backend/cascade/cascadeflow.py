import os
import json
from typing import Dict, Any
from dotenv import load_dotenv

from cascadeflow import CascadeAgent, ModelConfig
from cascadeflow.telemetry import (
    BudgetConfig, CostTracker, EnforcementCallbacks, EnforcementContext,
    EnforcementAction, graceful_degradation
)

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

# Initialize tracker globally for the session
global_tracker = CostTracker(user_budgets={"default": BudgetConfig(daily=10.0)})
global_callbacks = EnforcementCallbacks(verbose=True)
global_callbacks.register(graceful_degradation)


class CascadeflowRouter:
    @classmethod
    def _run_simulation_mode(cls, title: str, logs: str, severity: str, environment: str, hindsight_context: str) -> Dict[str, Any]:
        """Fallback when no API keys are provided."""
        return {
            "summary": "SIMULATION MODE: Database connection pool exhaustion detected.",
            "root_cause": "Max connections reached due to unclosed sessions.",
            "confidence_score": 0.95,
            "affected_components": ["Database", "API Gateway"],
            "recommended_resolution": ["Increase max_connections", "Patch connection leak in service"],
            "preventive_measures": ["Add connection pool monitoring"],
            "estimated_resolution_time": "15m",
            "model_used": "simulation-fallback",
            "routing_reason": "No API keys provided.",
            "routing_cost": 0.0,
            "routing_latency": 0.1,
            "cascaded": False,
            "draft_accepted": False,
            "complexity": "low"
        }

    @classmethod
    async def route_and_execute(cls, title: str, logs: str, severity: str, environment: str, hindsight_context: str, contains_pii: bool = False, current_user_id: str = "default_user") -> Dict[str, Any]:
        has_groq = bool(GROQ_API_KEY)
        has_openai = bool(OPENAI_API_KEY)

        if not has_groq and not has_openai:
            return cls._run_simulation_mode(title, logs, severity, environment, hindsight_context)

        char_count = len(logs)
        severity_upper = severity.upper()

        models = []

        # Base Model Configs
        groq_cheap = ModelConfig(name="llama-3.1-8b-instant", provider="groq", cost=0.00005, quality_threshold=0.7)
        groq_expensive = ModelConfig(name="llama-3.3-70b-versatile", provider="groq",
                                     cost=0.00059, quality_threshold=0.95)
        openai_cheap = ModelConfig(name="gpt-4o-mini", provider="openai", cost=0.00015, quality_threshold=0.75)
        openai_expensive = ModelConfig(name="gpt-4o", provider="openai", cost=0.0025, quality_threshold=0.98)

        # Check compliance
        if contains_pii:
            # Compliance Gating: Force routing to strict allow-listed models only
            # e.g., dropping cheap tiers to ensure safer handling
            if has_groq:
                models.append(groq_expensive)
            elif has_openai:
                models.append(openai_expensive)
            routing_reason = "Compliance Gating (PII detected): Forced verifier tier model."
        else:
            # Standard Severity/Size Routing
            is_large = char_count > 15000
            is_critical = severity_upper == "CRITICAL"
            is_high = severity_upper == "HIGH"

            # Check budget
            current_cost = global_tracker.get_cost(current_user_id)
            budget_limit = 10.0
            pct_used = current_cost / budget_limit if budget_limit else 0.0
            action = global_callbacks.check(EnforcementContext(
                user_id=current_user_id, user_tier="default",
                current_cost=current_cost, budget_limit=budget_limit,
                budget_used_pct=pct_used, budget_exceeded=(pct_used >= 1.0)
            ))

            force_cheap = action in (EnforcementAction.WARN, EnforcementAction.BLOCK)

            if is_critical or is_large:
                if force_cheap:
                    models = [groq_cheap] if has_groq else [openai_cheap]
                    routing_reason = "Budget limit strict: Forced cheap tier despite high severity."
                else:
                    models = [groq_expensive] if has_groq else [openai_expensive]
                    routing_reason = f"{'Large log size' if is_large else 'Critical severity'}: Forced verifier tier model."
            elif is_high:
                if has_groq:
                    groq_cheap.quality_threshold = 0.90  # high threshold means likely to escalate
                    models = [groq_cheap, groq_expensive]
                else:
                    openai_cheap.quality_threshold = 0.90
                    models = [openai_cheap, openai_expensive]
                routing_reason = "High severity: Cascade agent with high draft threshold."
            else:
                if has_groq:
                    groq_cheap.quality_threshold = 0.60  # Accept cheap draft easily
                    models = [groq_cheap, groq_expensive]
                else:
                    openai_cheap.quality_threshold = 0.60
                    models = [openai_cheap, openai_expensive]
                routing_reason = "Low/Medium severity: Cascade agent with low draft threshold."

        agent = CascadeAgent(models=models)

        system_prompt = (
            "You are an expert DevOps and Site Reliability Engineer (SRE) assistant.\n"
            "Analyze the production incident logs and write a diagnostic report in JSON format.\n"
            "You must return ONLY a raw JSON object, without any markdown formatting wrappers or conversational text.\n"
            "Required keys: summary (string), root_cause (string), confidence_score (float 0.0-1.0), "
            "affected_components (list of strings), recommended_resolution (list of strings), "
            "preventive_measures (list of strings), estimated_resolution_time (string, e.g. '30m')."
        )

        incident_prompt = (
            f"Title: {title}\n"
            f"Severity: {severity}\n"
            f"Environment: {environment}\n"
            f"{hindsight_context}\n"
            f"Logs:\n{logs}\n\n"
            f"Return JSON only."
        )

        try:
            # Run the agent
            result = await agent.run(system_prompt + "\n\n" + incident_prompt, max_tokens=1000)

            # Record cost
            global_tracker.add_cost(
                model=result.model_used, provider=models[0].provider,
                tokens=getattr(result, 'total_tokens', 100),
                cost=result.total_cost,
                user_id=current_user_id, user_tier="default"
            )

            # Parse output
            output_text = result.content.strip()
            if output_text.startswith("```json"):
                output_text = output_text[7:]
            if output_text.endswith("```"):
                output_text = output_text[:-3]

            parsed = json.loads(output_text.strip())

            parsed["model_used"] = result.model_used
            parsed["routing_reason"] = routing_reason
            parsed["routing_cost"] = result.total_cost
            parsed["routing_latency"] = getattr(result, 'latency_ms', 0) / 1000.0
            parsed["cascaded"] = getattr(result, 'cascaded', False)
            parsed["draft_accepted"] = getattr(result, 'draft_accepted', False)
            parsed["complexity"] = getattr(result, 'complexity', "unknown")

            return parsed

        except Exception as e:
            print(f"Cascadeflow Agent Error: {e}")
            # Fallback for hackathon resilience
            return cls._run_simulation_mode(title, logs, severity, environment, hindsight_context)
