import API_BASE_URL from '../config';

export const analyzeCode = async (code, problemDescription, language, approach) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, problemDescription, language, approach }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.feedback || "No feedback returned by the server.";
    } catch (error) {
        console.error("Error analyzing code via backend:", error);
        throw new Error(error.message || "Failed to analyze code.");
    }
};
