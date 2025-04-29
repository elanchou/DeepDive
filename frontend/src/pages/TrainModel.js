import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Form, 
  Select, 
  Button, 
  Card, 
  Spin, 
  message, 
  Input,
  Divider,
  InputNumber,
  Switch,
  Space,
  Alert,
  Collapse
} from 'antd';
import { 
  ExperimentOutlined, 
  DatabaseOutlined, 
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { datasetApi, modelApi } from '../services/api';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// 解析URL查询参数
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const TrainModel = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const preselectedDatasetId = query.get('dataset');
  
  const [form] = Form.useForm();
  const [datasets, setDatasets] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedModelType, setSelectedModelType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [datasetColumns, setDatasetColumns] = useState([]);
  
  // 获取数据集列表和可用模型
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [datasetsRes, modelsRes] = await Promise.all([
          datasetApi.getAllDatasets(),
          modelApi.getAvailableModels()
        ]);
        
        setDatasets(datasetsRes.data);
        setAvailableModels(modelsRes.data);
        
        // 如果URL中有预选的数据集ID，则自动选择
        if (preselectedDatasetId) {
          form.setFieldsValue({ dataset_id: preselectedDatasetId });
          await fetchDatasetDetails(preselectedDatasetId);
        }
      } catch (error) {
        console.error('获取初始数据失败:', error);
        message.error('获取初始数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [preselectedDatasetId, form]);
  
  // 获取数据集详情
  const fetchDatasetDetails = async (datasetId) => {
    try {
      const response = await datasetApi.getDatasetById(datasetId);
      setSelectedDataset(response.data);
      setDatasetColumns(response.data.info.columns);
    } catch (error) {
      console.error('获取数据集详情失败:', error);
      message.error('获取数据集详情失败');
    }
  };
  
  // 处理数据集选择变化
  const handleDatasetChange = async (value) => {
    form.setFieldsValue({ 
      feature_columns: [], 
      target_column: undefined 
    });
    await fetchDatasetDetails(value);
  };
  
  // 处理模型类型选择变化
  const handleModelTypeChange = (value) => {
    setSelectedModelType(value);
    
    // 重置模型参数
    const selectedModel = availableModels.find(model => model.id === value);
    if (selectedModel) {
      const defaultParams = {};
      Object.entries(selectedModel.parameters).forEach(([key, param]) => {
        defaultParams[key] = param.default;
      });
      form.setFieldsValue({ parameters: defaultParams });
    }
  };
  
  // 训练模型
  const handleSubmit = async (values) => {
    try {
      setTraining(true);
      const response = await modelApi.trainModel(values);
      message.success('模型训练成功');
      navigate(`/models/${response.data.id}`);
    } catch (error) {
      console.error('模型训练失败:', error);
      message.error('模型训练失败');
    } finally {
      setTraining(false);
    }
  };
  
  // 渲染模型参数表单
  const renderModelParameters = () => {
    if (!selectedModelType) return null;
    
    const selectedModel = availableModels.find(model => model.id === selectedModelType);
    if (!selectedModel) return null;
    
    return (
      <Card 
        title="模型参数配置" 
        style={{ marginTop: 16 }}
        extra={<InfoCircleOutlined />}
      >
        {Object.entries(selectedModel.parameters).map(([key, param]) => {
          const fieldName = ['parameters', key];
          
          // 根据参数类型渲染不同的表单控件
          if (param.type === 'number') {
            return (
              <Form.Item
                key={key}
                label={key}
                name={fieldName}
                tooltip={param.description}
              >
                <InputNumber style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            );
          } else if (param.type === 'integer') {
            return (
              <Form.Item
                key={key}
                label={key}
                name={fieldName}
                tooltip={param.description}
              >
                <InputNumber style={{ width: '100%' }} precision={0} />
              </Form.Item>
            );
          } else if (param.type === 'boolean') {
            return (
              <Form.Item
                key={key}
                label={key}
                name={fieldName}
                valuePropName="checked"
                tooltip={param.description}
              >
                <Switch />
              </Form.Item>
            );
          } else if (param.type === 'string' && param.enum) {
            return (
              <Form.Item
                key={key}
                label={key}
                name={fieldName}
                tooltip={param.description}
              >
                <Select>
                  {param.enum.map(option => (
                    <Option key={option} value={option}>{option}</Option>
                  ))}
                </Select>
              </Form.Item>
            );
          } else if (param.type === 'array') {
            return (
              <Form.Item
                key={key}
                label={key}
                name={fieldName}
                tooltip={param.description}
              >
                <Select mode="tags" tokenSeparators={[',']} />
              </Form.Item>
            );
          } else {
            return (
              <Form.Item
                key={key}
                label={key}
                name={fieldName}
                tooltip={param.description}
              >
                <Input />
              </Form.Item>
            );
          }
        })}
      </Card>
    );
  };
  
  return (
    <div>
      <Typography className="page-header">
        <Title level={2}>训练新模型</Title>
        <Paragraph>
          选择数据集和模型类型，配置参数，训练新的模型。
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
          initialValues={{
            test_size: 0.2,
            parameters: {}
          }}
        >
          <Card title="基本配置">
            <Form.Item
              name="dataset_id"
              label="选择数据集"
              rules={[{ required: true, message: '请选择数据集' }]}
            >
              <Select 
                placeholder="请选择数据集" 
                onChange={handleDatasetChange}
                disabled={training}
              >
                {datasets.map(dataset => (
                  <Option key={dataset.id} value={dataset.id}>
                    {dataset.original_filename} ({dataset.rows} 行 x {dataset.columns.length} 列)
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            {selectedDataset && (
              <>
                <Form.Item
                  name="target_column"
                  label="目标特征（预测目标）"
                  rules={[{ required: true, message: '请选择目标特征' }]}
                >
                  <Select 
                    placeholder="请选择目标特征" 
                    disabled={training}
                  >
                    {datasetColumns.map(column => (
                      <Option key={column} value={column}>{column}</Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="feature_columns"
                  label="输入特征"
                  rules={[{ required: true, message: '请选择至少一个输入特征' }]}
                >
                  <Select 
                    mode="multiple" 
                    placeholder="请选择输入特征" 
                    disabled={training}
                    className="feature-select"
                  >
                    {datasetColumns.map(column => (
                      <Option key={column} value={column}>{column}</Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="test_size"
                  label="测试集比例"
                  tooltip="用于评估模型的数据比例，范围0-1"
                >
                  <InputNumber 
                    min={0.1} 
                    max={0.5} 
                    step={0.05} 
                    disabled={training}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </>
            )}
            
            <Divider />
            
            <Form.Item
              name="model_type"
              label="选择模型类型"
              rules={[{ required: true, message: '请选择模型类型' }]}
            >
              <Select 
                placeholder="请选择模型类型" 
                onChange={handleModelTypeChange}
                disabled={training}
              >
                {availableModels.map(model => (
                  <Option key={model.id} value={model.id}>
                    {model.name} - {model.description}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="name"
              label="模型名称"
              tooltip="为模型指定一个易于识别的名称"
            >
              <Input placeholder="模型名称（可选）" disabled={training} />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="模型描述"
            >
              <Input.TextArea 
                placeholder="模型描述（可选）" 
                rows={3} 
                disabled={training}
              />
            </Form.Item>
          </Card>
          
          {renderModelParameters()}
          
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<ExperimentOutlined />}
                loading={training}
                disabled={!selectedDataset || !selectedModelType}
              >
                开始训练
              </Button>
              <Button 
                onClick={() => navigate('/models')}
                disabled={training}
              >
                取消
              </Button>
            </Space>
          </div>
          
          {training && (
            <Alert
              message="模型训练中"
              description="模型训练可能需要一些时间，请耐心等待。训练完成后将自动跳转到模型详情页面。"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
          
          <Collapse style={{ marginTop: 16 }}>
            <Panel header="模型类型说明" key="1">
              <ul>
                {availableModels.map(model => (
                  <li key={model.id}>
                    <strong>{model.name}</strong>: {model.description}
                  </li>
                ))}
              </ul>
            </Panel>
          </Collapse>
        </Form>
      )}
    </div>
  );
};

export default TrainModel;