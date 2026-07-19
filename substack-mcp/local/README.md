# Local daily feedback (Windows Task Scheduler)

Runs the "honest editor" report on your own PC, writing a markdown file to
`D:\Claude\SubStack\Substack\SubStack Report\YYYY-MM-DD.md` — one file per
day, so other Claude sessions (e.g. a strategy session) can read the whole
history from disk. Change the `$ReportDir` variable at the top of
`daily-feedback.ps1` if your strategy session reads a different folder.

## Prerequisites

- Claude Code CLI installed and logged in (`npm install -g @anthropic-ai/claude-code`)
- The substack MCP server registered at user scope:

  ```
  claude mcp add substack --scope user --env SUBSTACK_HOSTNAME=bccody.substack.com -- node C:\Users\blake\book\substack-mcp\dist\index.js
  ```

  To include Notes/drafts, add `--env SUBSTACK_COOKIE=substack.sid=...` and
  `--env SUBSTACK_USER_ID=...` to that command.

## Setup (once)

```powershell
cd C:\Users\blake\book\substack-mcp\local
.\setup-task.ps1
```

The task is set to wake a sleeping PC to run (`WakeToRun`), so it fires at
7:00 AM even if the machine was asleep — but only if wake timers are allowed
by your power plan:

1. Settings → System → Power & battery → Additional power settings (or
   `powercfg.cpl`) → your plan → **Change plan settings** → **Change
   advanced power settings**.
2. Expand **Sleep** → **Allow wake timers** → set to **Enable** (for both
   "On battery" and "Plugged in" if you want it to work either way).

Without that setting, sleep blocks the wake and the task falls back to
running as soon as you next wake the PC yourself (see Notes below).

## Test immediately

```powershell
Start-ScheduledTask -TaskName 'Substack Daily Feedback'
# then check D:\Claude\SubStack\Substack\SubStack Report\ for today's file
```

## Notes

- **Locked screen, PC powered on:** runs fine, no action needed.
- **Asleep, with wake timers allowed:** the PC wakes itself at 7:00 AM,
  runs the report, and can go back to sleep after.
- **Asleep, wake timers not allowed:** the task doesn't run at 7:00 AM;
  `StartWhenAvailable` runs it the next time you wake the PC yourself.
- **Fully shut down:** nothing can run it — that day is skipped entirely.
  Shutting down (vs. sleep) is the one state this can't cover.
- Change the time by editing the task in Task Scheduler, or re-running
  setup-task.ps1 after editing the `-At 7:00AM` line.
- Remove with `Unregister-ScheduledTask -TaskName 'Substack Daily Feedback'`.
- If you already registered the task before this update, re-run
  `.\setup-task.ps1` once to pick up the WakeToRun setting (it overwrites
  the existing task with `-Force`).
