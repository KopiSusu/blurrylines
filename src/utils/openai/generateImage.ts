import { openai } from ".";

/**
 * Generates a portrait image based on a detailed face description and returns it as a Buffer.
 *
 * @param {string} faceDescription - A brief description of the face to be depicted.
 * @returns {Promise<Buffer>} - Buffer containing the generated portrait image.
 * @throws {Error} - Throws an error if image generation fails or if the response data is invalid.
 */
export async function generateImage(faceDescription: string): Promise<Buffer> {
  try {
    console.log('Starting image generation process.');

    // Input Validation
    if (typeof faceDescription !== 'string' || faceDescription.trim().length < 10) {
      throw new Error("Face description must be a non-empty string with at least 10 characters.");
    }

    // Step 1: Refine the face description using OpenAI's GPT model
    const refinedPromptResponse = await openai.chat.completions.create({
      model: "gpt-4", // Ensure you have access to GPT-4
      temperature: 0.7, // Balanced creativity and coherence
      max_tokens: 500, // Sufficient tokens for detailed description
      top_p: 0.9,
      messages: [
        {
          role: "system",
          content:
            `You are a skilled portrait artist and photographer. Your task is to create a highly detailed and vivid image description tailored for a portrait shot, focusing on facial features, expressions, lighting, and background elements, specifically ensuring a solid white background.`,
        },
        {
          role: "user",
          content: `Enhance the following face description with more details suitable for a portrait photograph, including specifications for a solid white background: "${faceDescription}"`,
        },
      ],
    });

    // Extract the refined prompt from the response
    const refinedPrompt = refinedPromptResponse.choices[0].message?.content?.trim();
    if (!refinedPrompt) {
      throw new Error("Failed to refine the face description.");
    }
    console.log("Refined Prompt:", refinedPrompt);

    // Step 2: Generate the image using the refined prompt with DALL-E 3
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `${refinedPrompt} - portrait shot, high-resolution, focused on facial expression and details, solid white background`,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json", // Receive image data as Base64-encoded JSON
    });

    console.log('Received image response.');

    // Ensure that imageResponse.data exists and has at least one element
    if (!imageResponse.data || !Array.isArray(imageResponse.data) || imageResponse.data.length === 0) {
      throw new Error("Image generation response is empty or malformed.");
    }

    // Extract the Base64-encoded image data from the response
    const base64Image = imageResponse.data[0].b64_json;
    if (!base64Image) {
      throw new Error("Failed to retrieve the image data.");
    }

    // Convert the Base64 string to a Buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    console.log("Image Buffer created successfully.");

    return imageBuffer;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Image generation failed. Please try again.");
  }
}
