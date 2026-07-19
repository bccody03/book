# Local daily feedback (Windows Task Scheduler)

Runs the same "honest editor" report as the cloud Routine, but on your own
PC, writing a markdown file to `Documents\substack-feedback\YYYY-MM-DD.md`.

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
# then check Documents\substack-feedback\ for today's file
```

## Notes

- If the PC is asleep at 7:00 AM, the task runs as soon as it wakes
  (StartWhenAvailable). If the PC is off all day, that day is skipped.
- Change the time by editing the task in Task Scheduler, or re-running
  setup-task.ps1 after editing the `-At 7:00AM` line.
- Remove with `Unregister-ScheduledTask -TaskName 'Substack Daily Feedback'`.
