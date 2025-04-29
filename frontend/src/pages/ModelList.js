import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  List, 
  Card, 
  Button, 
  Tag, 
  Spin, 
  Empty,
  message,
  Tooltip
} from 'antd';
import { 
  ExperimentOutlined, 
  EyeOutlined, 
  LineChartOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { modelApi } from '../services/api';

const { Title, Paragraph } = Typography;

const ModelList = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 获取模型列表
  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await modelApi.getAllModels();
      setModels(response.data);
    } catch (error) {
      console.error('获取模型列表失败:', error);
      message.error('获取模型列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchModels();
  }, []);
  
  // 获取模型类型的中文名称
  const getModelTypeName = (modelType) => {
    const modelTypeMap = {
      'linear_regression': '线性回归',
      'ridge_regression': '岭回归',
      'lasso_regression': 'Lasso回归',
      'polynomial_regression': '多项式回归',
      'svr': '支持向量机回归',
      'random_forest': '随机森林回归',
      'gradient_boosting': '梯度提升回归',
      'mlp': '多层感知机回归',
      'tensorflow_dnn': 'TensorFlow深度神经网络',
      'pytorch_dnn': 'PyTorch深度神经网络'
    };
    
    return modelTypeMap[modelType] || modelType;
  };
  
  // 获取模型性能的标签颜色
  const getR2Color = (r2) => {
    if (r2 >= 0.9) return 'green';
    if (r2 >= 0.7) return 'blue';
    if (r2 >= 0.5) return 'orange';
    return 'red';
  };
  
  return (
    <div>
      <Typography className="page-header">
        <Title level={2}>模型管理</Title>
        <Paragraph>
          在这里您可以查看所有已训练的模型，或者训练新的模型。
        </Paragraph>
      </Typography>
      
      <Button 
        type="primary" 
        icon={<ExperimentOutlined />} 
        style={{ marginBottom: 16 }}
      >
        <Link to="/train">训练新模型</Link>
      </Button>
      
      {loading ? (
        <div style={{ textAlign: 'center', margin: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : models.length === 0 ? (
        <Empty description="暂无模型，请训练新的模型" />
      ) : (
        <List
          grid={{ gutter: 16, column: 3 }}
          dataSource={models}
          renderItem={(model) => (
            <List.Item>
              <Card 
                className="model-card"
                title={model.name}
                extra={
                  <Link to={`/models/${model.id}`}>
                    <Button type="link" icon={<EyeOutlined />}>查看</Button>
                  </Link>
                }
              >
                <p>
                  <ExperimentOutlined style={{ marginRight: 8 }} />
                  类型: {getModelTypeName(model.model_type)}
                </p>
                <p>
                  <DatabaseOutlined style={{ marginRight: 8 }} />
                  数据集: {model.dataset_id.substring(0, 8)}...
                </p>
                <p>
                  训练时间: {model.training_time}
                </p>
                <p>
                  性能指标: 
                  <Tooltip title={`MSE: ${model.metrics.mse.toFixed(4)}, RMSE: ${model.metrics.rmse.toFixed(4)}`}>
                    <Tag color={getR2Color(model.metrics.r2)} style={{ marginLeft: 8 }}>
                      R² = {model.metrics.r2.toFixed(4)}
                    </Tag>
                  </Tooltip>
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="primary" style={{ flex: 1 }}>
                    <Link to={`/models/${model.id}`}>查看详情</Link>
                  </Button>
                  <Button type="default" icon={<LineChartOutlined />} style={{ flex: 1 }}>
                    <Link to={`/predict?model=${model.id}`}>使用预测</Link>
                  </Button>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default ModelList;