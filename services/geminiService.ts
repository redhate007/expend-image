import { GoogleGenAI } from "@google/genai";

// Initialize the client
// The API key is injected from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Expands an image using the Gemini 2.5 Flash Image model.
 * It sends a composite image (original image placed on a larger canvas) 
 * and asks the model to fill in the gaps.
 * 
 * @param base64Image The base64 string of the *composited* canvas (original + empty space)
 * @param prompt User's description of what to fill
 * @param mimeType The mime type of the image (usually image/png)
 */
export const generateExpandedImage = async (
  base64Image: string,
  prompt: string,
  mimeType: string = 'image/png'
): Promise<string> => {
  try {
    // Strip the data URL prefix if present (e.g., "data:image/png;base64,")
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const systemInstruction = `You are an expert image editor and artist. 
    The user has provided an image that is placed on a larger canvas. 
    The original image is surrounded by empty or transparent space (or a solid background color).
    Your task is to SEAMLESSLY fill the empty space to extend the scene naturally, matching the style, lighting, and context of the original central image.
    Do not change the core content of the original central part if possible, but blend it perfectly.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `${systemInstruction}\n\nUser Request: ${prompt}`
          },
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType
            }
          }
        ]
      },
      config: {
        // We don't set aspectRatio here because we are providing the exact input canvas dimensions 
        // via the image itself. The model usually respects the input aspect ratio for editing tasks.
      }
    });

    // Check for image parts in the response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated in the response.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
