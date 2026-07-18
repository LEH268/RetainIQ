from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data_processing.dataset_loader import get_customers

router = APIRouter()


class NewTask(BaseModel):
    customerId: Optional[str] = None
    task: Optional[str] = None


def _seed_tasks():
    customers = get_customers()
    high_risk = [c for c in customers if c["risk_level"] == "High Risk"][:5]
    due_options = ["Today", "Tomorrow", "This Week"]

    return [
        {
            "id": i + 1,
            "task": c["recommendation"]["action"],
            "customer": c["name"],
            "due": due_options[i % len(due_options)],
            "status": "Pending",
        }
        for i, c in enumerate(high_risk)
    ]


_tasks = _seed_tasks()


@router.get("/tasks")
def tasks():
    return _tasks


@router.post("/tasks")
def create_task(payload: NewTask):
    customers = get_customers()
    customer_name = "Unknown Customer"

    if payload.customerId:
        match = next((c for c in customers if c["id"] == str(payload.customerId)), None)
        if match:
            customer_name = match["name"]

    new_task = {
        "id": max((t["id"] for t in _tasks), default=0) + 1,
        "task": payload.task or "Follow up with customer",
        "customer": customer_name,
        "due": "Today",
        "status": "Pending",
    }
    _tasks.append(new_task)
    return new_task


@router.put("/tasks/{task_id}/toggle")
def toggle_task(task_id: int):
    for t in _tasks:
        if t["id"] == task_id:
            t["status"] = "Completed" if t["status"] == "Pending" else "Pending"
            return t
    raise HTTPException(status_code=404, detail="Task not found")