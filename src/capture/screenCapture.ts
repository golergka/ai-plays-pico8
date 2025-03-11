import { EventEmitter } from 'node:events'
import { join, dirname } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import screenshot from 'screenshot-desktop'
import sharp from 'sharp'
import { CaptureEvent } from '../types/capture'
import type { 
  CaptureConfig, 
  CaptureEventData, 
  CaptureResult 
} from '../types/capture'

/**
 * Screen Capture Module
 * Handles capturing screenshots of the PICO-8 window at regular intervals
 */
export class ScreenCapture extends EventEmitter {
  private config: CaptureConfig
  private captureInterval: ReturnType<typeof setInterval> | null = null
  private isCapturing = false
  
  /**
   * Creates a new ScreenCapture instance
   * @param config Configuration for the screen capture
   */
  constructor(config: CaptureConfig) {
    super()
    
    // Set default config values
    const defaults = {
      interval: 1000, // Default to 1 second
      saveToDisk: false,
      imageFormat: 'png' as const,
      imageQuality: 90
    }
    
    this.config = {
      ...defaults,
      ...config
    }
  }
  
  /**
   * Starts the screen capture process
   * @returns Success status of starting the capture
   */
  start(): boolean {
    if (this.isCapturing) {
      return false
    }
    
    this.isCapturing = true
    
    // Create capture interval
    this.captureInterval = setInterval(
      async () => { await this.captureScreen() },
      this.config.interval
    )
    
    // Emit start event
    this.emit(CaptureEvent.START, {
      timestamp: Date.now()
    } as CaptureEventData)
    
    return true
  }
  
  /**
   * Stops the screen capture process
   * @returns Success status of stopping the capture
   */
  stop(): boolean {
    if (!this.isCapturing) {
      return false
    }
    
    if (this.captureInterval) {
      clearInterval(this.captureInterval)
      this.captureInterval = null
    }
    
    this.isCapturing = false
    
    // Emit stop event
    this.emit(CaptureEvent.STOP, {
      timestamp: Date.now()
    } as CaptureEventData)
    
    return true
  }
  
  /**
   * Performs a one-time screen capture
   * @returns Result of the capture operation
   */
  async captureScreen(): Promise<CaptureResult> {
    const timestamp = Date.now()
    try {
      // Capture screen region or full screen
      let buffer: Buffer
      if (this.config.captureRegion) {
        const { x, y, width, height } = this.config.captureRegion
        buffer = await screenshot({ screen: 0, format: 'png' }) // First capture full screen
        
        // Crop to the target region
        buffer = await sharp(buffer)
          .extract({ left: x, top: y, width, height })
          .toBuffer()
      } else {
        buffer = await screenshot({ screen: 0, format: 'png' })
      }
      
      // Handle saving to disk if enabled
      let filePath: string | undefined
      if (this.config.saveToDisk && this.config.outputDir) {
        const fileName = `capture-${timestamp}.${this.config.imageFormat}`
        filePath = join(this.config.outputDir, fileName)
        
        // Ensure output directory exists
        if (!existsSync(dirname(filePath))) {
          await mkdir(dirname(filePath), { recursive: true })
        }
        
        // Convert and save file in specified format
        let imageBuffer: Buffer
        if (this.config.imageFormat === 'jpg') {
          imageBuffer = await sharp(buffer)
            .jpeg({ quality: this.config.imageQuality })
            .toBuffer()
        } else if (this.config.imageFormat === 'webp') {
          imageBuffer = await sharp(buffer)
            .webp({ quality: this.config.imageQuality })
            .toBuffer()
        } else {
          // Default to PNG
          imageBuffer = buffer
        }
        
        await writeFile(filePath, imageBuffer)
      }
      
      // Create result object
      const result: CaptureResult = {
        success: true,
        buffer,
        filePath,
        timestamp
      }
      
      // Emit capture event
      this.emit(CaptureEvent.CAPTURE, {
        timestamp,
        buffer,
        filePath
      } as CaptureEventData)
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Create error result
      const result: CaptureResult = {
        success: false,
        error: `Failed to capture screen: ${errorMessage}`,
        timestamp
      }
      
      // Emit error event
      this.emit(CaptureEvent.ERROR, {
        timestamp,
        error: result.error
      } as CaptureEventData)
      
      return result
    }
  }
  
  /**
   * Updates the configuration for the screen capture
   * @param config New configuration options (partial)
   */
  updateConfig(config: Partial<CaptureConfig>): void {
    const oldInterval = this.config.interval
    
    // Update config
    this.config = {
      ...this.config,
      ...config
    }
    
    // Restart interval if it's changed and currently capturing
    if (this.isCapturing && this.config.interval !== oldInterval) {
      this.stop()
      this.start()
    }
  }
  
  /**
   * Checks if screen capture is currently active
   * @returns true if screen capture is running, false otherwise
   */
  isActive(): boolean {
    return this.isCapturing
  }
}