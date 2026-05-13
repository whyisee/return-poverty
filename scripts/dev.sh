#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
RUNTIME_DIR="$ROOT_DIR/.runtime"
LOG_DIR="$RUNTIME_DIR/logs"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8101}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-3101}"

mkdir -p "$RUNTIME_DIR" "$LOG_DIR"

usage() {
  cat <<EOF
用法：
  bash scripts/dev.sh setup     安装前后端依赖
  bash scripts/dev.sh start     启动后端和前端
  bash scripts/dev.sh stop      停止后端和前端
  bash scripts/dev.sh restart   重启后端和前端
  bash scripts/dev.sh status    查看服务状态
  bash scripts/dev.sh logs      实时查看日志

环境变量：
  BACKEND_HOST   默认 127.0.0.1
  BACKEND_PORT   默认 8101
  FRONTEND_HOST  默认 127.0.0.1
  FRONTEND_PORT  默认 3101

访问地址：
  前端：http://${FRONTEND_HOST}:${FRONTEND_PORT}
  后端：http://${BACKEND_HOST}:${BACKEND_PORT}
  API 文档：http://${BACKEND_HOST}:${BACKEND_PORT}/docs
EOF
}

is_running() {
  local pid_file="$1"
  if [[ ! -f "$pid_file" ]]; then
    return 1
  fi

  local pid
  pid="$(cat "$pid_file")"
  [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1
}

ensure_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "缺少命令：$command_name"
    exit 1
  fi
}

setup_backend() {
  ensure_command python3

  if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
    echo "创建后端虚拟环境..."
    python3 -m venv "$BACKEND_DIR/.venv"
  fi

  echo "安装后端依赖..."
  "$BACKEND_DIR/.venv/bin/python" -m pip install --upgrade pip
  "${BACKEND_DIR}/.venv/bin/pip" install -e "${BACKEND_DIR}[dev]"
}

setup_frontend() {
  ensure_command npm

  echo "安装前端依赖..."
  cd "$FRONTEND_DIR"
  npm install
}

setup_all() {
  setup_backend
  setup_frontend
  echo "依赖安装完成。"
}

start_backend() {
  if is_running "$BACKEND_PID_FILE"; then
    echo "后端已在运行，PID：$(cat "$BACKEND_PID_FILE")"
    return
  fi

  if [[ ! -x "$BACKEND_DIR/.venv/bin/uvicorn" ]]; then
    echo "后端依赖未安装，请先执行：bash scripts/dev.sh setup"
    exit 1
  fi

  echo "启动后端..."
  cd "$BACKEND_DIR"
  nohup "$BACKEND_DIR/.venv/bin/uvicorn" app.main:app \
    --host "$BACKEND_HOST" \
    --port "$BACKEND_PORT" \
    >"$BACKEND_LOG" 2>&1 &
  echo $! > "$BACKEND_PID_FILE"
  echo "后端已启动，PID：$(cat "$BACKEND_PID_FILE")，日志：${BACKEND_LOG}"
}

start_frontend() {
  if is_running "$FRONTEND_PID_FILE"; then
    echo "前端已在运行，PID：$(cat "$FRONTEND_PID_FILE")"
    return
  fi

  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    echo "前端依赖未安装，请先执行：bash scripts/dev.sh setup"
    exit 1
  fi

  echo "启动前端..."
  cd "$FRONTEND_DIR"
  nohup npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" \
    >"$FRONTEND_LOG" 2>&1 &
  echo $! > "$FRONTEND_PID_FILE"
  echo "前端已启动，PID：$(cat "$FRONTEND_PID_FILE")，日志：${FRONTEND_LOG}"
}

start_all() {
  start_backend
  start_frontend
  echo
  echo "服务启动完成："
  echo "  前端：http://${FRONTEND_HOST}:${FRONTEND_PORT}"
  echo "  后端：http://${BACKEND_HOST}:${BACKEND_PORT}"
  echo "  API 文档：http://${BACKEND_HOST}:${BACKEND_PORT}/docs"
}

stop_one() {
  local name="$1"
  local pid_file="$2"

  if ! is_running "$pid_file"; then
    echo "${name} 未运行。"
    rm -f "$pid_file"
    return
  fi

  local pid
  pid="$(cat "$pid_file")"
  echo "停止 ${name}，PID：${pid}"
  kill "$pid" >/dev/null 2>&1 || true

  for _ in {1..20}; do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      rm -f "$pid_file"
      echo "${name} 已停止。"
      return
    fi
    sleep 0.2
  done

  echo "${name} 未正常退出，尝试强制停止。"
  kill -9 "$pid" >/dev/null 2>&1 || true
  rm -f "$pid_file"
}

stop_all() {
  stop_one "前端" "$FRONTEND_PID_FILE"
  stop_one "后端" "$BACKEND_PID_FILE"
}

status_one() {
  local name="$1"
  local pid_file="$2"
  local url="$3"

  if is_running "$pid_file"; then
    echo "${name}：运行中，PID：$(cat "$pid_file")，地址：${url}"
  else
    echo "${name}：未运行"
  fi
}

status_all() {
  status_one "后端" "$BACKEND_PID_FILE" "http://${BACKEND_HOST}:${BACKEND_PORT}"
  status_one "前端" "$FRONTEND_PID_FILE" "http://${FRONTEND_HOST}:${FRONTEND_PORT}"
}

show_logs() {
  touch "$BACKEND_LOG" "$FRONTEND_LOG"
  tail -f "$BACKEND_LOG" "$FRONTEND_LOG"
}

case "${1:-}" in
  setup)
    setup_all
    ;;
  start)
    start_all
    ;;
  stop)
    stop_all
    ;;
  restart)
    stop_all
    start_all
    ;;
  status)
    status_all
    ;;
  logs)
    show_logs
    ;;
  -h|--help|help|"")
    usage
    ;;
  *)
    echo "未知命令：$1"
    usage
    exit 1
    ;;
esac
