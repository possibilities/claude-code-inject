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
  defaultMode?: 'default' | 'acceptEdits' | 'plan' | 'bypassPermissions'
}

const GLOBAL_CONFIG_PATHS = [
  join(homedir(), '.config', 'claude-code-inject', 'config.yaml'),
  join(homedir(), '.claude-code-inject', 'config.yaml'),
]

const PROJECT_CONFIG_PATHS = [
  join('.', '.claude-code-inject.yaml'),
  join('.', 'claude-code-inject.yaml'),
]

function mergeConfigs(global: Config, project: Config): Config {
  const merged: Config = { ...global }

  if (project.defaultMode !== undefined) {
    merged.defaultMode = project.defaultMode
  }

  if (project.mcps) {
    merged.mcps = {
      ...(global.mcps || {}),
      ...project.mcps,
    }
  }

  if (project.hooks || global.hooks) {
    merged.hooks = {}

    const allHookTypes = new Set([
      ...Object.keys(global.hooks || {}),
      ...Object.keys(project.hooks || {}),
    ])

    for (const hookType of allHookTypes) {
      const globalHooks = global.hooks?.[hookType] || []
      const projectHooks = project.hooks?.[hookType] || []
      merged.hooks[hookType] = [...globalHooks, ...projectHooks]
    }
  }

  return merged
}

export function loadConfig(): { config: Config; configPath: string } | null {
  let globalConfig: Config | null = null
  let globalConfigPath: string | null = null

  for (const configPath of GLOBAL_CONFIG_PATHS) {
    if (existsSync(configPath)) {
      try {
        const fileContent = readFileSync(configPath, 'utf8')
        globalConfig = YAML.parse(fileContent) as Config
        globalConfigPath = configPath
        break
      } catch (error) {
        throw new Error(
          `Failed to parse global config file at ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
  }

  let projectConfig: Config | null = null
  let projectConfigPath: string | null = null

  for (const configPath of PROJECT_CONFIG_PATHS) {
    if (existsSync(configPath)) {
      try {
        const fileContent = readFileSync(configPath, 'utf8')
        projectConfig = YAML.parse(fileContent) as Config
        projectConfigPath = configPath
        break
      } catch (error) {
        throw new Error(
          `Failed to parse project config file at ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
  }

  if (!globalConfig && !projectConfig) {
    return null
  }

  if (globalConfig && projectConfig) {
    const mergedConfig = mergeConfigs(globalConfig, projectConfig)
    const configPaths = `${globalConfigPath} + ${projectConfigPath}`
    return { config: mergedConfig, configPath: configPaths }
  }

  if (projectConfig) {
    return { config: projectConfig, configPath: projectConfigPath! }
  }

  return { config: globalConfig!, configPath: globalConfigPath! }
}
