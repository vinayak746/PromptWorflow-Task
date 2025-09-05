import { useState } from "react";
import "./App.css";

function App() {
  const [prompt, setPrompt] = useState("");
  const [workflowJson, setWorkflowJson] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setWorkflowJson("");

    try {
      // This is the URL of the backend server you built
      const response = await fetch("http://localhost:3001/generate-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      // We use JSON.stringify with formatting to make it look nice
      setWorkflowJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(`Failed to generate workflow: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Prompt-to-Workflow Generator</h1>
        <p>Enter your workflow instructions in plain English.</p>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., When a new email comes to my Gmail, categorize it using ChatGPT, and if it's a customer query, forward it to my support email."
            rows={5}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !prompt}>
            {isLoading ? "Generating..." : "Generate Workflow"}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {workflowJson && (
          <div className="result-container">
            <h2>Generated Workflow JSON:</h2>
            <pre>
              <code>{workflowJson}</code>
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
