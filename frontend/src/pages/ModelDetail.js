import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Descriptions, 
  Button, 
  Spin, 
  Tabs, 
  Tag, 
  Table,
  message,
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  ExperimentOutlined, 
  LineChartOutlined, 
  SettingOutlined,
  DatabaseOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { modelApi } from '../services/api';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const ModelDetail = () => {
  const { id } = useParams();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  
  useEffect(() => {
    const fetchModel = async () => {
      try {
        setLoading(true);
        const response = await modelApi.getModelById(id);
        setModel(response.data);
      } catch (error) {
        console.error('获取模型详情失败:', error);
        message.error('获取模型详情失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModel();
  }, [id]);
  
  // 评估模型
  const evaluateModel = async () => {
    try {
      setEvaluating(true);
      const response = await modelApi.evaluateModel(id);
      setEvaluationResult(response.data);
      message.success('模型评估完成');
    } catch (error) {
      console.error('模型评估失败:', error);
      message.error('模型评估失败');
    } finally {
      setEvaluating(false);
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
  
  // 生成散点图选项
  const generateScatterOptions = (actual, predictions) => {
    // 计算最小值和最大值，用于设置坐标轴范围
    const allValues = [...actual, ...predictions];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    
    // 准备数据
    const data = actual.map((act, index) => [act, predictions[index]]);
    
    // 生成理想预测线的数据点
    const idealLine = [
      [min - range * 0.1, min - range * 0.1],
      [max + range * 0.1, max + range * 0.1]
    ];
    
    return {
      title: {
        text: '实际值 vs 预测值',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          if (params.seriesIndex === 0) {
            return `实际值: ${params.value[0].toFixed(4)}<br/>预测值: ${params.value[1].toFixed(4)}`;
          }
          return '';
        }
      },
      xAxis: {
        type: 'value',
        name: '实际值',
        min: min - range * 0.1,
        max: max + range * 0.1
      },
      yAxis: {
        type: 'value',
        name: '预测值',
        min: min - range * 0.1,
        max: max + range * 0.1
      },
      series: [
        {
          type: 'scatter',
          data: data,
          symbolSize: 8,
          itemStyle: {
            color: '#5470c6'
          }
        },
        {
          type: 'line',
          data: idealLine,
          symbolSize: 0,
          lineStyle: {
            color: '#91cc75',
            type: 'dashed'
          }
        }
      ]
    };
  };
  
  // 获取模型性能的标签颜色
  const getR2Color = (r2) => {
    if (r2 >= 0.9) return 'green';
    if (r2 >= 0.7) return 'blue';
    if (r2 >= 0.5) return 'orange';
    return 'red';
  };
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', margin: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (!model) {
    return (
      <div>
        <Typography>
          <Title level={2}>模型不存在</Title>
          <Paragraph>
            未找到ID为 {id} 的模型，请返回模型列表页面。
          </Paragraph>
          <Button type="primary">
            <Link to="/models">返回模型列表</Link>
          </Button>
        </Typography>
      </div>
    );
  }
  
  return (
    <div>
      <Typography className="page-header">
        <Title level={2}>模型详情</Title>
        <Paragraph>
          查看模型的详细信息、参数配置和性能评估。
        </Paragraph>
      </Typography>
      
      <Card>
        <Descriptions title="模型信息" bordered>
          <Descriptions.Item label="模型名称">{model.name}</Descriptions.Item>
          <Descriptions.Item label="模型类型">{getModelTypeName(model.model_type)}</Descriptions.Item>
          <Descriptions.Item label="训练时间">{model.training_time}</Descriptions.Item>
          <Descriptions.Item label="数据集ID">{model.dataset_id}</Descriptions.Item>
          <Descriptions.Item label="目标特征">{model.target_column}</Descriptions.Item>
          <Descriptions.Item label="输入特征数">{model.feature_columns.length}</Descriptions.Item>
          <Descriptions.Item label="描述" span={3}>
            {model.description || '无描述'}
          </Descriptions.Item>
        </Descriptions>
        
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="R²决定系数"
                value={model.metrics.r2.toFixed(4)}
                valueStyle={{ color: model.metrics.r2 >= 0.7 ? '#3f8600' : '#cf1322' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="均方误差(MSE)"
                value={model.metrics.mse.toFixed(4)}
                precision={4}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="均方根误差(RMSE)"
                value={model.metrics.rmse.toFixed(4)}
                precision={4}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Button type="primary" icon={<LineChartOutlined />} block>
                <Link to={`/predict?model=${model.id}`}>
                  使用此模型预测
                </Link>
              </Button>
            </Card>
          </Col>
        </Row>
        
        <Tabs defaultActiveKey="1" style={{ marginTop: 24 }}>
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                模型参数
              </span>
            }
            key="1"
          >
            <Table
              dataSource={Object.entries(model.parameters).map(([key, value]) => ({
                key,
                parameter: key,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value)
              }))}
              columns={[
                { title: '参数名', dataIndex: 'parameter', key: 'parameter' },
                { title: '参数值', dataIndex: 'value', key: 'value' }
              ]}
              pagination={false}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                特征信息
              </span>
            }
            key="2"
          >
            <div>
              <p>目标特征: <Tag color="blue">{model.target_column}</Tag></p>
              <p>输入特征:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {model.feature_columns.map(feature => (
                  <Tag key={feature}>{feature}</Tag>
                ))}
              </div>
            </div>
          </TabPane>
          <TabPane
            tab={
              <span>
                <LineChartOutlined />
                性能评估
              </span>
            }
            key="3"
          >
            {evaluationResult ? (
              <div>
                <div className="metrics-display">
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="R²决定系数"
                        value={evaluationResult.metrics.r2.toFixed(4)}
                        valueStyle={{ color: evaluationResult.metrics.r2 >= 0.7 ? '#3f8600' : '#cf1322' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="均方误差(MSE)"
                        value={evaluationResult.metrics.mse.toFixed(4)}
                        precision={4}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="均方根误差(RMSE)"
                        value={evaluationResult.metrics.rmse.toFixed(4)}
                        precision={4}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="平均绝对误差(MAE)"
                        value={evaluationResult.metrics.mae.toFixed(4)}
                        precision={4}
                      />
                    </Col>
                  </Row>
                </div>
                
                <ReactECharts
                  option={generateScatterOptions(evaluationResult.actual, evaluationResult.predictions)}
                  style={{ height: 400, marginTop: 24 }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <p>尚未进行评估</p>
                <Button 
                  type="primary" 
                  icon={<LineChartOutlined />} 
                  onClick={evaluateModel}
                  loading={evaluating}
                >
                  开始评估
                </Button>
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ModelDetail;