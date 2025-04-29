import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn.svm import SVR
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from typing import Dict, Any, Tuple, List, Optional, Union

# 模型注册表
model_registry = {
    "linear_regression": {
        "name": "线性回归",
        "description": "基本的线性回归模型，适用于线性关系的数据",
        "parameters": {
            "fit_intercept": {
                "type": "boolean",
                "default": True,
                "description": "是否计算截距"
            }
        }
    },
    "ridge_regression": {
        "name": "岭回归",
        "description": "带L2正则化的线性回归，适用于特征间存在多重共线性的数据",
        "parameters": {
            "alpha": {
                "type": "number",
                "default": 1.0,
                "description": "正则化强度"
            }
        }
    },
    "lasso_regression": {
        "name": "Lasso回归",
        "description": "带L1正则化的线性回归，可以产生稀疏模型",
        "parameters": {
            "alpha": {
                "type": "number",
                "default": 1.0,
                "description": "正则化强度"
            }
        }
    },
    "polynomial_regression": {
        "name": "多项式回归",
        "description": "可以拟合非线性关系的回归模型",
        "parameters": {
            "degree": {
                "type": "integer",
                "default": 2,
                "description": "多项式的次数"
            }
        }
    },
    "svr": {
        "name": "支持向量机回归",
        "description": "基于支持向量机的回归模型，适用于非线性关系",
        "parameters": {
            "kernel": {
                "type": "string",
                "default": "rbf",
                "enum": ["linear", "poly", "rbf", "sigmoid"],
                "description": "核函数类型"
            },
            "C": {
                "type": "number",
                "default": 1.0,
                "description": "正则化参数"
            },
            "epsilon": {
                "type": "number",
                "default": 0.1,
                "description": "不敏感损失函数中的epsilon参数"
            }
        }
    },
    "random_forest": {
        "name": "随机森林回归",
        "description": "基于决策树集成的回归模型，适用于复杂的非线性关系",
        "parameters": {
            "n_estimators": {
                "type": "integer",
                "default": 100,
                "description": "森林中树的数量"
            },
            "max_depth": {
                "type": "integer",
                "default": None,
                "description": "树的最大深度"
            }
        }
    },
    "gradient_boosting": {
        "name": "梯度提升回归",
        "description": "基于梯度提升的回归模型，通常具有很好的预测性能",
        "parameters": {
            "n_estimators": {
                "type": "integer",
                "default": 100,
                "description": "提升阶段的数量"
            },
            "learning_rate": {
                "type": "number",
                "default": 0.1,
                "description": "学习率"
            },
            "max_depth": {
                "type": "integer",
                "default": 3,
                "description": "单个回归估计量的最大深度"
            }
        }
    },
    "mlp": {
        "name": "多层感知机回归",
        "description": "基于神经网络的回归模型，适用于复杂的非线性关系",
        "parameters": {
            "hidden_layer_sizes": {
                "type": "array",
                "default": [100],
                "description": "隐藏层中的神经元数量"
            },
            "activation": {
                "type": "string",
                "default": "relu",
                "enum": ["identity", "logistic", "tanh", "relu"],
                "description": "激活函数"
            },
            "alpha": {
                "type": "number",
                "default": 0.0001,
                "description": "L2正则化参数"
            },
            "learning_rate": {
                "type": "string",
                "default": "constant",
                "enum": ["constant", "invscaling", "adaptive"],
                "description": "学习率调度"
            }
        }
    }
}

# 创建模型实例
def create_model(model_type: str, parameters: Dict[str, Any], input_dim: Optional[int] = None) -> Any:
    """创建指定类型的模型实例"""
    if model_type == "linear_regression":
        return LinearRegression(
            fit_intercept=parameters.get("fit_intercept", True)
        )
    
    elif model_type == "ridge_regression":
        return Ridge(
            alpha=parameters.get("alpha", 1.0)
        )
    
    elif model_type == "lasso_regression":
        return Lasso(
            alpha=parameters.get("alpha", 1.0)
        )
    
    elif model_type == "polynomial_regression":
        return Pipeline([
            ('poly', PolynomialFeatures(degree=parameters.get("degree", 2))),
            ('linear', LinearRegression())
        ])
    
    elif model_type == "svr":
        return SVR(
            kernel=parameters.get("kernel", "rbf"),
            C=parameters.get("C", 1.0),
            epsilon=parameters.get("epsilon", 0.1)
        )
    
    elif model_type == "random_forest":
        return RandomForestRegressor(
            n_estimators=parameters.get("n_estimators", 100),
            max_depth=parameters.get("max_depth", None),
            random_state=42
        )
    
    elif model_type == "gradient_boosting":
        return GradientBoostingRegressor(
            n_estimators=parameters.get("n_estimators", 100),
            learning_rate=parameters.get("learning_rate", 0.1),
            max_depth=parameters.get("max_depth", 3),
            random_state=42
        )
    
    elif model_type == "mlp":
        return MLPRegressor(
            hidden_layer_sizes=tuple(parameters.get("hidden_layer_sizes", [100])),
            activation=parameters.get("activation", "relu"),
            alpha=parameters.get("alpha", 0.0001),
            learning_rate=parameters.get("learning_rate", "constant"),
            random_state=42
        )
    
    else:
        raise ValueError(f"不支持的模型类型: {model_type}")

# 训练模型
def train_model(
    model_type: str,
    X: np.ndarray,
    y: np.ndarray,
    parameters: Dict[str, Any],
    test_size: float = 0.2
) -> Tuple[Any, Dict[str, Any]]:
    """训练模型并返回训练结果"""
    # 划分训练集和测试集
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
    
    # 创建模型
    model = create_model(model_type, parameters, input_dim=X.shape[1])
    
    # 训练模型
    model.fit(X_train, y_train)
    
    # 预测
    y_pred = model.predict(X_test)
    
    # 计算评估指标
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    # 返回模型和训练结果
    return model, {
        "metrics": {
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae),
            "r2": float(r2)
        },
        "predictions": y_pred,
        "actual": y_test
    }

# 评估模型
def evaluate_model(model: Any, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
    """评估模型性能"""
    # 预测
    y_pred = model.predict(X)
    
    # 计算评估指标
    mse = mean_squared_error(y, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y, y_pred)
    r2 = r2_score(y, y_pred)
    
    return {
        "metrics": {
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae),
            "r2": float(r2)
        },
        "predictions": y_pred
    }

# 使用模型进行预测
def predict_with_model(model: Any, X: np.ndarray) -> np.ndarray:
    """使用模型进行预测"""
    return model.predict(X)