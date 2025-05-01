from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class Variable(BaseModel):
    name: str
    type: str  # "continuous", "integer", "binary"
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

class Constraint(BaseModel):
    name: str
    expression: str
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

class Objective(BaseModel):
    type: str  # "minimize" or "maximize"
    expression: str

class ModelBuildRequest(BaseModel):
    name: str
    description: Optional[str] = None
    variables: List[Variable]
    constraints: List[Constraint]
    objective: Objective
    parameters: Optional[Dict[str, Any]] = None

class ModelRunRequest(BaseModel):
    parameters: Optional[Dict[str, Any]] = None
    solver_config: Optional[Dict[str, Any]] = None 