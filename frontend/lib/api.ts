export type WordRecord = {
  id: number;
  owner_id: string;
  word: string;
  part_of_speech: string;
  definition: string;
  example_sentence: string | null;
  shown_count: number;
  created_at: string;
  last_shown_at: string | null;
};

export type WordInput = {
  word: string;
  part_of_speech: string;
  definition: string;
  example_sentence?: string;
};

export type DrillResponse = {
  word: WordRecord | null;
  message?: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detailText = await response.text();
    let message = detailText || `Request failed with status ${response.status}`;

    try {
      const parsed = JSON.parse(detailText) as { detail?: string | Array<{ msg?: string }> };
      if (typeof parsed.detail === "string") {
        message = parsed.detail;
      } else if (Array.isArray(parsed.detail) && parsed.detail[0]?.msg) {
        message = parsed.detail[0].msg;
      }
    } catch {
      // Leave message as the raw response text when the body is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}


export async function checkWordExists(word: string): Promise<boolean> {
  const query = new URLSearchParams({ word });
  const result = await request<{ exists: boolean }>(`/api/words/exists?${query.toString()}`);
  return result.exists;
}

export async function addWord(payload: WordInput): Promise<WordRecord> {
  return request<WordRecord>("/api/words", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateWord(id: number, payload: WordInput): Promise<WordRecord> {
  return request<WordRecord>(`/api/words/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getWordCount(): Promise<number> {
  const result = await request<{ count: number }>("/api/words/count");
  return result.count;
}

export async function getDrillWord(excludeId?: number): Promise<DrillResponse> {
  const query = excludeId ? `?exclude_id=${excludeId}` : "";
  return request<DrillResponse>(`/api/words/drill${query}`);
}

export async function deleteWord(id: number): Promise<void> {
  await request<void>(`/api/words/${id}`, { method: "DELETE" });
}
