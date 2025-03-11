import { EventEmitter } from 'node:events'
import { join, dirname } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import screenshot from 'screenshot-desktop'
import sharp from 'sharp'
import * as activeWin from 'active-win'
import { CaptureEvent } from '../types/capture'
import { createLogger, LogLevel } from '../utils/logger'
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
  private logger = createLogger('ScreenCapture')
  
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
    
    // Set logger level based on debug mode
    if (config.debug) {
      this.logger.setLevel(LogLevel.DEBUG)
      this.logger.debug('Debug logging enabled for ScreenCapture')
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
        captureRegion = await this.findPico8Window()
        
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
        
        this.logger.debug(`Capturing region: x=${x}, y=${y}, width=${width}, height=${height}`)
        
        // Capture full screen first
        buffer = await screenshot({ screen: 0, format: 'png' })
        
        // Log the full screenshot dimensions
        const fullScreenMetadata = await sharp(buffer).metadata()
        this.logger.debug(`Full screenshot dimensions: ${fullScreenMetadata.width}x${fullScreenMetadata.height}`)
        
        // Then crop to the target region
        try {
          buffer = await sharp(buffer)
            .extract({ left: x, top: y, width, height })
            .toBuffer()
            
          // Log successful cropping
          this.logger.debug(`Successfully cropped to region ${width}x${height}`)
        } catch (cropError) {
          this.logger.error('Failed to crop screenshot:', cropError)
          
          // Fallback to using the full screenshot if cropping fails
          // This could happen if the window bounds are outside the screen
          this.logger.warn('Using full screenshot as fallback')
        }
      } else {
        // Capture full screen if no region specified
        this.logger.debug('No capture region specified, capturing full screen')
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
  private async findPico8Window(): Promise<CaptureRegion | undefined> {
    try {
      // If no window title is specified, we can't detect the window
      if (!this.config.windowTitle) {
        this.logger.debug('No window title specified, cannot detect window')
        return undefined
      }
      
      this.logger.debug(`Looking for window with title containing "${this.config.windowTitle}"`)
      
      // Use active-win to get information about all open windows
      const windows = await activeWin.openWindows()
      
      if (!windows || windows.length === 0) {
        this.logger.debug('No open windows found')
        return undefined
      }
      
      this.logger.debug(`Found ${windows.length} open windows`)
      
      // Find PICO-8 window by matching title or owner name
      const pico8Window = windows.find((window: activeWin.BaseResult) => {
        // Check window title
        if (window.title && window.title.includes(this.config.windowTitle!)) {
          return true
        }
        
        // Check app name
        if (window.owner.name.includes(this.config.windowTitle!)) {
          return true
        }
        
        // On macOS, check bundle ID for PICO-8
        const macOSWindow = window as activeWin.MacOSResult
        if (macOSWindow.platform === 'macos' && macOSWindow.owner.bundleId && (
          macOSWindow.owner.bundleId.includes('pico8') || 
          macOSWindow.owner.bundleId.includes('pico-8')
        )) {
          return true
        }
        
        return false
      })
      
      if (!pico8Window) {
        this.logger.debug('PICO-8 window not found')
        return undefined
      }
      
      // Get screen size for comparison
      const screenSize = await this.getScreenSize()
      
      // Log detailed info about the found window
      this.logger.debug('PICO-8 window found:', {
        title: pico8Window.title,
        owner: pico8Window.owner.name,
        processId: pico8Window.owner.processId,
        platform: 'platform' in pico8Window ? pico8Window.platform : 'unknown',
        bundleId: 'owner' in pico8Window && 'bundleId' in pico8Window.owner ? pico8Window.owner.bundleId : 'unknown',
      })
      
      // Extract window bounds
      const region = {
        x: pico8Window.bounds.x,
        y: pico8Window.bounds.y,
        width: pico8Window.bounds.width,
        height: pico8Window.bounds.height
      }
      
      // Log window position details and screen size for debugging
      this.logger.debug('Window position details:', {
        window: region,
        screen: screenSize,
        relativePosition: {
          percentX: Math.round((region.x / screenSize.width) * 100),
          percentY: Math.round((region.y / screenSize.height) * 100),
          percentWidth: Math.round((region.width / screenSize.width) * 100),
          percentHeight: Math.round((region.height / screenSize.height) * 100),
        }
      })
      
      return region
    } catch (error) {
      this.logger.error('Error finding PICO-8 window:', error)
      return undefined
    }
  }
  
  /**
   * Gets the screen size using screenshot-desktop
   * @returns Screen dimensions
   * @private
   */
  private async getScreenSize(): Promise<{width: number, height: number}> {
    try {
      // Take a small screenshot to get dimensions
      const buffer = await screenshot({ screen: 0, format: 'png' })
      const metadata = await sharp(buffer).metadata()
      
      return {
        width: metadata.width || 1920, // Default fallback
        height: metadata.height || 1080 // Default fallback
      }
    } catch (error) {
      this.logger.error('Error getting screen size:', error)
      return { width: 1920, height: 1080 } // Default fallback values
    }
  }
}