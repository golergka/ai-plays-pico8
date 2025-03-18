/**
 * Common test setup and utilities
 */

/**
 * Helper for testing async functions that throw errors
 */
export async function expectAsyncError(fn: () => Promise<any>, errorType?: any): Promise<void> {
  let error: Error | undefined
  
  try {
    await fn()
  } catch (e) {
    error = e as Error
  }
  
  if (!error) {
    throw new Error('Expected function to throw an error, but it did not')
  }
  
  if (errorType && !(error instanceof errorType)) {
    throw new Error(`Expected error to be an instance of ${errorType.name}, but got ${error.constructor.name}`)
  }
}

/**
 * Helper for testing that an async function doesn't throw an error
 */
export async function expectNoAsyncError(fn: () => Promise<any>): Promise<void> {
  try {
    await fn()
  } catch (e) {
    throw new Error(`Expected function not to throw an error, but it threw: ${(e as Error).message}`)
  }
}