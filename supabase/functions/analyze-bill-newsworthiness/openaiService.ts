
/**
 * Analyze bill newsworthiness using OpenAI
 */
export async function analyzeWithOpenAI(prompt: string, apiKey: string) {
  console.log("Sending newsworthiness analysis request to OpenAI");
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert political analyst and journalist who specializes in assessing the newsworthiness of legislative bills. You understand what makes bills likely to generate media coverage and public interest.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API error: ${response.status} - ${errorText}`);
    throw new Error(`OpenAI API request failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error("Unexpected OpenAI response format:", data);
    throw new Error("Invalid response format from OpenAI");
  }

  const content = data.choices[0].message.content;
  
  try {
    const result = JSON.parse(content);
    console.log("Successfully parsed newsworthiness analysis result:", result);
    return result;
  } catch (error) {
    console.error("Failed to parse OpenAI response as JSON:", content);
    throw new Error("Failed to parse analysis result from OpenAI");
  }
}
