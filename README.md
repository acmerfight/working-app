# Working App

基于 **Hono + React + Jotai + TypeScript** 的全栈应用模板。

## 技术栈

- 🔥 **Hono** - 轻量级高性能 Web 框架
- ⚛️ **React 19** - 前端 UI 框架
- 🔮 **Jotai** - 原子化状态管理
- 📦 **pnpm** - 高效的包管理器
- ⚡ **Vite** - 下一代前端构建工具
- 🔷 **TypeScript** - 严格类型检查
- 🎨 **ESLint + Prettier** - 代码规范

## 项目结构

```
working-app/
├── packages/
│   ├── client/          # React 前端应用
│   │   ├── src/
│   │   │   ├── components/  # React 组件
│   │   │   ├── store/       # Jotai store & atoms
│   │   │   ├── styles/      # CSS 样式
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── server/          # Hono 后端 API
│   │   ├── src/
│   │   │   ├── routes/      # API 路由
│   │   │   ├── app.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── shared/          # 共享类型和工具
│       ├── src/
│       │   ├── types/       # 类型定义
│       │   ├── schemas/     # Zod schemas
│       │   └── utils/       # 工具函数
│       └── package.json
│
├── tsconfig.base.json   # TypeScript 基础配置
├── pnpm-workspace.yaml  # pnpm workspace 配置
└── package.json         # 根配置
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

同时启动前端和后端:

```bash
pnpm dev
```

或分别启动:

```bash
# 前端 (http://localhost:5173)
pnpm dev:client

# 后端 (http://localhost:3000)
pnpm dev:server
```

### 构建生产版本

```bash
pnpm build
```

### 代码检查

```bash
# 类型检查
pnpm typecheck

# ESLint
pnpm lint

# Prettier
pnpm format
```

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/hello` | 返回欢迎消息 |
| POST | `/api/echo` | 回显发送的消息 |
| GET | `/api/users` | 获取用户列表 |
| GET | `/api/users/:id` | 获取单个用户 |
| GET | `/health` | 健康检查 |

## 端口配置

- 前端开发服务器: `5173`
- 后端 API 服务器: `3000`
- 前端已配置代理，`/api/*` 请求会自动转发到后端

## TypeScript 配置

项目使用严格的 TypeScript 配置:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- 等等...

## 开发规范

- 使用 ESLint + Prettier 保持代码风格一致
- 遵循 TypeScript 严格模式
- 使用 Jotai atoms 管理状态
- API 使用 Zod 进行数据验证

## License

MIT

