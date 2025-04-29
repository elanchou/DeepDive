import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  List, 
  Card, 
  Button, 
  Upload, 
  message, 
  Input, 
  Spin, 
  Empty,
  Modal
} from 'antd';
import { 
  UploadOutlined, 
  FileExcelOutlined, 
  FileTextOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { datasetApi } from '../services/api';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

const DatasetList = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  
  // 获取数据集列表
  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await datasetApi.getAllDatasets();
      setDatasets(response.data);
    } catch (error) {
      console.error('获取数据集列表失败:', error);
      message.error('获取数据集列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDatasets();
  }, []);
  
  // 上传配置
  const uploadProps = {
    name: 'file',
    multiple: false,
    action: '/datasets/upload',
    accept: '.csv,.xls,.xlsx',
    showUploadList: false,
    beforeUpload: (file) => {
      const isValidFormat = file.type === 'text/csv' || 
                           file.type === 'application/vnd.ms-excel' || 
                           file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (!isValidFormat) {
        message.error('只能上传CSV或Excel文件!');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', description);
        
        const response = await datasetApi.uploadDataset(formData);
        
        message.success('数据集上传成功');
        onSuccess(response, file);
        setDescription('');
        setUploadModalVisible(false);
        fetchDatasets();
      } catch (error) {
        console.error('上传数据集失败:', error);
        message.error('上传数据集失败');
        onError(error);
      } finally {
        setUploading(false);
      }
    }
  };
  
  return (
    <div>
      <Typography className="page-header">
        <Title level={2}>数据集管理</Title>
        <Paragraph>
          在这里您可以查看所有已上传的数据集，或者上传新的数据集。
        </Paragraph>
      </Typography>
      
      <Button 
        type="primary" 
        icon={<UploadOutlined />} 
        style={{ marginBottom: 16 }}
        onClick={() => setUploadModalVisible(true)}
      >
        上传新数据集
      </Button>
      
      <Modal
        title="上传新数据集"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <TextArea
          placeholder="请输入数据集描述（可选）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ marginBottom: 16 }}
        />
        
        <Dragger {...uploadProps} disabled={uploading}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持上传CSV或Excel格式的数据文件
          </p>
        </Dragger>
        
        {uploading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Spin tip="上传中..." />
          </div>
        )}
      </Modal>
      
      {loading ? (
        <div style={{ textAlign: 'center', margin: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : datasets.length === 0 ? (
        <Empty description="暂无数据集，请上传新的数据集" />
      ) : (
        <List
          grid={{ gutter: 16, column: 3 }}
          dataSource={datasets}
          renderItem={(dataset) => (
            <List.Item>
              <Card 
                className="dataset-card"
                title={dataset.original_filename}
                extra={
                  <Link to={`/datasets/${dataset.id}`}>
                    <Button type="link" icon={<EyeOutlined />}>查看</Button>
                  </Link>
                }
              >
                <p>
                  {dataset.original_filename.endsWith('.csv') ? (
                    <FileTextOutlined style={{ marginRight: 8 }} />
                  ) : (
                    <FileExcelOutlined style={{ marginRight: 8 }} />
                  )}
                  {dataset.rows} 行 x {dataset.columns.length} 列
                </p>
                <p>上传时间: {dataset.upload_time}</p>
                {dataset.description && <p>描述: {dataset.description}</p>}
                <Button type="primary" block>
                  <Link to={`/datasets/${dataset.id}`}>查看详情</Link>
                </Button>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default DatasetList;