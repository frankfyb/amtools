#!/bin/bash

# AMTools Backend 部署脚本
# 用于在远程服务器上部署应用

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
REGISTRY="ghcr.io"
REPOSITORY="frankfyb/amtools-backend"
IMAGE_TAG="${1:-latest}"
CONTAINER_NAME="amtools-backend"
APP_DIR="/opt/amtools"
BACKUP_DIR="/opt/amtools/backups"

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    log_info "Docker 已安装: $(docker --version)"
}

# 检查 Docker Compose 是否安装
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    log_info "Docker Compose 已安装: $(docker-compose --version)"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    sudo mkdir -p $APP_DIR/{logs,uploads,nginx,scripts}
    sudo mkdir -p $BACKUP_DIR
    sudo chown -R $USER:$USER $APP_DIR
}

# 备份当前部署
backup_current_deployment() {
    if [ -d "$APP_DIR" ]; then
        log_info "备份当前部署..."
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        sudo tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$APP_DIR" . 2>/dev/null || true
        log_success "备份完成: $BACKUP_NAME.tar.gz"
    fi
}

# 拉取最新镜像
pull_image() {
    log_info "拉取最新镜像: $REGISTRY/$REPOSITORY:$IMAGE_TAG"
    docker pull "$REGISTRY/$REPOSITORY:$IMAGE_TAG"
    log_success "镜像拉取完成"
}

# 停止旧容器
stop_old_container() {
    log_info "停止旧容器..."
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        docker stop $CONTAINER_NAME
        log_success "旧容器已停止"
    else
        log_info "没有运行中的容器"
    fi
}

# 删除旧容器
remove_old_container() {
    log_info "删除旧容器..."
    if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
        docker rm $CONTAINER_NAME
        log_success "旧容器已删除"
    else
        log_info "没有需要删除的容器"
    fi
}

# 启动新容器
start_new_container() {
    log_info "启动新容器..."
    
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p 3000:3000 \
        --env-file $APP_DIR/.env \
        -v $APP_DIR/logs:/app/logs \
        -v $APP_DIR/uploads:/app/uploads \
        --network bridge \
        "$REGISTRY/$REPOSITORY:$IMAGE_TAG"
    
    log_success "新容器已启动"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待容器启动
    sleep 10
    
    # 检查容器状态
    if ! docker ps | grep -q $CONTAINER_NAME; then
        log_error "容器启动失败"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    
    # 检查应用健康状态
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/v1/health &>/dev/null; then
            log_success "应用健康检查通过"
            return 0
        fi
        log_info "等待应用启动... ($i/30)"
        sleep 2
    done
    
    log_error "应用健康检查失败"
    docker logs $CONTAINER_NAME
    exit 1
}

# 清理未使用的镜像
cleanup_images() {
    log_info "清理未使用的镜像..."
    docker image prune -f
    log_success "镜像清理完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "🎉 部署完成！"
    echo ""
    echo "📋 部署信息:"
    echo "  - 镜像: $REGISTRY/$REPOSITORY:$IMAGE_TAG"
    echo "  - 容器: $CONTAINER_NAME"
    echo "  - 端口: 3000"
    echo "  - 健康检查: http://localhost:3000/api/v1/health"
    echo ""
    echo "📊 容器状态:"
    docker ps --filter name=$CONTAINER_NAME --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# 主函数
main() {
    log_info "🚀 开始部署 AMTools Backend..."
    
    check_docker
    check_docker_compose
    create_directories
    backup_current_deployment
    pull_image
    stop_old_container
    remove_old_container
    start_new_container
    health_check
    cleanup_images
    show_deployment_info
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
