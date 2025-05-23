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
        # 确保hidden_layer_sizes是整数元组
        hidden_layer_sizes = parameters.get("hidden_layer_sizes", [100])
        print(f"原始hidden_layer_sizes: {hidden_layer_sizes}, 类型: {type(hidden_layer_sizes)}")
        
        # 转换为整数列表
        try:
            # 如果是单个字符串，尝试转换为整数
            if isinstance(hidden_layer_sizes, str):
                hidden_layer_sizes = [int(hidden_layer_sizes)]
            # 如果是列表，确保所有元素都是整数
            elif isinstance(hidden_layer_sizes, list):
                int_layers = []
                for item in hidden_layer_sizes:
                    if isinstance(item, str):
                        int_layers.append(int(item))
                    elif isinstance(item, (int, float)):
                        int_layers.append(int(item))
                    else:
                        raise ValueError(f"无法处理的hidden_layer_sizes元素类型: {type(item)}")
                hidden_layer_sizes = int_layers
            # 如果是整数或浮点数，转换为单元素列表
            elif isinstance(hidden_layer_sizes, (int, float)):
                hidden_layer_sizes = [int(hidden_layer_sizes)]
            else:
                raise ValueError(f"无法处理的hidden_layer_sizes类型: {type(hidden_layer_sizes)}")
        except Exception as e:
            print(f"转换hidden_layer_sizes时出错: {str(e)}")
            print(f"使用默认值 [100]")
            hidden_layer_sizes = [100]
        
        # 确保值合理（防止内存溢出）
        max_neurons = 1000  # 设置一个合理的上限
        for i, size in enumerate(hidden_layer_sizes):
            if size > max_neurons:
                print(f"警告: 隐藏层 {i+1} 的神经元数量 {size} 过大，已限制为 {max_neurons}")
                hidden_layer_sizes[i] = max_neurons
        
        hidden_layer_tuple = tuple(hidden_layer_sizes)
        print(f"最终使用的hidden_layer_sizes: {hidden_layer_tuple}")
        
        return MLPRegressor(
            hidden_layer_sizes=hidden_layer_tuple,
            activation=parameters.get("activation", "relu"),
            alpha=parameters.get("alpha", 0.0001),
            learning_rate=parameters.get("learning_rate", "constant"),
            max_iter=1000,  # 增加最大迭代次数
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
    test_size: float = 0.2,
    feature_names: List[str] = None
) -> Tuple[Any, Dict[str, Any]]:
    """训练模型并返回训练结果"""
    try:
        print(f"开始训练模型: {model_type}")
        print(f"输入特征形状: {X.shape}")
        print(f"目标特征形状: {y.shape}")
        print(f"模型参数: {parameters}")
        
        # 检查输入数据
        if X.shape[0] == 0 or y.shape[0] == 0:
            raise ValueError("输入数据为空")
        
        if np.isnan(X).any() or np.isnan(y).any():
            print("警告: 输入数据包含NaN值，将尝试处理")
            # 简单处理：用列均值填充NaN
            col_mean = np.nanmean(X, axis=0)
            inds = np.where(np.isnan(X))
            X[inds] = np.take(col_mean, inds[1])
            
            # 处理目标变量中的NaN
            if np.isnan(y).any():
                y_mean = np.nanmean(y)
                y = np.nan_to_num(y, nan=y_mean)
        
        # 划分训练集和测试集
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
        print(f"训练集大小: {X_train.shape}, 测试集大小: {X_test.shape}")
        
        # 创建模型
        model = create_model(model_type, parameters, input_dim=X.shape[1])
        print(f"模型创建成功: {type(model).__name__}")
        
        # 训练模型
        print("开始拟合模型...")
        model.fit(X_train, y_train)
        print("模型拟合完成")
        
        # 预测
        print("生成测试集预测...")
        y_pred = model.predict(X_test)
        print(f"预测完成，预测结果形状: {y_pred.shape}")
        
        # 计算评估指标
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"模型评估指标 - MSE: {mse}, RMSE: {rmse}, MAE: {mae}, R²: {r2}")
        
        # 提取特征重要性/系数信息
        feature_importance = {}
        if model_type in ["linear_regression", "ridge_regression", "lasso_regression"]:
            # 线性模型直接提取系数
            coefficients = model.coef_
            intercept = model.intercept_
            
            # 如果提供了特征名称，使用特征名称作为键
            if feature_names and len(feature_names) == len(coefficients):
                for i, name in enumerate(feature_names):
                    feature_importance[name] = float(coefficients[i])
            else:
                # 否则使用特征索引
                for i, coef in enumerate(coefficients):
                    feature_importance[f"特征{i+1}"] = float(coef)
            
            # 添加截距
            feature_importance["截距(Intercept)"] = float(intercept)
            
            print("特征系数:")
            for name, coef in feature_importance.items():
                print(f"  {name}: {coef}")
        
        elif model_type == "polynomial_regression":
            # 多项式回归需要从Pipeline中提取线性模型
            linear_model = model.named_steps['linear']
            coefficients = linear_model.coef_
            intercept = linear_model.intercept_
            
            # 多项式特征的名称比较复杂，这里简化处理
            for i, coef in enumerate(coefficients):
                feature_importance[f"多项式特征{i+1}"] = float(coef)
            
            feature_importance["截距(Intercept)"] = float(intercept)
        
        elif model_type in ["random_forest", "gradient_boosting"]:
            # 树模型使用feature_importances_
            importances = model.feature_importances_
            
            if feature_names and len(feature_names) == len(importances):
                for i, name in enumerate(feature_names):
                    feature_importance[name] = float(importances[i])
            else:
                for i, imp in enumerate(importances):
                    feature_importance[f"特征{i+1}"] = float(imp)
        
        # 返回模型和训练结果
        return model, {
            "metrics": {
                "mse": float(mse),
                "rmse": float(rmse),
                "mae": float(mae),
                "r2": float(r2)
            },
            "feature_importance": feature_importance,
            "predictions": y_pred,
            "actual": y_test
        }
    except Exception as e:
        print(f"训练模型时发生错误: {str(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"训练模型失败: {str(e)}")

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