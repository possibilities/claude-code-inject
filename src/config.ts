import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import YAML from 'yaml'

export interface McpConfig {
  type: string
  command: string
  args?: string[]
  env?: Record<string, string>
}

export interface HookCommand {
  type: string
  command: string
}

export interface HookMatcher {
  matcher: string
  hooks: HookCommand[]
}

export interface Config {
  mcps?: Record<string, McpConfig>
  hooks?: Record<string, HookMatcher[]>
  mode?: string
}

const CONFIG_SEARCH_PATHS = [
  join(homedir(), '.config', 'claude-code-inject', 'config.yaml'),
  join(homedir(), '.claude-code-inject', 'config.yaml'),
  join('.', '.claude-code-inject.yaml'),
  join('.', 'claude-code-inject.yaml'),
]

export function loadConfig(): { config: Config; configPath: string } | null {
  for (const configPath of CONFIG_SEARCH_PATHS) {
    if (existsSync(configPath)) {
      try {
        const fileContent = readFileSync(configPath, 'utf8')
        const config = YAML.parse(fileContent) as Config
        return { config, configPath }
      } catch (error) {
        throw new Error(
          `Failed to parse config file at ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
  }
  return null
}
