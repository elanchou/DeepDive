import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Form, 
  Select, 
  Button, 
  Card, 
  Spin, 
  message, 
  InputNumber,
  Result,
  Descriptions,
  Tag,
  Divider,
  Alert
} from 'antd';
import { 
  LineChartOutlined, 
  ExperimentOutlined, 
  CheckCircleOutlined
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { modelApi } from '../services/api';

const { Title, Paragraph } = Typography;
const { Option } = Select;

// 解析URL查询参数
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const Prediction = () => {
  const query = useQuery();
  const preselectedModelId = query.get('model');
  
  const [form] = Form.useForm();
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  
  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await modelApi.getAllModels();
        setModels(response.data);
        
        // 如果URL中有预选的模型ID，则自动选择
        if (preselectedModelId) {
          form.setFieldsValue({ model_id: preselectedModelId });
          await fetchModelDetails(preselectedModelId);
        }
      } catch (error) {
        console.error('获取模型列表失败:', error);
        message.error('获取模型列表失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModels();
  }, [preselectedModelId, form]);
  
  // 获取模型详情
  const fetchModelDetails = async (modelId) => {
    try {
      const response = await modelApi.getModelById(modelId);
      setSelectedModel(response.data);
      
      // 初始化特征输入表单
      const initialFeatures = {};
      response.data.feature_columns.forEach((feature, index) => {
        initialFeatures[`feature_${index}`] = 0;
      });
      form.setFieldsValue(initialFeatures);
    } catch (error) {
      console.error('获取模型详情失败:', error);
      message.error('获取模型详情失败');
    }
  };
  
  // 处理模型选择变化
  const handleModelChange = async (value) => {
    setPrediction(null);
    await fetchModelDetails(value);
  };
  
  // 进行预测
  const handleSubmit = async (values) => {
    try {
      setPredicting(true);
      
      // 提取特征值
      const features = selectedModel.feature_columns.map((_, index) => values[`feature_${index}`]);
      
      const response = await modelApi.predict(values.model_id, features);
      setPrediction(response.data.prediction);
      message.success('预测完成');
    } catch (error) {
      console.error('预测失败:', error);
      message.error('预测失败');
    } finally {
      setPredicting(false);
    }
  };
  
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
        <Title level={2}>模型预测</Title>
        <Paragraph>
          选择模型并输入特征值，进行预测。
        </Paragraph>
      </Typography>
      
      {loading ? (
        <div style={{ textAlign: 'center', margin: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Card title="选择模型">
            <Form.Item
              name="model_id"
              label="选择模型"
              rules={[{ required: true, message: '请选择模型' }]}
            >
              <Select 
                placeholder="请选择模型" 
                onChange={handleModelChange}
                disabled={predicting}
              >
                {models.map(model => (
                  <Option key={model.id} value={model.id}>
                    {model.name} - {getModelTypeName(model.model_type)} (R² = {model.metrics.r2.toFixed(4)})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>
          
          {selectedModel && (
            <Card title="输入特征值" style={{ marginTop: 16 }}>
              <Alert
                message="模型信息"
                description={
                  <div>
                    <p>模型类型: {getModelTypeName(selectedModel.model_type)}</p>
                    <p>
                      模型性能: 
                      <Tag color={getR2Color(selectedModel.metrics.r2)} style={{ marginLeft: 8 }}>
                        R² = {selectedModel.metrics.r2.toFixed(4)}
                      </Tag>
                    </p>
                    <p>目标特征: {selectedModel.target_column}</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              {selectedModel.feature_columns.map((feature, index) => (
                <Form.Item
                  key={feature}
                  name={`feature_${index}`}
                  label={feature}
                  rules={[{ required: true, message: '请输入特征值' }]}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    step={0.01} 
                    disabled={predicting}
                  />
                </Form.Item>
              ))}
              
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<LineChartOutlined />}
                loading={predicting}
                block
              >
                开始预测
              </Button>
            </Card>
          )}
          
          {prediction !== null && (
            <Card title="预测结果" style={{ marginTop: 16 }}>
              <Result
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                title="预测完成"
                subTitle={`${selectedModel.target_column} 的预测值为:`}
                extra={
                  <div style={{ textAlign: 'center' }}>
                    <Title level={1} style={{ color: '#1890ff' }}>
                      {prediction.toFixed(4)}
                    </Title>
                  </div>
                }
              />
              
              <Divider />
              
              <Descriptions title="输入特征" bordered>
                {selectedModel.feature_columns.map((feature, index) => (
                  <Descriptions.Item key={feature} label={feature}>
                    {form.getFieldValue(`feature_${index}`)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          )}
        </Form>
      )}
    </div>
  );
};

export default Prediction;