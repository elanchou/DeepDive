import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 数据集相关API
export const datasetApi = {
  // 获取所有数据集
  getAllDatasets: () => api.get('/datasets'),
  
  // 获取数据集详情
  getDatasetById: (id) => api.get(`/datasets/${id}`),
  
  // 上传数据集
  uploadDataset: (formData) => api.post('/datasets/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// 模型相关API
export const modelApi = {
  // 获取所有模型
  getAllModels: () => api.get('/models'),
  
  // 获取模型详情
  getModelById: (id) => api.get(`/models/${id}`),
  
  // 获取可用的模型类型
  getAvailableModels: () => api.get('/models/available'),
  
  // 训练模型
  trainModel: (trainingData) => api.post('/models/train', trainingData),
  
  // 评估模型
  evaluateModel: (modelId, datasetId = null) => {
    const url = `/models/${modelId}/evaluate`;
    return datasetId ? api.post(url, { dataset_id: datasetId }) : api.post(url);
  },
  
  // 使用模型预测
  predict: (modelId, features) => api.post(`/models/${modelId}/predict`, { features }),
};

export default {
  datasetApi,
  modelApi,
};