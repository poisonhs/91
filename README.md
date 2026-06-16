# 91

<p align="center">
  <img width="120" height="120" alt="91" src="https://github.com/user-attachments/assets/5b323c94-bbd3-4dce-bbc8-adc86935b7de" />
</p>

<p align="center">个人私有视频站</p>

## 功能特性

- 支持多种存储后端
- 支持前台视频浏览与后台管理
- 自动生成封面和预览片段
- 支持自定义爬虫脚本导入
- 支持短视频模式

## 快速开始

### 方式一：源码部署

> 当前 fork `poisonhs/91` 还没有自己的 GitHub Release 安装包，所以这里使用源码部署，能直接安装当前仓库代码。

```bash
sudo apt update && sudo apt install -y git curl ca-certificates
git clone https://github.com/poisonhs/91.git
cd 91
sudo bash deploy.sh
```

部署完成后访问：

| 地址 | 说明 |
|------|------|
| `http://服务器IP:9191/` | 前台 |
| `http://服务器IP:9191/admin` | 后台管理 |

如果首次访问出现 502，可执行：

```bash
cd 91
sudo bash deploy.sh restart
```

常用管理命令：

```bash
cd 91
sudo bash deploy.sh status
sudo bash deploy.sh logs
sudo bash deploy.sh update
sudo bash deploy.sh restart
sudo bash deploy.sh stop
```

更新当前部署：

```bash
cd 91
git pull --ff-only
sudo bash deploy.sh update
```

自定义端口：

```bash
cd 91
FRONTEND_PORT=8080 sudo -E bash deploy.sh
```

### 方式二：Docker Compose 源码构建

```bash
git clone https://github.com/poisonhs/91.git
cd 91
```

创建 `docker-compose.yml`：

```yaml
services:
  video-site-91:
    build:
      context: .
      dockerfile: Dockerfile
    image: poisonhs/91:local
    container_name: video-site-91
    ports:
      - "9191:9191"
    volumes:
      - ./data:/opt/video-site-91/data
    restart: unless-stopped
```

启动：

```bash
docker compose up -d --build
```

更新 Docker 部署：

```bash
git pull --ff-only
docker compose up -d --build
```

常用命令：

```bash
docker compose logs -f
docker compose up -d --build
docker compose restart
```

> 所有配置、数据库、封面、预览及上传文件都保存在 `./data/` 目录下。

## 数据目录

### 源码部署

| 路径 | 说明 |
|------|------|
| `backend/config.yaml` | 主配置文件 |
| `backend/data/video-site.db` | SQLite 数据库 |
| `backend/data/previews/` | 封面和预览片段 |
| `backend/data/uploads/` | 本地上传文件 |
| `backend/data/spider91/` | 爬虫下载文件 |

### Docker Compose 部署

| 路径 | 说明 |
|------|------|
| `./data/config.yaml` | 主配置文件 |
| `./data/video-site.db` | SQLite 数据库 |
| `./data/previews/` | 封面和预览片段 |
| `./data/uploads/` | 本地上传文件 |
| `./data/spider91/` | 爬虫下载文件 |

## 使用提醒

本项目面向个人私有部署，请仅接入你有权管理和访问的内容，并遵守所在地法律法规与相关服务条款。

## License

[MIT](LICENSE)
