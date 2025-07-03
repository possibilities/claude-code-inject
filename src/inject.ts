import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { Config } from './config.js'
import { BackupInfo, backupFile, saveBackupInfo } from './backup.js'

interface McpServerConfig {
  type: string
  command: string
  args?: string[]
  env?: Record<string, string>
}

interface McpJson {
  mcpServers: Record<string, McpServerConfig>
}

interface ClaudeSettings {
  permissions?: {
    defaultMode?: string
  }
  hooks?: Record<string, any>
}

const MCP_FILE = '.mcp.json'
const SETTINGS_FILE = join('.claude', 'settings.local.json')

function ensureDirectory(filePath: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function mergeDeep(target: any, source: any): any {
  const result = { ...target }
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = mergeDeep(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

export function inject(config: Config): void {
  const backupInfo: BackupInfo = {
    timestamp: new Date().toISOString(),
    files: {},
  }

  if (config.mcps) {
    backupInfo.files[MCP_FILE] = backupFile(MCP_FILE)

    let mcpJson: McpJson = { mcpServers: {} }
    if (existsSync(MCP_FILE)) {
      const existingContent = readFileSync(MCP_FILE, 'utf8')
      try {
        mcpJson = JSON.parse(existingContent)
      } catch {
        mcpJson = { mcpServers: {} }
      }
    }

    mcpJson.mcpServers = mergeDeep(mcpJson.mcpServers, config.mcps)

    writeFileSync(MCP_FILE, JSON.stringify(mcpJson, null, 2))
    console.log(`✓ Updated ${MCP_FILE}`)
  }

  if (config.hooks || config.mode) {
    backupInfo.files[SETTINGS_FILE] = backupFile(SETTINGS_FILE)

    let settings: ClaudeSettings = {}
    if (existsSync(SETTINGS_FILE)) {
      const existingContent = readFileSync(SETTINGS_FILE, 'utf8')
      try {
        settings = JSON.parse(existingContent)
      } catch {
        settings = {}
      }
    }

    ensureDirectory(SETTINGS_FILE)

    if (config.mode) {
      if (!settings.permissions) {
        settings.permissions = {}
      }
      settings.permissions.defaultMode = config.mode
    }

    if (config.hooks) {
      settings.hooks = mergeDeep(settings.hooks || {}, config.hooks)
    }

    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
    console.log(`✓ Updated ${SETTINGS_FILE}`)
  }

  saveBackupInfo(backupInfo)
  console.log('✓ Injection complete')
}
