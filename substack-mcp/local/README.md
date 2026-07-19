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

## Test immediately

```powershell
Start-ScheduledTask -TaskName 'Substack Daily Feedback'
# then check D:\Claude\SubStack\Substack\SubStack Report\ for today's file
```

## Notes

- If the PC is asleep at 7:00 AM, the task runs as soon as it wakes
  (StartWhenAvailable). If the PC is off all day, that day is skipped.
- Change the time by editing the task in Task Scheduler, or re-running
  setup-task.ps1 after editing the `-At 7:00AM` line.
- Remove with `Unregister-ScheduledTask -TaskName 'Substack Daily Feedback'`.
