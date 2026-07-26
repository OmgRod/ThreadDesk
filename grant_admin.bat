@echo off
setlocal

:: Path to the env file
set ENV_FILE=backend\.env.example

:: Find the line with DATABASE_URL
for /f "tokens=2 delims==" %%a in ('findstr /C:"DATABASE_URL" "%ENV_FILE%"') do set DB_URL=%%a

:: Extracting is complex in Batch, we will use a small PowerShell snippet to parse it
for /f "delims=" %%a in ('powershell -Command "$url = '%DB_URL%'; $uri = [System.Uri]$url; Write-Output $uri.UserInfo, $uri.Host, $uri.Port, $uri.AbsolutePath.Substring(1)"') do (
    set "USER_PASS=%%a"
)

:: The userInfo is 'user:password'
for /f "tokens=1,2 delims=:" %%a in ("%USER_PASS%") do (
    set DB_USER=%%a
    set DB_PASS=%%b
)

:: The rest of the URI details... this is tricky in pure batch.
:: Using PowerShell to execute the command directly is safer and cleaner.

set /p user_id="Enter your ThreadDesk User ID to grant admin access: "

powershell -Command "$dbUrl = '%DB_URL%'; $uri = [System.Uri]$dbUrl; $user = $uri.UserInfo.Split(':')[0]; $pass = $uri.UserInfo.Split(':')[1]; $db = $uri.AbsolutePath.Substring(1); $env:PGPASSWORD=$pass; docker exec -it threaddesk-db psql -U $user -d $db -c 'UPDATE users SET is_admin = true WHERE id = %user_id%;'"

echo Admin access granted to user %user_id%.
pause
