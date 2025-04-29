import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Table, 
  Button, 
  Spin, 
  Tabs, 
  Statistic, 
  Row, 
  Col,
  Descriptions,
  message
} from 'antd';
import { 
  DatabaseOutlined, 
  TableOutlined, 
  BarChartOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { datasetApi } from '../services/api';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const DatasetDetail = () => {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDataset = async () => {
      try {
        setLoading(true);
        const response = await datasetApi.getDatasetById(id);
        setDataset(response.data);
      } catch (error) {
        console.error('获取数据集详情失败:', error);
        message.error('获取数据集详情失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDataset();
  }, [id]);
  
  // 生成表格列
  const generateColumns = (columns) => {
    return columns.map(column => ({
      title: column,
      dataIndex: column,
      key: column,
      ellipsis: true,
    }));
  };
  
  // 生成统计图表选项
  const generateChartOptions = (stats) => {
    const series = [];
    const categories = [];
    
    Object.entries(stats).forEach(([column, stat]) => {
      categories.push(column);
      series.push({
        name: '最小值',
        type: 'bar',
        data: [stat.min]
      });
      series.push({
        name: '最大值',
        type: 'bar',
        data: [stat.max]
      });
      series.push({
        name: '平均值',
        type: 'bar',
        data: [stat.mean]
      });
    });
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['最小值', '最大值', '平均值']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories
      },
      yAxis: {
        type: 'value'
      },
      series: series
    };
  };
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', margin: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (!dataset) {
    return (
      <div>
        <Typography>
          <Title level={2}>数据集不存在</Title>
          <Paragraph>
            未找到ID为 {id} 的数据集，请返回数据集列表页面。
          </Paragraph>
          <Button type="primary">
            <Link to="/datasets">返回数据集列表</Link>
          </Button>
        </Typography>
      </div>
    );
  }
  
  return (
    <div>
      <Typography className="page-header">
        <Title level={2}>数据集详情</Title>
        <Paragraph>
          查看数据集的详细信息、数据预览和统计信息。
        </Paragraph>
      </Typography>
      
      <Card>
        <Descriptions title="数据集信息" bordered>
          <Descriptions.Item label="文件名">{dataset.info.original_filename}</Descriptions.Item>
          <Descriptions.Item label="上传时间">{dataset.info.upload_time}</Descriptions.Item>
          <Descriptions.Item label="数据量">{dataset.info.rows} 行</Descriptions.Item>
          <Descriptions.Item label="特征数">{dataset.info.columns.length} 列</Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {dataset.info.description || '无描述'}
          </Descriptions.Item>
        </Descriptions>
        
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="数据行数"
                value={dataset.info.rows}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="特征数量"
                value={dataset.info.columns.length}
                prefix={<TableOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Button type="primary" icon={<ExperimentOutlined />} block>
                <Link to={`/train?dataset=${dataset.info.id}`}>
                  使用此数据集训练模型
                </Link>
              </Button>
            </Card>
          </Col>
        </Row>
        
        <Tabs defaultActiveKey="1" style={{ marginTop: 24 }}>
          <TabPane
            tab={
              <span>
                <TableOutlined />
                数据预览
              </span>
            }
            key="1"
          >
            <Table
              dataSource={dataset.preview}
              columns={generateColumns(dataset.info.columns)}
              rowKey={(record, index) => index}
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                统计信息
              </span>
            }
            key="2"
          >
            {Object.keys(dataset.stats).length > 0 ? (
              <div>
                <ReactECharts
                  option={generateChartOptions(dataset.stats)}
                  style={{ height: 400 }}
                />
                
                <Table
                  dataSource={Object.entries(dataset.stats).map(([column, stat]) => ({
                    column,
                    ...stat
                  }))}
                  columns={[
                    { title: '列名', dataIndex: 'column', key: 'column' },
                    { title: '最小值', dataIndex: 'min', key: 'min' },
                    { title: '最大值', dataIndex: 'max', key: 'max' },
                    { title: '平均值', dataIndex: 'mean', key: 'mean' },
                    { title: '标准差', dataIndex: 'std', key: 'std' }
                  ]}
                  rowKey="column"
                  pagination={false}
                />
              </div>
            ) : (
              <Paragraph>没有数值型列，无法显示统计信息</Paragraph>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default DatasetDetail;