# One-time setup: registers a Windows Scheduled Task that runs
# daily-feedback.ps1 every day at 7:00 AM. WakeToRun wakes the PC from
# sleep to run the task (it can go back to sleep after) — this requires
# "Allow wake timers" to be enabled for your power plan (see README). If
# the PC is fully shut down (not just asleep), nothing can wake it, and
# StartWhenAvailable runs the missed task next time it's turned on.
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
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun `
    -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask -TaskName 'Substack Daily Feedback' `
    -Action $Action -Trigger $Trigger -Settings $Settings -Force | Out-Null

Write-Host "Scheduled task 'Substack Daily Feedback' registered for 7:00 AM daily."
Write-Host "Reports will land in D:\Claude\SubStack\Substack\SubStack Report\"
Write-Host "Test it now with: Start-ScheduledTask -TaskName 'Substack Daily Feedback'"
