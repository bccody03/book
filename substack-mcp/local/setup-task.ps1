# One-time setup: registers a Windows Scheduled Task that runs
# daily-feedback.ps1 every day at 7:00 AM. If the PC is asleep or off at
# 7:00, StartWhenAvailable runs it as soon as the machine is next awake.
# Run this once from PowerShell:  .\setup-task.ps1
# Remove later with:  Unregister-ScheduledTask -TaskName 'Substack Daily Feedback'

$ErrorActionPreference = 'Stop'

$ScriptPath = Join-Path $PSScriptRoot 'daily-feedback.ps1'
if (-not (Test-Path $ScriptPath)) {
    throw "daily-feedback.ps1 not found next to this script."
}

$Action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
$Trigger = New-ScheduledTaskTrigger -Daily -At 7:00AM
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
    -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask -TaskName 'Substack Daily Feedback' `
    -Action $Action -Trigger $Trigger -Settings $Settings -Force | Out-Null

Write-Host "Scheduled task 'Substack Daily Feedback' registered for 7:00 AM daily."
Write-Host "Reports will land in $env:USERPROFILE\Documents\substack-feedback\"
Write-Host "Test it now with: Start-ScheduledTask -TaskName 'Substack Daily Feedback'"
