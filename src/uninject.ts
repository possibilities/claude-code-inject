import {
  readFileSync,
  writeFileSync,
  existsSync,
  unlinkSync,
  rmdirSync,
  readdirSync,
  copyFileSync,
} from 'fs'
import { join } from 'path'

const CLAUDE_DIR = '.claude'
const INJECT_MCPS_FILE = join(CLAUDE_DIR, 'inject-mcps.json')
const SETTINGS_FILE = join(CLAUDE_DIR, 'settings.local.json')
const SETTINGS_BACKUP_FILE = join(CLAUDE_DIR, 'settings.local.backup.json')
const GITIGNORE_FILE = join(CLAUDE_DIR, '.gitignore')

const GITIGNORE_ENTRIES = [
  'inject-mcps.json',
  'settings.local.json',
  'settings.local.backup.json',
  '.gitignore',
]

function removeFromGitignore(): void {
  if (!existsSync(GITIGNORE_FILE)) {
    return
  }

  const content = readFileSync(GITIGNORE_FILE, 'utf8')
  const lines = content.split('\n').filter(line => line.trim())

  const remainingLines = lines.filter(line => !GITIGNORE_ENTRIES.includes(line))

  if (remainingLines.length === 0) {
    unlinkSync(GITIGNORE_FILE)
    console.log(`✓ Removed ${GITIGNORE_FILE}`)
  } else {
    writeFileSync(GITIGNORE_FILE, remainingLines.join('\n') + '\n')
    console.log(`✓ Updated ${GITIGNORE_FILE}`)
  }
}

export function uninject(): void {
  let changesFound = false

  if (existsSync(SETTINGS_BACKUP_FILE)) {
    if (existsSync(SETTINGS_FILE)) {
      unlinkSync(SETTINGS_FILE)
    }
    copyFileSync(SETTINGS_BACKUP_FILE, SETTINGS_FILE)
    unlinkSync(SETTINGS_BACKUP_FILE)
    console.log(`✓ Restored ${SETTINGS_FILE}`)
    changesFound = true
  }

  if (existsSync(INJECT_MCPS_FILE)) {
    unlinkSync(INJECT_MCPS_FILE)
    console.log(`✓ Removed ${INJECT_MCPS_FILE}`)
    changesFound = true
  }

  removeFromGitignore()

  if (existsSync(CLAUDE_DIR)) {
    try {
      const files = readdirSync(CLAUDE_DIR)
      if (files.length === 0) {
        rmdirSync(CLAUDE_DIR)
        console.log(`✓ Removed empty ${CLAUDE_DIR} directory`)
      }
    } catch {}
  }

  if (changesFound) {
    console.log('✓ Uninjection complete')
  } else {
    console.log('No injected files found. Nothing to uninject.')
  }
}
