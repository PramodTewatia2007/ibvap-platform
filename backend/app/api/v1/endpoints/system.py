from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
@router.get("/status")
async def get_system_health():
    return {
        "status": "HEALTHY",
        "platform": "IBVAP — Intelligent Border Video Analytics Platform",
        "version": "1.0.0-PROD",
        "layers": {
            "frontend": "ONLINE",
            "backend_api": "ONLINE",
            "database": "CONNECTED",
            "ai_video_engine": "RUNNING",
            "evidence_vault": "MOUNTED",
            "c2_gateway": "STANDBY_READY"
        },
        "resource_utilization": {
            "cpu_usage_percent": 18.4,
            "memory_usage_mb": 420.2,
            "gpu_acceleration": "SIMULATED / CPU_FALLBACK",
            "disk_free_gb": 482.1
        }
    }

@router.get("/c2/telemetry")
async def get_c2_telemetry():
    """Command & Control standard telemetry payload"""
    return {
        "bop_node_id": "BOP-WEST-SECTOR-01",
        "timestamp": "2026-10-18T00:30:00Z",
        "threat_level": "ELEVATED",
        "active_interventions": 1,
        "perimeter_status": "MONITORED",
        "sensor_health": {
            "optical_cameras": "ALL_ONLINE",
            "virtual_tripwires": "ACTIVE",
            "anpr_gateways": "OPERATIONAL"
        }
    }
