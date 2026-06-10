<#
  Registers the Windows scheduled task "CyclopsDailySync" to run the daily
  Watchtower sync every morning at 08:00 as the current user.
  Run once:  pwsh ./scripts/register-daily-sync.ps1
  Remove:    Unregister-ScheduledTask -TaskName CyclopsDailySync -Confirm:$false

  INTERIM (Windows). Migrates to Ubuntu cron when the server is ready (backlog).
#>
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$script = Join-Path $repo 'scripts\daily-sync.ps1'

$action  = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Daily -At 8:00am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 15)

Register-ScheduledTask -TaskName 'CyclopsDailySync' -Action $action -Trigger $trigger `
    -Settings $settings -Description 'Cyclops OS: daily GitHub project-follow sync (Watchtower)' -Force | Out-Null

Write-Host "Registered task 'CyclopsDailySync' - daily 08:00 (StartWhenAvailable)." -ForegroundColor Green
