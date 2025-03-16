import { EventEmitter } from 'node:events'
import { join, dirname } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import screenshot from 'screenshot-desktop'
import sharp from 'sharp'
import * as activeWin from 'active-win'
import captureWindow from 'capture-window'
import { promisify } from 'node:util'
import { CaptureEvent } from '../types/capture'
import { createLogger, LogLevel } from '../utils/logger'
import type { 
  CaptureConfig, 
  CaptureEventData, 
  CaptureResult,
  CaptureSuccessResult,
  CaptureErrorResult,
  CaptureRegion
} from '../types/capture'

/**
 * Screen Capture Module
 * Handles capturing screenshots of the PICO-8 window at regular intervals
 */

// Promisify the captureWindow function
// The function takes (windowId: number, callback: (err, path) => void)
const captureWindowAsync = promisify<number, null, null, string>(captureWindow as any)

export class ScreenCapture extends EventEmitter {
  private config: CaptureConfig
  private captureInterval: ReturnType<typeof setInterval> | null = null
  private isCapturing = false
  private logger = createLogger('ScreenCapture')
  private lastWindowId: number | null = null
  
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
      let captureRegion: CaptureRegion | undefined = this.config.captureRegion
      let windowId: number | undefined
      
      // If windowTitle is specified, try to find the window
      if (this.config.windowTitle && !captureRegion) {
        // Find the PICO-8 window - now returns both region and windowId
        const windowInfo = await this.findPico8Window()
        captureRegion = windowInfo.region
        windowId = windowInfo.windowId
        
        // Save window ID for future captures
        if (windowId) {
          this.lastWindowId = windowId
        } else if (this.lastWindowId) {
          // If we have a previously found window ID, try to use it
          windowId = this.lastWindowId
        }
        
        // If we couldn't find the window and autoStop is enabled, stop capturing
        if (!captureRegion && !windowId && this.config.autoStopOnWindowClose) {
          this.stop()
          return {
            success: false,
            error: `Target window '${this.config.windowTitle}' not found. Auto-stopping capture.`,
            timestamp
          }
        }
      }
      
      // First attempt to capture the specific window by ID if on macOS
      let buffer: Buffer | undefined
      let captureMethod = 'unknown'
      
      if (process.platform === 'darwin' && windowId) {
        // Try window-specific capture first (macOS only)
        try {
          this.logger.debug(`Attempting window-specific capture with ID: ${windowId}`)
          const windowBuffer = await this.captureSpecificWindow(windowId)
          
          if (windowBuffer) {
            buffer = windowBuffer
            captureMethod = 'window-specific'
            this.logger.debug('Successfully captured specific window')
          } else {
            throw new Error('Window-specific capture failed, falling back to region capture')
          }
        } catch (windowCaptureError) {
          this.logger.warn(`Window-specific capture failed: ${
            windowCaptureError instanceof Error ? windowCaptureError.message : String(windowCaptureError)
          }`)
          
          // If window-specific capture fails, fall back to region-based capture
          if (captureRegion) {
            this.logger.debug('Falling back to region-based capture')
          } else {
            this.logger.debug('Falling back to full screen capture')
          }
        }
      }
      
      // If we don't have a buffer yet, use the fallback methods
      if (!buffer) {
        try {
          // Always take a full screenshot as the first step
          this.logger.debug('Taking full screenshot')
          buffer = await screenshot({ screen: 0, format: 'png' })
          
          // Log the full screenshot dimensions
          const fullScreenMetadata = await sharp(buffer).metadata()
          this.logger.debug(`Full screenshot dimensions: ${fullScreenMetadata.width}x${fullScreenMetadata.height}`)
          
          if (captureRegion) {
            const { x, y, width, height } = captureRegion
            
            this.logger.debug(`Cropping to region: x=${x}, y=${y}, width=${width}, height=${height}`)
            
            // Apply safe bounds checking to prevent crop errors
            const safeX = Math.max(0, Math.min(x, (fullScreenMetadata.width || 1920) - 1))
            const safeY = Math.max(0, Math.min(y, (fullScreenMetadata.height || 1080) - 1))
            const safeWidth = Math.min(width, (fullScreenMetadata.width || 1920) - safeX)
            const safeHeight = Math.min(height, (fullScreenMetadata.height || 1080) - safeY)
            
            this.logger.debug(`Using safe crop region: x=${safeX}, y=${safeY}, width=${safeWidth}, height=${safeHeight}`)
            
            if (safeWidth <= 0 || safeHeight <= 0) {
              this.logger.warn('Invalid crop region dimensions, using full screenshot')
              captureMethod = 'fullscreen-fallback-invalid-region'
            } else {
              try {
                // Crop to the target region using safe bounds
                buffer = await sharp(buffer)
                  .extract({ left: safeX, top: safeY, width: safeWidth, height: safeHeight })
                  .toBuffer()
                
                // Log successful cropping
                captureMethod = 'region'
                this.logger.debug(`Successfully cropped to region ${safeWidth}x${safeHeight}`)
              } catch (cropError) {
                this.logger.error('Failed to crop screenshot:', cropError)
                
                // Fallback to using the full screenshot if cropping fails
                this.logger.warn('Using full screenshot as fallback')
                captureMethod = 'fullscreen-fallback-crop-error'
              }
            }
          } else {
            // No region specified, using full screen
            this.logger.debug('No capture region specified, using full screen')
            captureMethod = 'fullscreen'
          }
        } catch (screenshotError) {
          // Error taking screenshot
          this.logger.error('Error taking screenshot:', screenshotError)
          throw new Error(`Failed to capture screen: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`)
        }
      }
      
      // Handle saving to disk if enabled
      let filePath: string | undefined
      if (this.config.saveToDisk && this.config.outputDir) {
        const fileName = `capture-${timestamp}-${captureMethod}.${this.config.imageFormat}`
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
      
      // Create success result object
      const result: CaptureSuccessResult = {
        success: true,
        buffer,
        ...(filePath ? { filePath } : {}),
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
      const result: CaptureErrorResult = {
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
  private async findPico8Window(): Promise<{ region: CaptureRegion | undefined, windowId?: number }> {
    try {
      // If no window title is specified, we can't detect the window
      if (!this.config.windowTitle) {
        this.logger.debug('No window title specified, cannot detect window')
        return { region: undefined }
      }
      
      this.logger.debug(`Looking for window with title containing "${this.config.windowTitle}"`)
      
      // Use active-win to get information about all open windows
      const windows = await activeWin.openWindows()
      
      if (!windows || windows.length === 0) {
        this.logger.debug('No open windows found')
        return { region: undefined }
      }
      
      this.logger.debug(`Found ${windows.length} open windows`)
      
      // Log all window titles and owners for debugging
      windows.forEach((window: activeWin.BaseResult, index: number) => {
        this.logger.debug(`Window ${index}: title=${window.title}, owner=${window.owner.name}`)
      })
      
      // Find PICO-8 window by matching title or owner name - use case-insensitive matching
      const searchTitle = this.config.windowTitle.toLowerCase()
      
      const pico8Window = windows.find((window: activeWin.BaseResult) => {
        // Check window title (case-insensitive)
        if (window.title && window.title.toLowerCase().includes(searchTitle)) {
          this.logger.debug(`Found PICO-8 window by title: ${window.title}`)
          return true
        }
        
        // Check app name (case-insensitive)
        if (window.owner.name.toLowerCase().includes(searchTitle) || 
            window.owner.name.toLowerCase().includes('pico-8') || 
            window.owner.name.toLowerCase().includes('pico8')) {
          this.logger.debug(`Found PICO-8 window by owner name: ${window.owner.name}`)
          return true
        }
        
        // On macOS, check bundle ID for PICO-8
        const macOSWindow = window as activeWin.MacOSResult
        if (macOSWindow.platform === 'macos' && macOSWindow.owner.bundleId && (
          macOSWindow.owner.bundleId.toLowerCase().includes('pico8') || 
          macOSWindow.owner.bundleId.toLowerCase().includes('pico-8')
        )) {
          this.logger.debug(`Found PICO-8 window by bundle ID: ${macOSWindow.owner.bundleId}`)
          return true
        }
        
        // Additional fallback - match any window with appName that could be PICO-8
        // This is more permissive but helps when the exact name is different
        const appName = window.owner.name.toLowerCase()
        if (appName.includes('pico') || appName.includes('p8') || appName.includes('lexaloffle')) {
          this.logger.debug(`Found potential PICO-8 window by app name: ${window.owner.name}`)
          return true
        }
        
        return false
      })
      
      if (!pico8Window) {
        this.logger.debug('PICO-8 window not found')
        
        // If we don't find the window by exact matching, fall back to using the first window
        // for testing purposes only (marked with debug flag)
        if (this.config.debug && windows.length > 0) {
          this.logger.debug('Falling back to first available window for testing purposes')
          const firstWindow = windows[0];
          if (firstWindow && firstWindow.bounds) {
            const region: CaptureRegion = {
              x: firstWindow.bounds.x,
              y: firstWindow.bounds.y,
              width: firstWindow.bounds.width,
              height: firstWindow.bounds.height
            };
            
          if (process.platform === 'darwin') {
              return {
                region,
                windowId: (firstWindow as activeWin.MacOSResult).id
              };
          } else {
              return { region };
          }
          }
          
          return { region: undefined }
        }
        
        return { region: undefined }
      }
      
      // Get window ID for direct window capture (macOS specific)
      let windowId: number | undefined
      if (process.platform === 'darwin') {
        const macOSWindow = pico8Window as activeWin.MacOSResult
        windowId = macOSWindow.id
        this.logger.debug(`Found PICO-8 window ID: ${windowId}`)
      }
      
      // Get screen size for comparison
      const screenSize = await this.getScreenSize()
      
      // Log detailed info about the found window
      this.logger.debug('PICO-8 window found:', {
        title: pico8Window.title,
        owner: pico8Window.owner.name,
        processId: pico8Window.owner.processId,
        windowId: windowId,
        platform: 'platform' in pico8Window ? pico8Window.platform : 'unknown',
        bundleId: 'owner' in pico8Window && 'bundleId' in pico8Window.owner ? pico8Window.owner.bundleId : 'unknown',
      })
      
      // Extract window bounds
      // Need to account for macOS Retina display scaling factor
      // On Retina displays, active-win reports logical coordinates
      // but screenshot-desktop captures physical pixels
      
      // Determine scaling factor based on screen resolution
      // Standard macOS Retina displays use 2x scaling
      const scalingFactor = this.detectScalingFactor(screenSize)
      this.logger.debug(`Detected scaling factor: ${scalingFactor}x`)
      
      // Apply scaling factor to window coordinates
      const region = {
        x: Math.round(pico8Window.bounds.x * scalingFactor),
        y: Math.round(pico8Window.bounds.y * scalingFactor),
        width: Math.round(pico8Window.bounds.width * scalingFactor),
        height: Math.round(pico8Window.bounds.height * scalingFactor)
      }
      
      // Log window position details and screen size for debugging
      this.logger.debug('Window position details:', {
        originalWindow: {
          x: pico8Window.bounds.x,
          y: pico8Window.bounds.y,
          width: pico8Window.bounds.width,
          height: pico8Window.bounds.height
        },
        scaledWindow: region,
        screen: screenSize,
        scalingFactor,
        relativePosition: {
          percentX: Math.round((region.x / screenSize.width) * 100),
          percentY: Math.round((region.y / screenSize.height) * 100),
          percentWidth: Math.round((region.width / screenSize.width) * 100),
          percentHeight: Math.round((region.height / screenSize.height) * 100),
        }
      })
      
      // Return with the correct type
      const result: { region: CaptureRegion, windowId?: number } = { region }
      if (windowId !== undefined) {
        result.windowId = windowId
      }
      return result
    } catch (error) {
      this.logger.error('Error finding PICO-8 window:', error)
      return { region: undefined }
    }
  }
  
  /**
   * Captures a screenshot of a specific window by ID
   * This is more reliable than screen cropping, especially when windows overlap
   * Currently only supported on macOS
   * @param windowId The window ID to capture
   * @returns Buffer containing the image data, or undefined if capture failed
   * @private
   */
  private async captureSpecificWindow(windowId: number): Promise<Buffer | undefined> {
    if (process.platform !== 'darwin') {
      this.logger.debug('Window-specific capture only supported on macOS')
      return undefined
    }
    
    // For testing only - disabling window-specific capture
    // This is a temporary workaround due to the capture-window library issues
    if (this.config.debug) {
      this.logger.debug('Window-specific capture temporarily disabled in debug/test mode due to known issues')
      return undefined
    }
    
    try {
      this.logger.debug(`Capturing specific window with ID: ${windowId}`)
      
      // Use the capture-window library to capture the specific window
      // It returns a path to the temp file where the image was saved
      
      // Due to potential crashes with captureWindowAsync, we're implementing a safe version
      // that will gracefully handle failures
      let tempPath: string
      
      try {
        // Attempt to use captureWindowAsync with a safety timeout
        const capturePromise = captureWindowAsync(windowId, null, null) as Promise<string>
        
        // Add a timeout to prevent hanging if the function fails
        const timeoutPromise = new Promise<string>((_resolve, reject) => {
          setTimeout(() => reject(new Error('Window capture timed out')), 2000)
        })
        
        // Race the two promises - whichever completes first wins
        tempPath = await Promise.race([capturePromise, timeoutPromise])
      } catch (captureError) {
        this.logger.warn(`Window capture failed: ${captureError instanceof Error ? captureError.message : String(captureError)}`)
        return undefined
      }
      
      if (!tempPath) {
        throw new Error('No temp file path returned from capture-window')
      }
      
      // Read the captured image into a buffer
      const tempBuffer = await sharp(tempPath).toBuffer()
      const metadata = await sharp(tempBuffer).metadata()
      this.logger.debug(`Window capture dimensions: ${metadata.width}x${metadata.height}`)
      
      // Return the buffer
      return tempBuffer
    } catch (error) {
      this.logger.error(`Error capturing specific window: ${error instanceof Error ? error.message : String(error)}`)
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
  
  /**
   * Detects the display scaling factor based on screen resolution
   * This is primarily needed for macOS Retina displays
   * @param screenSize The screen dimensions
   * @returns The scaling factor (1 for standard displays, 2 for Retina, etc.)
   * @private
   */
  private detectScalingFactor(screenSize: {width: number, height: number}): number {
    // Common Retina resolutions on macOS
    const retinaResolutions = [
      // MacBook Pro 13" Retina
      { width: 2560, height: 1600 },
      // MacBook Pro 14" Retina
      { width: 3024, height: 1964 },
      // MacBook Pro 16" Retina
      { width: 3456, height: 2234 },
      // iMac 24" Retina
      { width: 4480, height: 2520 },
      // iMac 27" 5K Retina
      { width: 5120, height: 2880 },
      // Generic 4K display
      { width: 3840, height: 2160 },
    ]
    
    // Check if screen resolution matches a known Retina resolution
    const isRetina = retinaResolutions.some(resolution => 
      Math.abs(resolution.width - screenSize.width) < 100 && 
      Math.abs(resolution.height - screenSize.height) < 100
    )
    
    // Could also check for resolution > 2000 pixels in width as a general rule
    const isHighDPI = screenSize.width > 2000 || screenSize.height > 1200
    
    if (isRetina || isHighDPI) {
      return 2 // Retina displays typically use 2x scaling
    }
    
    return 1 // Standard displays use 1x scaling
  }
}