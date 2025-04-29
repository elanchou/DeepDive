from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DatasetInfo(BaseModel):
    """数据集信息模型"""
    id: str
    filename: str
    original_filename: str
    description: Optional[str] = None
    upload_time: str
    rows: int
    columns: List[str]
    file_path: str

class ModelInfo(BaseModel):
    """模型信息模型"""
    id: str
    name: str
    description: Optional[str] = None
    model_type: str
    dataset_id: str
    feature_columns: List[str]
    target_column: str
    parameters: Dict[str, Any]
    training_time: str
    metrics: Dict[str, float]
    feature_importance: Optional[Dict[str, float]] = None
    model_path: str

class TrainingRequest(BaseModel):
    """模型训练请求模型"""
    dataset_id: str
    model_type: str
    feature_columns: List[str]
    target_column: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    test_size: float = 0.2
    name: Optional[str] = None
    description: Optional[str] = None

class PredictionRequest(BaseModel):
    """预测请求模型"""
    features: List[float]

class EvaluationResult(BaseModel):
    """模型评估结果模型"""
    id: str
    model_id: str
    dataset_id: str
    timestamp: str
    metrics: Dict[str, float]
    predictions: List[float]
    actual: List[float]