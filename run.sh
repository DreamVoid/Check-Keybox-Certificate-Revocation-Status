#!/bin/bash
# 激活当前目录下的venv并运行checker.py
VENV_DIR="$(dirname "$0")/venv"
REQ_FILE="$(dirname "$0")/requirements.txt"
if [ ! -d "$VENV_DIR" ]; then
    echo "未找到venv目录，正在自动创建虚拟环境..."
    python3 -m venv --system-site-packages "$VENV_DIR"
    if [ $? -ne 0 ]; then
        echo "创建虚拟环境失败，请检查Python环境。"
        exit 1
    fi
    source "$VENV_DIR/bin/activate"
    if [ -f "$REQ_FILE" ]; then
        echo "正在安装依赖..."
        pip install -r "$REQ_FILE"
    fi
else
    source "$VENV_DIR/bin/activate"
fi
clear
python3 "$(dirname "$0")/checker.py" "$@"
