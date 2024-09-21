import { openai } from ".";

/**
 * Generates an image based on a detailed face description.
 *
 * @param {string} faceDescription - A brief description of the face to be depicted.
 * @returns {Promise<string>} - URL of the generated image.
 */
export async function generateImage(faceDescription: string) {
  try {
    // Step 1: Refine the face description using OpenAI's GPT model
    console.log('start')
    const refinedPromptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Corrected model name
      temperature: 0.7, // Adjusted for more deterministic output
      max_tokens: 500, // Sufficient tokens for detailed description
      top_p: 0.9,
      messages: [
        {
          role: "system",
          content:
            `You are a skilled portrait artist and photographer. Your task is to create a highly detailed and vivid image description tailored for a portrait shot, focusing on facial features, expressions, lighting, and background elements.`,
        },
        {
          role: "user",
          content: `Enhance the following face description with more details suitable for a portrait photograph: "${faceDescription}"`,
        },
      ],
    });

    // Extract the refined prompt from the response
    const refinedPrompt = refinedPromptResponse.choices[0].message?.content;
    console.log("Refined Prompt:", refinedPrompt);

    // Step 2: Generate the image using the refined prompt with DALL-E 3
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `${refinedPrompt} - portrait shot, high-resolution, focused on facial expression and details`,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });

    console.log('base 64')
    console.log(imageResponse);

    // Extract the image URL from the response
    const base64Image = await imageResponse.data[0].b64_json

    if (!base64Image) {
      throw new Error("Failed to retrieve the image data.");
    }
    
    // Convert base64 string to Buffer
    const imageBuffer = Buffer.from(base64Image, 'base64')

    return imageBuffer
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Image generation failed. Please try again.");
  }
}

