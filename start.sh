#!/bin/bash

# 多维数据拟合与预测系统启动脚本

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 多维数据拟合与预测系统 ===${NC}"
echo -e "${BLUE}正在启动系统...${NC}"

# 检查Python环境
echo -e "${BLUE}检查Python环境...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}错误: 未找到Python3，请安装Python3后再试${NC}"
    exit 1
fi

# 检查Node.js环境
echo -e "${BLUE}检查Node.js环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到Node.js，请安装Node.js后再试${NC}"
    exit 1
fi

# 检查npm环境
echo -e "${BLUE}检查npm环境...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未找到npm，请安装npm后再试${NC}"
    exit 1
fi

# 创建数据目录
echo -e "${BLUE}创建数据目录...${NC}"
mkdir -p data/datasets data/models data/results

# 创建并激活虚拟环境
echo -e "${BLUE}创建Python虚拟环境...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}错误: 创建虚拟环境失败${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}激活虚拟环境...${NC}"
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 激活虚拟环境失败${NC}"
    exit 1
fi

# 安装后端依赖
echo -e "${BLUE}安装后端依赖...${NC}"
cd backend
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 安装后端依赖失败${NC}"
    deactivate
    exit 1
fi

# 启动后端服务
echo -e "${GREEN}启动后端服务...${NC}"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo -e "${GREEN}后端服务已启动，PID: $BACKEND_PID${NC}"

# 返回到项目根目录
cd ..

# 安装前端依赖
echo -e "${BLUE}安装前端依赖...${NC}"
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 安装前端依赖失败${NC}"
    kill $BACKEND_PID
    deactivate
    exit 1
fi

# 启动前端服务
echo -e "${GREEN}启动前端服务...${NC}"
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}前端服务已启动，PID: $FRONTEND_PID${NC}"

# 返回到项目根目录
cd ..

echo -e "${GREEN}系统启动成功!${NC}"
echo -e "${GREEN}后端API地址: http://localhost:8000${NC}"
echo -e "${GREEN}前端界面地址: http://localhost:3000${NC}"
echo -e "${BLUE}按Ctrl+C停止服务${NC}"

# 捕获中断信号
trap "echo -e '${BLUE}正在停止服务...${NC}'; kill $BACKEND_PID $FRONTEND_PID; deactivate; echo -e '${GREEN}服务已停止${NC}'; exit 0" INT

# 保持脚本运行
wait