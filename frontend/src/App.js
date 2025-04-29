import React from 'react';
import { Layout, Menu } from 'antd';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  LineChartOutlined,
  SettingOutlined
} from '@ant-design/icons';

// 导入页面组件
import HomePage from './pages/HomePage';
import DatasetList from './pages/DatasetList';
import DatasetDetail from './pages/DatasetDetail';
import ModelList from './pages/ModelList';
import ModelDetail from './pages/ModelDetail';
import TrainModel from './pages/TrainModel';
import Prediction from './pages/Prediction';

const { Header, Content, Footer } = Layout;

const App = () => {
  const location = useLocation();
  
  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/datasets')) return '2';
    if (path.startsWith('/models')) return '3';
    if (path.startsWith('/train')) return '4';
    if (path.startsWith('/predict')) return '5';
    return '1'; // 默认选中首页
  };

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Header>
        <div className="logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          items={[
            {
              key: '1',
              icon: <HomeOutlined />,
              label: <Link to="/">首页</Link>,
            },
            {
              key: '2',
              icon: <DatabaseOutlined />,
              label: <Link to="/datasets">数据集</Link>,
            },
            {
              key: '3',
              icon: <ExperimentOutlined />,
              label: <Link to="/models">模型</Link>,
            },
            {
              key: '4',
              icon: <SettingOutlined />,
              label: <Link to="/train">训练</Link>,
            },
            {
              key: '5',
              icon: <LineChartOutlined />,
              label: <Link to="/predict">预测</Link>,
            },
          ]}
        />
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content" style={{ margin: '16px 0' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/datasets" element={<DatasetList />} />
            <Route path="/datasets/:id" element={<DatasetDetail />} />
            <Route path="/models" element={<ModelList />} />
            <Route path="/models/:id" element={<ModelDetail />} />
            <Route path="/train" element={<TrainModel />} />
            <Route path="/predict" element={<Prediction />} />
          </Routes>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        多维数据拟合与预测系统 ©{new Date().getFullYear()} Created with React & FastAPI
      </Footer>
    </Layout>
  );
};

export default App;