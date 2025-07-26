# Claude Code Inject

[![npm version](https://badge.fury.io/js/claude-code-inject.svg)](https://www.npmjs.com/package/claude-code-inject)

Inject hooks, mcps, and default mode into the next `claude` invocation

## Usage

Run this command or create an alias for running `claude`:

```bash
claude-code-inject && claude --mcp-config ./.claude/inject-mcps.json
```

This will run the claude with any hooks, mcps, and default mode settings present in a user level or project level config file. This is my configuration that 1) Uses hooks to log everything to sqlite and run in yolo mode, 2) includes some generally useful MCPs, and 3) Sets my default mode to `plan`. The script is careful to not add or change anything that causes a diff in your git repo.

Important note: This approach assumes that you are not using the `.claude/` directory of your projects and that you are git ignoring it (in `.gitignore` or `~/.gitignore_global`). `claude-code-inject` takes control of this directory and leaves it dirty when done. Maybe a more sophisticated approach is possible but for now this shouldn't be used in projects that rely on the contents of `.claude/`.

```
▶ cat ~/.claude-code-inject/config.yaml
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
