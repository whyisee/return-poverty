# 中年返贫四件套：小店生死账

一个餐饮小店经营风险模拟器。玩家选择角色、赛道和开局包，在奶茶、汉堡、咖啡、烘焙这四类常见小店创业赛道中体验现金流、家庭压力、债务、投流、损耗和止损决策。

当前版本是 MVP：已跑通“7 天试营”快速体验闭环，并预留完整流程版入口。

## 技术栈

前端：

- React
- Vite
- TypeScript
- Ant Design

后端：

- Python
- FastAPI
- Pydantic

数据：

- 当前 MVP 使用 seed JSON + 内存存档
- MySQL 表结构已在开发设计文档中规划，下一阶段接入 SQLAlchemy / Alembic / MySQL

## 当前功能

- 首页选择角色、赛道和开局包
- 支持快速体验版和完整流程入口
- 7 天经营循环
- 每天选择经营动作
- 后端结算现金流、家庭压力、体力、口碑、复购、信息、冲动等指标
- 经营台左侧状态栏展示指标变化
- 指标 `?` 悬浮说明含义和变化记录
- 现实屏逐条输出动作处理过程
- 账本展示每日流水和真实净现金流
- 生成创业体检报告

## 快速启动

推荐使用统一脚本：

```bash
bash scripts/dev.sh setup
bash scripts/dev.sh start
```

访问地址：

```text
前端：http://127.0.0.1:3101
后端：http://127.0.0.1:8101
API 文档：http://127.0.0.1:8101/docs
```

查看状态：

```bash
bash scripts/dev.sh status
```

查看日志：

```bash
bash scripts/dev.sh logs
```

停止服务：

```bash
bash scripts/dev.sh stop
```

重启服务：

```bash
bash scripts/dev.sh restart
```

## 手动启动

后端：

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8101
```

前端：

```bash
cd frontend
npm install
npm run dev
```

前端 Vite 已配置 `/api` 代理到 `http://127.0.0.1:8101`。

## 目录结构

```text
return-poverty/
  backend/
    app/
      api/v1/       API 路由
      engine/       模拟计算引擎
      schemas/      Pydantic 数据模型
      seed/         第一版内容配置
      services/     业务服务
    pyproject.toml
  frontend/
    src/
      components/   经营台、指标栏、现实屏、账本等组件
      pages/        首页、经营台、报告页
      services/     API 请求封装
      styles/       全局样式
      types/        前后端共享类型
    package.json
  docs/
    中年返贫四件套经营模拟器设计方案.md
    中年返贫四件套经营模拟器开发设计文档.md
    开发运行说明.md
  scripts/
    dev.sh          统一启停脚本
  deploy/
    docker-compose.yml
    env.example
```

## 常用命令

前端构建：

```bash
cd frontend
npm run build
```

后端语法检查：

```bash
python3 -m compileall backend/app
```

启动 MySQL 开发容器：

```bash
docker compose -f deploy/docker-compose.yml up -d
```

## 端口

默认端口：

| 服务 | 地址 |
| --- | --- |
| 前端 | `http://127.0.0.1:3101` |
| 后端 | `http://127.0.0.1:8101` |
| API 文档 | `http://127.0.0.1:8101/docs` |

可以通过环境变量覆盖：

```bash
BACKEND_PORT=8102 FRONTEND_PORT=3102 bash scripts/dev.sh start
```

## 设计文档

- [中年返贫四件套经营模拟器设计方案](docs/中年返贫四件套经营模拟器设计方案.md)
- [中年返贫四件套经营模拟器开发设计文档](docs/中年返贫四件套经营模拟器开发设计文档.md)
- [开发运行说明](docs/开发运行说明.md)

## 下一步计划

1. 接入 SQLAlchemy 和 MySQL，替换当前内存存档。
2. 增加 Alembic 迁移，落地数据库表结构。
3. 扩充事件卡、决策卡和动作反馈文案。
4. 完善完整流程版章节状态机。
5. 补充后端规则引擎单元测试。
6. 优化前端包体，按页面做代码拆分。

