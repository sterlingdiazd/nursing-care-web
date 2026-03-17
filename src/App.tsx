import { useEffect, useState } from "react";
import { createCareRequest } from "./api/careRequests";
import { clearClientLogs, logClientEvent, useClientLogs } from "./logging/clientLogger";

function App() {
  const [residentId, setResidentId] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logs = useClientLogs();

  useEffect(() => {
    logClientEvent("web.ui", "Web app loaded");
  }, []);

  async function handleSubmit() {
    setResult(null);
    setError(null);

    try {
      const response = await createCareRequest({
        residentId: residentId,
        description: description,
      });

      logClientEvent("web.ui", "Create care request succeeded", {
        residentId,
        createdId: response.id,
      });
      setResult("Created CareRequest with ID: " + response.id);
    } catch (err: any) {
      logClientEvent(
        "web.ui",
        "Create care request surfaced an error to the UI",
        { residentId, message: err.message ?? "Unknown error" },
        "error",
      );
      setError(err.message ?? "Unknown error");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>NursingCare — Create Care Request</h1>

      <div style={{ marginBottom: 20 }}>
        <label>Resident ID</label>
        <br />
        <input
          style={{ width: 400 }}
          value={residentId}
          onChange={(e) => setResidentId(e.target.value)}
          placeholder="Paste a GUID here"
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Description</label>
        <br />
        <textarea
          style={{ width: 400, height: 100 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the care request"
        />
      </div>

      <button onClick={handleSubmit}>Create Care Request</button>

      {result && <div style={{ marginTop: 20, color: "green" }}>{result}</div>}

      {error && <div style={{ marginTop: 20, color: "red" }}>{error}</div>}

      <details style={{ marginTop: 32, maxWidth: 800 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Client Logs ({logs.length})
        </summary>
        <button
          onClick={() => clearClientLogs()}
          style={{ marginTop: 12, marginBottom: 12 }}
        >
          Clear Logs
        </button>
        <div
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 8,
            padding: 12,
            backgroundColor: "#f8fafc",
            maxHeight: 320,
            overflow: "auto",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          {logs.map((log) => (
            <div key={log.id} style={{ marginBottom: 12 }}>
              <div>
                [{log.timestamp}] {log.level.toUpperCase()} {log.source}: {log.message}
              </div>
              {log.data && (
                <pre style={{ whiteSpace: "pre-wrap", margin: "4px 0 0 0" }}>
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export default App;
