import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
} from 'fs'
import { join, resolve } from 'path'
import { homedir } from 'os'
import { Config } from './config.js'

const CLAUDE_DIR = '.claude'
const INJECT_MCPS_FILE = join(CLAUDE_DIR, 'inject-mcps.json')
const SETTINGS_FILE = join(CLAUDE_DIR, 'settings.local.json')
const SETTINGS_BACKUP_FILE = join(CLAUDE_DIR, 'settings.local.backup.json')
const GITIGNORE_FILE = join(CLAUDE_DIR, '.gitignore')

const GITIGNORE_ENTRIES = ['inject-mcps.json', 'settings.local.json']

function ensureClaudeDir(): void {
  if (!existsSync(CLAUDE_DIR)) {
    mkdirSync(CLAUDE_DIR, { recursive: true })
  }
}

function updateGitignore(): void {
  ensureClaudeDir()

  let existingContent: string[] = []
  if (existsSync(GITIGNORE_FILE)) {
    existingContent = readFileSync(GITIGNORE_FILE, 'utf8')
      .split('\n')
      .filter(line => line.trim())
  }

  const uniqueEntries = new Set([...existingContent, ...GITIGNORE_ENTRIES])
  const newContent = Array.from(uniqueEntries).join('\n') + '\n'

  writeFileSync(GITIGNORE_FILE, newContent)
}

function updateClaudeConfig(): void {
  const claudeConfigPath = join(homedir(), '.claude.json')
  let claudeConfig: any = {}

  if (existsSync(claudeConfigPath)) {
    const existingContent = readFileSync(claudeConfigPath, 'utf8')
    claudeConfig = JSON.parse(existingContent)
  }

  if (!claudeConfig.projects) {
    claudeConfig.projects = {}
  }

  const projectPath = resolve(process.cwd())

  if (!claudeConfig.projects[projectPath]) {
    claudeConfig.projects[projectPath] = {
      allowedTools: [],
    }
  }

  claudeConfig.projects[projectPath].hasTrustDialogAccepted = true

  writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2))
}

export function inject(config: Config): void {
  ensureClaudeDir()

  if (config.mcps) {
    const mcpJson = { mcpServers: config.mcps }
    writeFileSync(INJECT_MCPS_FILE, JSON.stringify(mcpJson, null, 2))
    console.log(`✓ Created ${INJECT_MCPS_FILE}`)
  }

  if (existsSync(SETTINGS_FILE)) {
    copyFileSync(SETTINGS_FILE, SETTINGS_BACKUP_FILE)
    console.log(`✓ Backed up ${SETTINGS_FILE}`)
  }

  if (config.defaultMode || config.hooks) {
    let settings: any = {}

    if (existsSync(SETTINGS_FILE)) {
      const existingContent = readFileSync(SETTINGS_FILE, 'utf8')
      settings = JSON.parse(existingContent)
    }

    if (config.defaultMode) {
      if (!settings.permissions) {
        settings.permissions = {}
      }
      settings.permissions.defaultMode = config.defaultMode
    }

    if (config.hooks) {
      settings.hooks = config.hooks
    }

    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))

    console.log(`✓ Updated ${SETTINGS_FILE}`)
    if (config.defaultMode) {
      console.log(`  ✓ Set default mode to \`${config.defaultMode}\``)
    }
    if (config.hooks) {
      const hookCount = Object.values(config.hooks).reduce(
        (acc, matchers) => acc + matchers.length,
        0,
      )
      console.log(`  ✓ Added ${hookCount}x hooks`)
    }
  }

  updateGitignore()
  console.log(`✓ Updated ${GITIGNORE_FILE}`)

  updateClaudeConfig()
  console.log(`✓ Pre-accepted trust dialog for ${resolve(process.cwd())}`)

  console.log('✓ Injection complete')
}
