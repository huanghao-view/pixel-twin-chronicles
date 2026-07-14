#!/bin/sh
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "未检测到 Python 3，请先安装后重新运行。"
  printf "按回车键关闭……"
  read -r _
  exit 1
fi

if command -v open >/dev/null 2>&1; then
  open "http://127.0.0.1:8000/"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://127.0.0.1:8000/" >/dev/null 2>&1 &
fi

echo "离线网站已启动：http://127.0.0.1:8000/"
echo "按 Ctrl+C 停止。"
python3 -m http.server 8000
