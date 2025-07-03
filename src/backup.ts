import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from 'fs'
import { join } from 'path'

export interface BackupInfo {
  timestamp: string
  files: {
    [filePath: string]: {
      existed: boolean
      originalContent?: string
    }
  }
}

const BACKUP_DIR = join('.claude', 'inject-backups')
const BACKUP_FILE = join(BACKUP_DIR, 'backup-info.json')

export function ensureBackupDir(): void {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

export function saveBackupInfo(info: BackupInfo): void {
  ensureBackupDir()
  writeFileSync(BACKUP_FILE, JSON.stringify(info, null, 2))
}

export function loadBackupInfo(): BackupInfo | null {
  if (!existsSync(BACKUP_FILE)) {
    return null
  }
  try {
    const content = readFileSync(BACKUP_FILE, 'utf8')
    return JSON.parse(content) as BackupInfo
  } catch (error) {
    throw new Error(
      `Failed to load backup info: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export function backupFile(filePath: string): {
  existed: boolean
  originalContent?: string
} {
  if (existsSync(filePath)) {
    const originalContent = readFileSync(filePath, 'utf8')
    return {
      existed: true,
      originalContent,
    }
  }
  return {
    existed: false,
  }
}

export function clearBackupInfo(): void {
  if (existsSync(BACKUP_FILE)) {
    unlinkSync(BACKUP_FILE)
  }
}
