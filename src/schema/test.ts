import { ExampleActionSchema, exampleJsonSchema, validateExampleAction } from './examples'
import { parseSchema, safeParseSchema } from './utils'
import type { ExampleAction } from './examples'

/**
 * Test function to demonstrate schema usage
 */
export function testSchemaSystem(): void {
  console.log('Testing schema system...\n')

  // Example 1: Valid action using parse
  console.log('Example 1: Valid action using parse')
  try {
    const validAction = parseSchema(ExampleActionSchema, {
      type: 'move',
      direction: 'north'
    })
    console.log('Valid action:', validAction)
    console.log('Result: ✅ Passed\n')
  } catch (error) {
    console.error('Error:', error)
    console.log('Result: ❌ Failed\n')
  }

  // Example 2: Invalid action using parse
  console.log('Example 2: Invalid action using parse')
  try {
    const invalidAction = parseSchema(ExampleActionSchema, {
      type: 'move',
      direction: 'up' // Invalid direction
    })
    console.log('Invalid action parsed successfully (unexpected):', invalidAction)
    console.log('Result: ❌ Failed\n')
  } catch (error) {
    console.log('Error caught as expected')
    console.log('Result: ✅ Passed\n')
  }

  // Example 3: Safe parse with valid data
  console.log('Example 3: Safe parse with valid data')
  const validSafeParse = safeParseSchema(ExampleActionSchema, {
    type: 'examine',
    target: 'door'
  })
  console.log('Safe parse result:', validSafeParse)
  console.log('Result:', validSafeParse ? '✅ Passed' : '❌ Failed')
  console.log()

  // Example 4: Safe parse with invalid data
  console.log('Example 4: Safe parse with invalid data')
  const invalidSafeParse = safeParseSchema(ExampleActionSchema, {
    type: 'examine' 
    // Missing required 'target' field
  })
  console.log('Safe parse result:', invalidSafeParse)
  console.log('Result:', invalidSafeParse === null ? '✅ Passed' : '❌ Failed')
  console.log()

  // Example 5: Using the validation helper function
  console.log('Example 5: Using the validation helper function')
  const validatedAction = validateExampleAction({
    type: 'use',
    item: 'key',
    target: 'door'
  })
  console.log('Validated action:', validatedAction)
  console.log('Result:', validatedAction ? '✅ Passed' : '❌ Failed')
  console.log()

  // Example 6: JSON Schema conversion
  console.log('Example 6: JSON Schema conversion')
  console.log('JSON Schema:')
  console.log(JSON.stringify(exampleJsonSchema, null, 2))
  console.log('Result: ✅ Generated\n')

  // Example 7: Type inference
  console.log('Example 7: Type inference')
  const typedAction: ExampleAction = {
    type: 'inventory'
  }
  console.log('Typed action:', typedAction)
  console.log('Result: ✅ Types work\n')

  console.log('Schema system test complete!')
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSchemaSystem()
}