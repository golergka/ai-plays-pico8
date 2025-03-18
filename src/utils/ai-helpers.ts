/**
 * Helper function to format tool calls as text for debugging
 */
export function formatToolCallsAsText(toolCalls: any[]): string {
  if (!toolCalls || toolCalls.length === 0) {
    return 'No tool calls found';
  }

  return toolCalls.map((call, index) => {
    return `Tool Call ${index + 1}:
  Name: ${call.toolName || 'Unknown'}
  Arguments: ${JSON.stringify(call.args || {}, null, 2)}`;
  }).join('\n\n');
}