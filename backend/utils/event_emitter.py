import os
import time
import uuid
import hmac
import hashlib
import json
import logging
import asyncio
import httpx

logger = logging.getLogger("event_emitter")

# Configuration for Central Backend Connection
CENTRAL_BACKEND_URL = os.getenv("CENTRAL_BACKEND_URL", "http://localhost:8000")
SCHOOL_ID = int(os.getenv("SCHOOL_ID", "1"))
SCHOOL_SECRET_KEY = os.getenv("SCHOOL_SECRET_KEY", "demo-secret-almaty-2026")


async def _send_event_task(event_type: str, metadata: dict = None):
    """
    Sends signed event notification to Central Management Platform.
    Includes HMAC-SHA256 signature for authenticating the school instance.
    """
    try:
        timestamp = str(int(time.time()))
        nonce = str(uuid.uuid4())
        event_id = f"evt_{timestamp}_{nonce[:8]}"

        # Calculate HMAC-SHA256 signature
        data_to_sign = f"{timestamp}.{nonce}.{event_type}".encode()
        signature = hmac.new(
            SCHOOL_SECRET_KEY.encode(),
            data_to_sign,
            hashlib.sha256
        ).hexdigest()

        headers = {
            "Content-Type": "application/json",
            "X-School-ID": str(SCHOOL_ID),
            "X-Timestamp": timestamp,
            "X-Nonce": nonce,
            "X-Signature": signature,
        }

        payload = {
            "school_id": SCHOOL_ID,
            "event_id": event_id,
            "event_type": event_type,
            "timestamp": timestamp,
            "metadata": metadata or {},
        }

        async with httpx.AsyncClient(timeout=5.0) as client:
            endpoint = f"{CENTRAL_BACKEND_URL.rstrip('/')}/api/v1/events"
            resp = await client.post(endpoint, json=payload, headers=headers)
            if resp.status_code in [200, 201, 202]:
                logger.info("Event '%s' sent to Central Management successfully", event_type)
            else:
                logger.warning("Central Management returned status %d for event '%s': %s", resp.status_code, event_type, resp.text)

    except Exception as e:
        logger.warning("Could not dispatch event '%s' to Central Management: %s", event_type, e)


def emit_school_event(event_type: str, metadata: dict = None):
    """
    Non-blocking event emitter function to be called inside API routes / DB save mutators.
    Fires background task without blocking the current HTTP response.
    Supports event types: POINTS_CHANGED, STUDENT_CREATED, TEACHER_UPDATED, CLASS_ADDED, RULE_CHANGED, CONFIG_UPDATED.
    """
    try:
        asyncio.create_task(_send_event_task(event_type, metadata))
    except Exception as e:
        logger.error("Failed to schedule event task: %s", e)


def emit_points_changed(student_id: int, points_delta: int, reason: str = ""):
    emit_school_event("POINTS_CHANGED", {"student_id": student_id, "delta": points_delta, "reason": reason})


def emit_student_created(student_id: int, class_name: str):
    emit_school_event("STUDENT_CREATED", {"student_id": student_id, "class_name": class_name})


def emit_teacher_updated(teacher_id: int):
    emit_school_event("TEACHER_UPDATED", {"teacher_id": teacher_id})


def emit_class_added(class_name: str):
    emit_school_event("CLASS_ADDED", {"class_name": class_name})


def emit_rule_changed(rule_id: int, rule_name: str):
    emit_school_event("RULE_CHANGED", {"rule_id": rule_id, "rule_name": rule_name})


def emit_config_updated(section: str):
    emit_school_event("CONFIG_UPDATED", {"section": section})

