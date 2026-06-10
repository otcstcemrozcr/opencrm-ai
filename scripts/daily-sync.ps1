<#
  Cyclops daily Watchtower sync (Windows, INTERIM).
  Pulls every registered product's project-follow from GitHub, refreshes memory,
  validates, and regenerates the index. Logs to logs/sync.log.

  Scheduled via scripts/register-daily-sync.ps1 (task "CyclopsDailySync").
  NOTE: This is the interim Windows mechanism. It will move to an Ubuntu cron job
  once the server is provisioned (see docs/issues/BACKLOG.md).
#>
$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

$python = "C:\Users\ozcir\AppData\Local\Programs\Python\Python314\python.exe"
$env:Path = "C:\Program Files\GitHub CLI;" + $env:Path   # ensure gh is reachable

$logDir = Join-Path $repo 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$log = Join-Path $logDir 'sync.log'
$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8   # read python's UTF-8 cleanly

"==== $stamp  Cyclops daily sync ====" | Out-File -FilePath $log -Append -Encoding utf8
& $python tools/cyclops.py sync       2>&1 | Out-File -FilePath $log -Append -Encoding utf8
& $python tools/cyclops.py index      2>&1 | Out-File -FilePath $log -Append -Encoding utf8
& $python tools/cyclops.py validate   2>&1 | Out-File -FilePath $log -Append -Encoding utf8
& $python tools/cyclops.py brief --email 2>&1 | Out-File -FilePath $log -Append -Encoding utf8
if ((Get-Date).DayOfWeek -eq 'Sunday') {
    & $python tools/cyclops.py weekly --email 2>&1 | Out-File -FilePath $log -Append -Encoding utf8
}
"" | Out-File -FilePath $log -Append -Encoding utf8
