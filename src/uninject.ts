import {
  writeFileSync,
  existsSync,
  unlinkSync,
  rmdirSync,
  readdirSync,
} from 'fs'
import { dirname, join } from 'path'
import { loadBackupInfo, clearBackupInfo } from './backup.js'

export function uninject(): void {
  const backupInfo = loadBackupInfo()

  if (!backupInfo) {
    console.log('No backup information found. Nothing to uninject.')
    return
  }

  console.log(`Restoring from backup created at: ${backupInfo.timestamp}`)

  for (const [filePath, fileInfo] of Object.entries(backupInfo.files)) {
    if (fileInfo.existed && fileInfo.originalContent !== undefined) {
      writeFileSync(filePath, fileInfo.originalContent)
      console.log(`✓ Restored ${filePath}`)
    } else if (!fileInfo.existed && existsSync(filePath)) {
      unlinkSync(filePath)
      console.log(`✓ Removed ${filePath}`)

      try {
        const dir = dirname(filePath)
        if (existsSync(dir) && dir !== '.') {
          const files = readdirSync(dir)
          if (files.length === 0) {
            rmdirSync(dir)
            console.log(`✓ Removed empty directory ${dir}`)
          }
        }
      } catch {}
    }
  }

  clearBackupInfo()

  try {
    const backupDir = join('.claude', 'inject-backups')
    if (existsSync(backupDir)) {
      const files = readdirSync(backupDir)
      if (files.length === 0) {
        rmdirSync(backupDir)
        console.log(`✓ Removed empty backup directory`)
      }
    }

    const claudeDir = '.claude'
    if (existsSync(claudeDir)) {
      const files = readdirSync(claudeDir)
      if (files.length === 0) {
        rmdirSync(claudeDir)
        console.log(`✓ Removed empty .claude directory`)
      }
    }
  } catch {}

  console.log('✓ Uninjection complete')
}
