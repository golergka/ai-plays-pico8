import 'dotenv/config'

/**
 * Simple function to call OpenAI API
 * Just extracts the fetch call that's working in LLMPlayer
 * 
 * @param body The request body to send to OpenAI
 * @returns The raw response from OpenAI
 */
export async function callOpenAI(body: Record<string, any>): Promise<any> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env['OPENAI_API_KEY']}`,
      "OpenAI-Organization": process.env['OPENAI_ORG_ID'] || ""
    },
    body: JSON.stringify(body)
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } })) as { error?: { message?: string } }
    throw new Error(`OpenAI API error (${response.status}): ${errorData?.error?.message || 'Unknown error'}`)
  }
  
  return await response.json()
}