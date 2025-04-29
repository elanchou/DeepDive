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
              
              {model.feature_importance && Object.keys(model.feature_importance).length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <Title level={4}>特征重要性/系数</Title>
                  <Paragraph>
                    {model.model_type.includes('regression') && !model.model_type.includes('polynomial') ? 
                      '系数值表示每个特征对目标值的影响程度和方向。正值表示正向影响，负值表示负向影响。' :
                      '特征重要性表示每个特征对模型预测的相对重要程度。'}
                  </Paragraph>
                  
                  <Table
                    dataSource={Object.entries(model.feature_importance)
                      .map(([feature, value]) => ({
                        key: feature,
                        feature: feature,
                        value: parseFloat(value.toFixed(6)),
                        absValue: Math.abs(parseFloat(value.toFixed(6)))
                      }))
                      .sort((a, b) => b.absValue - a.absValue)}
                    columns={[
                      { 
                        title: '特征', 
                        dataIndex: 'feature', 
                        key: 'feature',
                        render: text => text === '截距(Intercept)' ? 
                          <span>{text} <Tag color="purple">截距</Tag></span> : text
                      },
                      { 
                        title: '系数/重要性', 
                        dataIndex: 'value', 
                        key: 'value',
                        render: value => {
                          // 线性模型显示正负符号和颜色
                          if (model.model_type.includes('regression') && !model.model_type.includes('polynomial')) {
                            const color = value > 0 ? '#3f8600' : '#cf1322';
                            const sign = value > 0 ? '+' : '';
                            return <span style={{ color }}>{sign}{value}</span>;
                          }
                          return value;
                        }
                      },
                      {
                        title: '可视化',
                        dataIndex: 'value',
                        key: 'visualization',
                        render: (value, record) => {
                          // 对于线性模型，显示正负条形图
                          if (model.model_type.includes('regression') && !model.model_type.includes('polynomial')) {
                            const maxValue = Math.max(...Object.values(model.feature_importance)
                              .map(v => Math.abs(parseFloat(v.toFixed(6)))));
                            const width = `${(Math.abs(value) / maxValue) * 100}%`;
                            const color = value > 0 ? '#3f8600' : '#cf1322';
                            
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: value < 0 ? 'flex-end' : 'flex-start' }}>
                                <div style={{ 
                                  width, 
                                  height: '20px', 
                                  backgroundColor: color,
                                  marginLeft: value < 0 ? 'auto' : 0,
                                  marginRight: value < 0 ? 0 : 'auto'
                                }}></div>
                              </div>
                            );
                          }
                          
                          // 对于其他模型，显示普通条形图
                          const maxValue = Math.max(...Object.values(model.feature_importance)
                            .map(v => parseFloat(v.toFixed(6))));
                          const width = `${(value / maxValue) * 100}%`;
                          
                          return (
                            <div style={{ width: '100%' }}>
                              <div style={{ width, height: '20px', backgroundColor: '#1890ff' }}></div>
                            </div>
                          );
                        }
                      }
                    ]}
                    pagination={false}
                  />
                  
                  {model.model_type.includes('regression') && !model.model_type.includes('polynomial') && (
                    <ReactECharts
                      option={{
                        title: {
                          text: '特征系数',
                          left: 'center'
                        },
                        tooltip: {
                          trigger: 'axis',
                          axisPointer: {
                            type: 'shadow'
                          }
                        },
                        grid: {
                          left: '3%',
                          right: '4%',
                          bottom: '3%',
                          containLabel: true
                        },
                        xAxis: {
                          type: 'value',
                          name: '系数值'
                        },
                        yAxis: {
                          type: 'category',
                          data: Object.entries(model.feature_importance)
                            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                            .map(([feature]) => feature),
                          axisLabel: {
                            interval: 0,
                            rotate: 30
                          }
                        },
                        series: [
                          {
                            name: '系数',
                            type: 'bar',
                            data: Object.entries(model.feature_importance)
                              .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                              .map(([_, value]) => parseFloat(value.toFixed(6))),
                            itemStyle: {
                              color: function(params) {
                                return params.value > 0 ? '#3f8600' : '#cf1322';
                              }
                            }
                          }
                        ]
                      }}
                      style={{ height: 400, marginTop: 24 }}
                    />
                  )}
                </div>
              )}
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