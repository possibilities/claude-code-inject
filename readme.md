# Claude Code Inject

Inject hooks, mcps, and default mode into the next `claude` invocation

## Usage

Run this command or create an alias for running `claude`:

```bash
claude-code-inject && claude --mcp-config ./.claude/inject-mcps.json
```

This will run the claude with any hooks, mcps, and default mode settings present in a user level or project level config file. This is my configuration that 1) Uses hooks to log everything to sqlite and run in yolo mode, 2) includes some generally useful MCPs, and 3) Sets my default mode to `plan`. The script is careful to not add or change anything that causes a diff in your git repo.

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

### Uninjecting

To uninject the hooks, mcps, and default mode, you can run:

```bash
claude-code-inject && claude --mcp-config ./.claude/inject-mcps.json ; claude-inject --uninject
```

This is only needed if you want to make the environment exactly as it was before running running `claude-code-inject`. All the changes it makes will be `.gitignore`ed (via a `.gitignore` in `./.claude` directory) so generally this is not needed unless you want it to restore changes to `./.claude/settings.local.json`.
