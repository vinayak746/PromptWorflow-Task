import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";

// ----- CONFIGURATION -----
const app = express();
const port = 3001;

// This is where you'll put your secret API key from Google AI Studio
const genAI = new GoogleGenerativeAI("AIzaSyDOUx34WfUgs-PjQh4UK6ifQet0PKZeCDc"); // IMPORTANT: Replace with your key

// ----- MIDDLEWARE -----
app.use(cors());
app.use(express.json());

// ----- THE "BRAIN": SYSTEM PROMPT -----
// The instructions for the AI remain exactly the same.
const systemPrompt = `
You are an expert Activepieces workflow generator. Your task is to convert a user's natural language prompt into a valid Activepieces workflow JSON. The output must be ONLY the JSON object, with no extra text or explanations.

Here are the available pieces and their actions/triggers you can use:

1.  **Piece: "gmail"**
    * **Trigger**: \`new_email\` (This is always the first step if the prompt mentions "when a new email comes"). It has no inputs.
    * **Action**: \`send_email\` (Inputs: \`to\`, \`subject\`, \`body\`)
    * **Action**: \`get_thread\` (Inputs: \`thread_id\`). We created this custom action. Use it if the user wants to read the whole email thread. The \`thread_id\` can be taken from the trigger step's output using this special string: \`{{trigger.threadId}}\`.

2.  **Piece: "openai"**
    * **Action**: \`ask_chatgpt\` (Inputs: \`prompt\`). Use this for tasks like summarizing, categorizing, or extracting information.

3.  **Piece: "branch"**
    * **Action**: \`branch\` (Inputs: a single condition in the format \`{{step_name.output_variable}} operator 'value'\`). This is for "if/else" logic. It creates two branches: "true" and "false".

The final JSON structure must follow this exact format:
{
  "displayName": "Generated Workflow",
  "trigger": {
    "name": "trigger",
    "valid": true,
    "displayName": "Gmail Trigger",
    "nextActionName": "step_1",
    "type": "PIECE_TRIGGER",
    "settings": {
      "pieceName": "gmail",
      "triggerName": "new_email",
      "input": {}
    }
  },
  "steps": {
    "step_1": {
      // Action details go here
    },
    "step_2": {
      // More action details
    }
  }
}
`;

// ----- API ENDPOINT -----
// ----- API ENDPOINT -----
app.post("/generate-workflow", async (req, res) => {
  try {
    const userPrompt: string = req.body.prompt;

    if (!userPrompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("Received prompt:", userPrompt);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });
    const fullPrompt = systemPrompt + "\n\nUser Prompt: " + userPrompt;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const generatedJsonString = response.text();

    console.log("AI Response:", generatedJsonString);

    if (!generatedJsonString) {
      throw new Error("AI did not return valid content.");
    }

    // --- THIS IS THE NEW, MORE ROBUST FIX ---
    // It finds the first '{' and the last '}' and extracts everything between them.
    const startIndex = generatedJsonString.indexOf("{");
    const endIndex = generatedJsonString.lastIndexOf("}");
    const cleanedJsonString = generatedJsonString.substring(
      startIndex,
      endIndex + 1
    );

    const generatedJson = JSON.parse(cleanedJsonString);
    res.json(generatedJson);
  } catch (error) {
    console.error("Error generating workflow:", error);
    res.status(500).json({ error: "Failed to generate workflow" });
  }
});

// ----- START THE SERVER -----
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
