from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import os
import json
import joblib
from datetime import datetime
import uuid
import shutil
from pydantic import BaseModel

# 导入模型相关模块
from .simple_models import model_registry, train_model, evaluate_model, predict_with_model
from .schemas import (
    DatasetInfo,
    ModelInfo,
    TrainingRequest,
    PredictionRequest,
    EvaluationResult
)

app = FastAPI(title="多维数据拟合与预测系统")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 确保数据目录存在
os.makedirs("data/datasets", exist_ok=True)
os.makedirs("data/models", exist_ok=True)
os.makedirs("data/results", exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "欢迎使用多维数据拟合与预测系统"}

@app.post("/datasets/upload", response_model=DatasetInfo)
async def upload_dataset(
    file: UploadFile = File(...),
    description: str = Form(None)
):
    """上传数据集"""
    try:
        # 生成唯一ID
        dataset_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # 保存原始文件
        filename = f"{timestamp}_{file.filename}"
        file_path = f"data/datasets/{filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 读取数据并验证
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_path)
        else:
            raise HTTPException(status_code=400, detail="不支持的文件格式，请上传CSV或Excel文件")

        # 基本数据验证
        if df.empty:
            raise HTTPException(status_code=400, detail="上传的数据集为空")

        # 保存数据集信息
        dataset_info = {
            "id": dataset_id,
            "filename": filename,
            "original_filename": file.filename,
            "description": description,
            "upload_time": timestamp,
            "rows": len(df),
            "columns": list(df.columns),
            "file_path": file_path
        }

        with open(f"data/datasets/{dataset_id}.json", "w") as f:
            json.dump(dataset_info, f)

        return dataset_info

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上传数据集失败: {str(e)}")

@app.get("/datasets", response_model=List[DatasetInfo])
def list_datasets():
    """获取所有数据集列表"""
    datasets = []
    try:
        for filename in os.listdir("data/datasets"):
            if filename.endswith(".json"):
                with open(f"data/datasets/{filename}", "r") as f:
                    dataset_info = json.load(f)
                    datasets.append(dataset_info)
        return datasets
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据集列表失败: {str(e)}")

@app.get("/datasets/{dataset_id}", response_model=Dict[str, Any])
def get_dataset_details(dataset_id: str):
    """获取数据集详情和预览"""
    try:
        # 读取数据集信息
        with open(f"data/datasets/{dataset_id}.json", "r") as f:
            dataset_info = json.load(f)

        # 读取数据集预览
        file_path = dataset_info["file_path"]
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_path)

        # 计算基本统计信息
        stats = {}
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                stats[col] = {
                    "min": float(df[col].min()),
                    "max": float(df[col].max()),
                    "mean": float(df[col].mean()),
                    "std": float(df[col].std())
                }

        return {
            "info": dataset_info,
            "preview": df.head(10).to_dict(orient="records"),
            "stats": stats
        }

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"数据集 {dataset_id} 不存在")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据集详情失败: {str(e)}")

@app.get("/models/available", response_model=List[Dict[str, Any]])
def list_available_models():
    """获取所有可用的模型类型"""
    result = []
    for model_id, model_info in model_registry.items():
        result.append({
                "id": model_id,
            "name": model_info["name"],
            "description": model_info["description"],
            "parameters": model_info["parameters"]
        })
    return result

@app.post("/models/train", response_model=ModelInfo)
def train_new_model(request: TrainingRequest):
    """训练新模型"""
    try:
        print(f"收到训练请求: {request}")

        # 读取数据集信息
        try:
            with open(f"data/datasets/{request.dataset_id}.json", "r") as f:
                dataset_info = json.load(f)
            print(f"成功读取数据集信息: {dataset_info['filename']}")
        except FileNotFoundError:
            error_msg = f"数据集 {request.dataset_id} 不存在"
            print(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        except Exception as e:
            error_msg = f"读取数据集信息失败: {str(e)}"
            print(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        # 读取数据集
        try:
            file_path = dataset_info["file_path"]
            print(f"尝试读取数据集文件: {file_path}")

            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file_path)
            else:
                error_msg = f"不支持的文件格式: {file_path}"
                print(error_msg)
                raise HTTPException(status_code=400, detail=error_msg)

            print(f"成功读取数据集，形状: {df.shape}")
        except Exception as e:
            error_msg = f"读取数据集文件失败: {str(e)}"
            print(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        # 检查特征列和目标列是否存在
        missing_features = [col for col in request.feature_columns if col not in df.columns]
        if missing_features:
            error_msg = f"数据集中缺少以下特征列: {missing_features}"
            print(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)

        if request.target_column not in df.columns:
            error_msg = f"数据集中缺少目标列: {request.target_column}"
            print(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)

        # 准备训练数据
        try:
            # 确保所有特征列和目标列都是数值类型
            for col in request.feature_columns + [request.target_column]:
                if not pd.api.types.is_numeric_dtype(df[col]):
                    print(f"列 {col} 不是数值类型，尝试转换...")
                    try:
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                        # 检查转换后是否有NaN值
                        nan_count = df[col].isna().sum()
                        if nan_count > 0:
                            print(f"警告: 列 {col} 转换为数值类型后有 {nan_count} 个NaN值")
                            # 用均值填充NaN
                            df[col] = df[col].fillna(df[col].mean())
                    except Exception as e:
                        error_msg = f"无法将列 {col} 转换为数值类型: {str(e)}"
                        print(error_msg)
                        raise HTTPException(status_code=400, detail=error_msg)

            X = df[request.feature_columns].values
            y = df[request.target_column].values
            print(f"准备训练数据 - X形状: {X.shape}, y形状: {y.shape}")
            print(f"X数据类型: {X.dtype}, y数据类型: {y.dtype}")

            # 打印每个特征列的前几个值，用于调试
            print("特征列样本值:")
            for i, col in enumerate(request.feature_columns):
                print(f"  {col}: {df[col].head(3).values}")

            print(f"目标列样本值: {df[request.target_column].head(3).values}")

        except Exception as e:
            error_msg = f"准备训练数据失败: {str(e)}"
            print(error_msg)
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=error_msg)

        # 训练模型
        try:
            model_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            print(f"开始训练模型 {request.model_type}，参数: {request.parameters}")
            model, training_result = train_model(
                model_type=request.model_type,
                X=X,
                y=y,
                parameters=request.parameters,
                test_size=request.test_size,
                feature_names=request.feature_columns
            )
            print(f"模型训练完成，评估指标: {training_result['metrics']}")
        except Exception as e:
            error_msg = f"训练模型失败: {str(e)}"
            print(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        # 保存模型
        try:
            model_path = f"data/models/{model_id}.joblib"
            joblib.dump(model, model_path)
            print(f"模型保存到: {model_path}")
        except Exception as e:
            error_msg = f"保存模型失败: {str(e)}"
            print(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        # 保存模型信息
        try:
            model_info = {
                "id": model_id,
                "name": request.name or f"Model_{timestamp}",
                "description": request.description,
                "model_type": request.model_type,
                "dataset_id": request.dataset_id,
                "feature_columns": request.feature_columns,
                "target_column": request.target_column,
                "parameters": request.parameters,
                "training_time": timestamp,
                "metrics": training_result["metrics"],
                "feature_importance": training_result.get("feature_importance", {}),
                "model_path": model_path
            }

            with open(f"data/models/{model_id}.json", "w") as f:
                json.dump(model_info, f)
            print(f"模型信息保存到: data/models/{model_id}.json")

            return model_info
        except Exception as e:
            error_msg = f"保存模型信息失败: {str(e)}"
            print(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        error_msg = f"训练模型过程中发生未知错误: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/models", response_model=List[ModelInfo])
def list_models():
    """获取所有已训练的模型列表"""
    models = []
    try:
        for filename in os.listdir("data/models"):
            if filename.endswith(".json"):
                with open(f"data/models/{filename}", "r") as f:
                    model_info = json.load(f)
                    models.append(model_info)
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模型列表失败: {str(e)}")

@app.get("/models/{model_id}", response_model=ModelInfo)
def get_model_details(model_id: str):
    """获取模型详情"""
    try:
        with open(f"data/models/{model_id}.json", "r") as f:
            model_info = json.load(f)
        return model_info
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模型详情失败: {str(e)}")

@app.post("/models/{model_id}/evaluate", response_model=EvaluationResult)
def evaluate_model_endpoint(model_id: str, dataset_id: Optional[str] = None):
    """评估模型在特定数据集上的表现"""
    try:
        # 读取模型信息
        with open(f"data/models/{model_id}.json", "r") as f:
            model_info = json.load(f)

        # 加载模型
        model = joblib.load(model_info["model_path"])

        # 确定使用哪个数据集
        eval_dataset_id = dataset_id or model_info["dataset_id"]

        # 读取数据集信息
        with open(f"data/datasets/{eval_dataset_id}.json", "r") as f:
            dataset_info = json.load(f)

        # 读取数据集
        file_path = dataset_info["file_path"]
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_path)

        # 准备评估数据
        X = df[model_info["feature_columns"]].values
        y = df[model_info["target_column"]].values

        # 评估模型
        evaluation_result = evaluate_model(model, X, y)

        # 保存评估结果
        result_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        result_info = {
            "id": result_id,
            "model_id": model_id,
            "dataset_id": eval_dataset_id,
            "timestamp": timestamp,
            "metrics": evaluation_result["metrics"],
            "predictions": evaluation_result["predictions"].tolist(),
            "actual": y.tolist()
        }

        with open(f"data/results/{result_id}.json", "w") as f:
            json.dump(result_info, f)

        return result_info

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"评估模型失败: {str(e)}")

@app.post("/models/{model_id}/predict")
def predict_with_model_endpoint(model_id: str, request: PredictionRequest):
    """使用模型进行预测"""
    try:
        # 读取模型信息
        with open(f"data/models/{model_id}.json", "r") as f:
            model_info = json.load(f)

        # 加载模型
        model = joblib.load(model_info["model_path"])

        # 准备输入数据
        input_data = np.array([request.features])

        # 进行预测
        prediction = predict_with_model(model, input_data)

        return {"prediction": float(prediction[0])}

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"预测失败: {str(e)}")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
