# 棋局剧场 Chess Studio

一个支持本地对战、远程双人、远程人机，以及逐手复盘的国际象棋网页应用。

## 功能

- 人机对战
  - `初级 / 中级 / 高级` 难度
- 双人对战
  - 同一设备轮流走子
- 远程双人
  - 创建房间
  - 房间码加入
  - 实时同步棋盘与复盘
- 远程人机
  - 创建房间后立即开局
  - 玩家执白，服务端 AI 执黑
- 复盘能力
  - 逐手走子记录
  - 最佳着法与评估波动
  - 关键失误与转折摘要

## 本地启动

先进入项目目录：

```bash
cd /Users/songsiqin/chess-review-game
```

安装依赖：

```bash
npm install
```

启动服务：

```bash
node server.js
```

或：

```bash
npm start
```

浏览器打开：

```text
http://127.0.0.1:4173
```

## 双击启动

可以直接双击：

`start-chess.command`

它会自动打开浏览器并启动本地服务。

## 怎么玩

### 人机对战

1. 打开页面
2. 选择 `人机对战`
3. 选择难度
4. 点击 `开始游戏`
5. 你执白，AI 执黑

### 双人对战

1. 选择 `双人对战`
2. 点击 `开始游戏`
3. 白黑双方轮流点击走子

### 远程双人

1. 选择 `远程联机`
2. 在联机面板里把房间类型选成 `远程双人`
3. 一方点击 `创建房间`
4. 把房间码或邀请链接发给对方
5. 对方输入房间码并点击 `加入房间`
6. 双方到齐后自动开局

### 远程人机

1. 选择 `远程联机`
2. 在联机面板里把房间类型选成 `远程人机`
3. 点击 `创建房间`
4. 系统会立即开局
5. 你执白，服务端 AI 执黑

## 局域网访问

如果是同一个 Wi-Fi 下的另一台设备：

先在服务所在电脑上启动：

```bash
node server.js
```

再查询本机局域网 IP：

```bash
ipconfig getifaddr en0
```

假设输出为：

```text
192.168.1.23
```

那么另一台设备打开：

```text
http://192.168.1.23:4173
```

## 不同网络访问

如果对方不在同一个 Wi-Fi，需要部署到公网。推荐使用 Render。

## 部署到 Render

### 1. 上传到 GitHub

```bash
cd /Users/songsiqin/chess-review-game
git init
git add .
git commit -m "Initial chess studio"
git branch -M main
git remote add origin 你的GitHub仓库地址
git push -u origin main
```

### 2. 在 Render 创建 Web Service

打开：

`https://render.com`

创建方式：

1. `New`
2. `Web Service`
3. 连接 GitHub 仓库
4. 选择本项目仓库

### 3. Render 配置

填写：

```text
Build Command: npm install
Start Command: npm start
```

项目已经兼容 Render 的 `PORT` 环境变量和 WebSocket。

部署完成后，Render 会给你一个公网地址，例如：

```text
https://your-app-name.onrender.com
```

之后你和其他人都可以直接通过这个网址访问。

## 项目结构

- `index.html`
  - 页面结构
- `styles.css`
  - 页面样式
- `app.js`
  - 前端棋盘、交互、复盘、联机客户端逻辑
- `server.js`
  - 静态服务 + WebSocket 房间服务 + 远程人机 AI
- `start-chess.command`
  - macOS 双击启动脚本

## 说明

当前远程模式已可用，但服务端仍然是“接收客户端状态并广播”的轻量方案。
后续如果需要更强的安全性，可以继续升级为：

- 服务端权威判定合法走子
- 防止客户端伪造局面
- 登录、战绩和复盘分享
