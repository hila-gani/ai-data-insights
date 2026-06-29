const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Keep the status-based error message
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Uploads a CSV file to the backend.
 * The file is sent as FormData because file uploads cannot be sent as regular JSON.
 */
export async function uploadCsv(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
}

/**
 * Fetches rows from the uploaded dataset.
 * Supports pagination and optional free-text search.
 */
export async function fetchRows({ limit = 50, offset = 0, search = "" } = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (search.trim()) {
    params.append("search", search.trim());
  }

  const response = await fetch(`${API_BASE_URL}/rows?${params.toString()}`);

  return handleResponse(response);
}

/**
 * Sends a natural-language question to the backend.
 */
export async function askQuestion(question) {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  return handleResponse(response);
}