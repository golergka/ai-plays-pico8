import { EventEmitter } from 'node:events'
import { join, dirname } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import screenshot from 'screenshot-desktop'
import sharp from 'sharp'
import robot from 'robotjs'
import { CaptureEvent } from '../types/capture'
import type { 
  CaptureConfig, 
  CaptureEventData, 
  CaptureResult,
  CaptureRegion
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
      imageQuality: 90,
      windowTitle: 'PICO-8', // Default to looking for PICO-8 window
      autoStopOnWindowClose: true // Auto-stop when window is closed by default
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
      // Try to find the PICO-8 window if window title is specified
      let captureRegion = this.config.captureRegion
      
      // If windowTitle is specified, try to find the window
      if (this.config.windowTitle && !captureRegion) {
        captureRegion = this.findPico8Window()
        
        // If we couldn't find the window and autoStop is enabled, stop capturing
        if (!captureRegion && this.config.autoStopOnWindowClose) {
          this.stop()
          return {
            success: false,
            error: `Target window '${this.config.windowTitle}' not found. Auto-stopping capture.`,
            timestamp
          }
        }
      }
      
      // Capture screen region or full screen
      let buffer: Buffer
      if (captureRegion) {
        const { x, y, width, height } = captureRegion
        
        // If robotjs is available and the region is within screen bounds, use it directly
        try {
          const screenSize = robot.getScreenSize()
          if (
            x >= 0 && y >= 0 && 
            x + width <= screenSize.width && 
            y + height <= screenSize.height
          ) {
            // Use robotjs for faster capture of region
            const bitmap = robot.screen.capture(x, y, width, height)
            // Convert robotjs bitmap to PNG buffer using sharp
            const rgbaBuffer = Buffer.alloc(width * height * 4)
            
            // Convert robotjs bitmap to RGBA buffer
            for (let i = 0; i < width * height; i++) {
              const r = bitmap.image[i * 4]
              const g = bitmap.image[i * 4 + 1]
              const b = bitmap.image[i * 4 + 2]
              const a = bitmap.image[i * 4 + 3]
              
              rgbaBuffer[i * 4] = r
              rgbaBuffer[i * 4 + 1] = g
              rgbaBuffer[i * 4 + 2] = b
              rgbaBuffer[i * 4 + 3] = a
            }
            
            // Convert to PNG using sharp
            buffer = await sharp(rgbaBuffer, {
              raw: {
                width,
                height,
                channels: 4
              }
            }).png().toBuffer()
          } else {
            // Fallback to screenshot-desktop with cropping
            buffer = await screenshot({ screen: 0, format: 'png' })
            buffer = await sharp(buffer)
              .extract({ left: x, top: y, width, height })
              .toBuffer()
          }
        } catch (robotError) {
          // Fallback to screenshot-desktop with cropping if robotjs fails
          console.error('Error using robotjs, falling back to screenshot-desktop:', robotError)
          buffer = await screenshot({ screen: 0, format: 'png' })
          buffer = await sharp(buffer)
            .extract({ left: x, top: y, width, height })
            .toBuffer()
        }
      } else {
        // Capture full screen if no region specified
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
  
  /**
   * Attempts to find the PICO-8 window bounds based on window title
   * @returns Capture region for the window or undefined if not found
   * @private
   */
  private findPico8Window(): CaptureRegion | undefined {
    try {
      // If no window title is specified, we can't detect the window
      if (!this.config.windowTitle) {
        return undefined
      }
      
      // Get a screenshot to analyze (we'll use robotjs to get screen size)
      const { width, height } = robot.getScreenSize()
      
      // We'll use robotjs to capture the screen and then analyze it
      // Unfortunately robotjs doesn't have direct window detection capabilities
      // but we can look for the PICO-8 window based on its visual characteristics
      // or use a fixed position for now
      
      // For simplicity in this implementation, we'll assume a fixed window size for PICO-8
      // In a more sophisticated implementation, you might want to use platform-specific
      // window detection APIs or visual detection
      
      // Default PICO-8 window is approximately 512x512 pixels
      // These values should be adjusted based on actual measurements of your PICO-8 window
      return {
        x: Math.floor(width / 2 - 256), // Center the capture area horizontally
        y: Math.floor(height / 2 - 256), // Center the capture area vertically
        width: 512,
        height: 512
      }
      
      // Note: A more robust implementation would use platform-specific
      // window detection APIs available in native Node.js modules
    } catch (error) {
      console.error('Error finding PICO-8 window:', error)
      return undefined
    }
  }
}