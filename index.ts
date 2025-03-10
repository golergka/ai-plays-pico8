import { Pico8Runner } from './src/runners/pico8Runner'

/**
 * Example usage of the PICO-8 Game Runner
 * This is a temporary implementation until environment configuration is added
 */
async function main() {
  console.log('AI Plays PICO-8 - Runner Example')
  
  // TODO: Replace with environment configuration (T-105)
  // Will be implemented in a future task
  const pico8Path = process.platform === 'darwin'
    ? '/Applications/PICO-8.app/Contents/MacOS/pico8'
    : process.platform === 'win32'
    ? 'C:\\Program Files (x86)\\PICO-8\\pico8.exe'
    : '/usr/bin/pico8'
  
  const runner = new Pico8Runner({
    executablePath: pico8Path,
    windowed: true,
    soundVolume: 128
  })
  
  console.log('Example configuration for PICO-8 runner created')
  console.log('Actual launch functionality disabled until environment configuration is implemented')
  console.log('This is a placeholder until tasks T-105 through T-108 are completed')
}

// Run the main function
main().catch(console.error)