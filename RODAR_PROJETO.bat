@echo off
echo ==========================================
echo INICIANDO M_at_A_R - TRIPTICO AMBIENTAL
echo ==========================================
echo.

:: Verifica se o Bun esta instalado
where bun >nul 2>nul
if %errorlevel% == 0 (
    echo [INFO] Bun detectado. Usando Bun para rodar o projeto...
    if not exist node_modules (
        echo [INFO] Instalando dependencias com Bun...
        bun install
    )
    echo [INFO] Iniciando servidor...
    bun dev
    goto :end
)

:: Verifica se o Node/NPM esta instalado
where npm >nul 2>nul
if %errorlevel% == 0 (
    echo [INFO] Node/NPM detectado. Usando NPM para rodar o projeto...
    if not exist node_modules (
        echo [INFO] Instalando dependencias com NPM...
        npm install
    )
    echo [INFO] Iniciando servidor...
    npm run dev
    goto :end
)

echo [ERRO] Nao foi possivel encontrar o Bun ou o Node.js/NPM no seu sistema.
echo.
echo Para rodar este projeto localmente, voce precisa instalar o Node.js.
echo Baixe em: https://nodejs.org/
echo.
pause

:end
pause
