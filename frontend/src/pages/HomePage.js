import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, Button } from 'antd';
import { Link } from 'react-router-dom';
import { 
  DatabaseOutlined, 
  ExperimentOutlined, 
  UploadOutlined, 
  LineChartOutlined 
} from '@ant-design/icons';
import { datasetApi, modelApi } from '../services/api';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const [stats, setStats] = useState({
    datasets: 0,
    models: 0
  });
  
  useEffect(() => {
    // 获取统计数据
    const fetchStats = async () => {
      try {
        const [datasetsRes, modelsRes] = await Promise.all([
          datasetApi.getAllDatasets(),
          modelApi.getAllModels()
        ]);
        
        setStats({
          datasets: datasetsRes.data.length,
          models: modelsRes.data.length
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    };
    
    fetchStats();
  }, []);
  
  return (
    <div>
      <Typography className="page-header">
        <Title level={2}>多维数据拟合与预测系统</Title>
        <Paragraph>
          欢迎使用多维数据拟合与预测系统。本系统可以导入多维数据，使用多种模型进行拟合，
          评估拟合程度，并基于训练好的模型进行预测。
        </Paragraph>
      </Typography>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="数据集数量"
              value={stats.datasets}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="模型数量"
              value={stats.models}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={6}>
          <Card
            title="数据集管理"
            extra={<Link to="/datasets">查看</Link>}
            style={{ marginBottom: 16 }}
          >
            <p>浏览和管理已上传的数据集</p>
            <Button type="primary" icon={<DatabaseOutlined />}>
              <Link to="/datasets">数据集列表</Link>
            </Button>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            title="上传数据"
            extra={<Link to="/datasets">上传</Link>}
            style={{ marginBottom: 16 }}
          >
            <p>上传新的多维数据集</p>
            <Button type="primary" icon={<UploadOutlined />}>
              <Link to="/datasets">上传数据</Link>
            </Button>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            title="模型管理"
            extra={<Link to="/models">查看</Link>}
            style={{ marginBottom: 16 }}
          >
            <p>浏览和管理已训练的模型</p>
            <Button type="primary" icon={<ExperimentOutlined />}>
              <Link to="/models">模型列表</Link>
            </Button>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            title="训练与预测"
            extra={<Link to="/train">训练</Link>}
            style={{ marginBottom: 16 }}
          >
            <p>训练新模型或使用现有模型进行预测</p>
            <Button type="primary" icon={<LineChartOutlined />}>
              <Link to="/predict">开始预测</Link>
            </Button>
          </Card>
        </Col>
      </Row>
      
      <Typography style={{ marginTop: 24 }}>
        <Title level={3}>系统功能</Title>
        <Paragraph>
          <ul>
            <li>导入多维数据集（CSV、Excel格式）</li>
            <li>支持多种机器学习模型进行数据拟合</li>
            <li>可视化展示拟合程度</li>
            <li>模型训练与参数调整</li>
            <li>基于训练好的模型进行预测</li>
          </ul>
        </Paragraph>
      </Typography>
    </div>
  );
};

export default HomePage;