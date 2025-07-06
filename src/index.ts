import { Command } from 'commander'
import packageJson from '../package.json' assert { type: 'json' }
import { loadConfig } from './config.js'
import { inject } from './inject.js'
import { uninject } from './uninject.js'

async function main() {
  const program = new Command()

  program
    .name('claude-code-inject')
    .description('Claude Code Inject CLI')
    .version(packageJson.version)
    .option('--uninject', 'Remove all injected files and restore originals')
    .action(options => {
      try {
        if (options.uninject) {
          uninject()
        } else {
          const result = loadConfig()
          if (!result) {
            console.error('Error: No config file found')
            console.error('\nGlobal config locations searched:')
            console.error('  ~/.config/claude-code-inject/config.yaml')
            console.error('  ~/.claude-code-inject/config.yaml')
            console.error('\nProject config locations searched:')
            console.error('  ./.claude-code-inject.yaml')
            console.error('  ./claude-code-inject.yaml')
            process.exit(1)
          }

          const { config, configPath } = result
          console.log(`Using config from: ${configPath}`)
          inject(config)
        }
      } catch (error) {
        console.error(
          'Error:',
          error instanceof Error ? error.message : String(error),
        )
        process.exit(1)
      }
    })

  try {
    program.exitOverride()
    program.configureOutput({
      writeErr: str => process.stderr.write(str),
    })

    await program.parseAsync(process.argv)
  } catch (error: any) {
    if (
      error.code === 'commander.help' ||
      error.code === 'commander.helpDisplayed' ||
      error.code === 'commander.version'
    ) {
      process.exit(0)
    }
    console.error('Error:', error.message || error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
