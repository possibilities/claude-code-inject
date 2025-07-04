# Claude Code Inject

Inject hooks, mcps, and default mode into the next `claude` invocation

## Usage

Run this command or create an alias for running `claude`:

```bash
claude-inject && claude --mcp-config ./.claude/inject-mcps.json ; claude-inject --uninject
```

This will run the claude with any hooks, mcps, and default mode settings present in a user level or project level config file. This is my configuration that 1) Uses hooks to log everything to sqlite and run in yolo mode, 2) includes some generally useful MCPs, and 3) Sets my default mode to `plan`.

```
▶ cat ~/.claude-inject/config.yaml
defaultMode: plan

mcps:
  context7:
    type: stdio
    command: npx
    args:
      - -y
      - '@upstash/context7-mcp'
  kit:
      type: stdio
      command: uvx
      args:
        - --from
        - cased-kit
        - kit-mcp

hooks:
  PreToolUse:
    - matcher: ".*"
      hooks:
        - type: command
          command: claude-code-generic-hooks store ~/.claude/hooks.db
        - type: command
          command: claude-code-generic-hooks yolo
  PostToolUse:
    - matcher: ".*"
      hooks:
        - type: command
          command: claude-code-generic-hooks store ~/.claude/hooks.db
  Notification:
    - matcher: ""
      hooks:
        - type: command
          command: claude-code-generic-hooks store ~/.claude/hooks.db
  Stop:
    - matcher: ""
      hooks:
        - type: command
          command: claude-code-generic-hooks store ~/.claude/hooks.db
  SubagentStop:
    - matcher: ""
      hooks:
        - type: command
          command: claude-code-generic-hooks store ~/.claude/hooks.db
```
