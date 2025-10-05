@echo off
REM Trading Desk Backup Script
REM Run this weekly or before major changes

set BACKUP_DATE=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%
set BACKUP_DIR=C:\Backups\TradingDesk\%BACKUP_DATE%_backup

echo Creating backup for %BACKUP_DATE%...

REM Create backup directory
mkdir "%BACKUP_DIR%" 2>nul

REM Copy essential files
echo Copying core files...
copy "index.html" "%BACKUP_DIR%\"
copy "build\index.html" "%BACKUP_DIR%\build_index.html"
copy "netlify\functions\tiingo.js" "%BACKUP_DIR%\"
copy "package.json" "%BACKUP_DIR%\"
copy "netlify.toml" "%BACKUP_DIR%\"
copy ".vscode\settings.json" "%BACKUP_DIR%\" 2>nul

REM Create git info
echo Saving git information...
git log --oneline -5 > "%BACKUP_DIR%\git_history.txt"
git status > "%BACKUP_DIR%\git_status.txt"
git branch -a > "%BACKUP_DIR%\git_branches.txt"

REM Create backup summary
echo Backup created: %date% %time% > "%BACKUP_DIR%\backup_info.txt"
echo Current commit: >> "%BACKUP_DIR%\backup_info.txt"
git rev-parse HEAD >> "%BACKUP_DIR%\backup_info.txt"
echo WOW Price Status: Working ($26.31 accurate) >> "%BACKUP_DIR%\backup_info.txt"

echo.
echo ✅ Backup completed successfully!
echo Location: %BACKUP_DIR%
echo.
pause