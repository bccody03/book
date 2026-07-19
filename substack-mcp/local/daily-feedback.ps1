# Daily Substack feedback — local version.
# Runs Claude Code headless with the substack MCP server and writes the
# report to Documents\substack-feedback\YYYY-MM-DD.md.
# Scheduled by setup-task.ps1; can also be run by hand any time.

$ErrorActionPreference = 'Stop'

# Where reports land — set this to the folder your strategy session reads.
$ReportDir = 'D:\substack-feedback'
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$OutFile = Join-Path $ReportDir ((Get-Date -Format 'yyyy-MM-dd') + '.md')

$Prompt = @'
Read my Substack and write an honest editorial feedback report. Use the
substack MCP tools: list_posts for recent posts, get_post for full text,
list_comments for reader comments, and list_notes if it works (skip notes
silently if it errors — the cookie may not be configured).

Read the 3-5 most recent posts in full, plus their comments and reactions.

Be a sharp, honest editor — direct, specific, never flattering for its own
sake. Cover:
1. What's landing — strongest recent piece and why; engagement signals.
2. What's weak — argument holes, flabby prose, structural problems. Quote
   short specific passages when criticizing; vague criticism is useless.
3. Reader signals — what commenters respond to vs. ignore; unanswered
   comments worth replying to.
4. Do next — 2-3 concrete suggestions (topics, revisions, posting habits).

Keep it under 800 words. Skip sections with nothing new to say.
Output ONLY the report in markdown — no preamble, no closing questions.
'@

$Tools = @(
    'mcp__substack__list_posts'
    'mcp__substack__get_post'
    'mcp__substack__list_comments'
    'mcp__substack__get_profile'
    'mcp__substack__list_notes'
    'mcp__substack__list_drafts'
) -join ','

claude -p $Prompt --allowedTools $Tools |
    Out-File -FilePath $OutFile -Encoding utf8

Write-Host "Report written to $OutFile"
