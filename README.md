# 多维数据拟合与预测系统

这是一个完整的前后端系统，用于多维数据的导入、模型拟合、训练和预测。

## 功能特点

- 导入多维数据集
- 支持多种机器学习模型进行数据拟合
- 可视化展示拟合程度
- 模型训练与参数调整
- 基于训练好的模型进行预测

## 系统架构

- 前端：React.js + Ant Design + Echarts
- 后端：Python + FastAPI
- 机器学习：Scikit-learn, TensorFlow, PyTorch

## 目录结构

\`\`\`
.
├── backend/            # 后端代码
│   ├── app/            # FastAPI应用
│   └── requirements.txt # 后端依赖
├── frontend/           # 前端代码
│   ├── public/         # 静态资源
│   └── src/            # 源代码
├── data/               # 数据存储目录
└── README.md           # 项目说明
\`\`\`

## 快速开始

### 后端设置

\`\`\`bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
\`\`\`

### 前端设置

\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

## 使用指南

1. 通过前端界面上传多维数据集
2. 选择合适的机器学习模型
3. 设置模型参数并进行训练
4. 查看拟合结果和评估指标
5. 使用训练好的模型进行预测

## 支持的模型

- 线性回归
- 多项式回归
- 支持向量机回归
- 随机森林回归
- 神经网络回归
- 等等