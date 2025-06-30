@chcp 65001
@echo off
REM 激活当前目录下的venv并运行checker.py
setlocal
set VENV_DIR=%~dp0venv
set REQ_FILE=%~dp0requirements.txt
if not exist "%VENV_DIR%" (
    echo 未找到venv目录，正在自动创建虚拟环境...
    python -m venv --system-site-packages "%VENV_DIR%"
    if errorlevel 1 (
        echo 创建虚拟环境失败，请检查Python环境。
        exit /b 1
    )
    call "%VENV_DIR%\Scripts\activate.bat"
    if exist "%REQ_FILE%" (
        echo 正在安装依赖...
        pip install -r "%REQ_FILE%"
    )
) else (
    call "%VENV_DIR%\Scripts\activate.bat"
)
cls
python "%~dp0checker.py" %*
endlocal
pause