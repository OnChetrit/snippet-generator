import type { SavedSnippet, SnippetDetails } from '../types/snippet';

const STORAGE_KEY = 'snippet-studio.saved-snippets';

export function loadSavedSnippets(): SavedSnippet[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const snippets: unknown = JSON.parse(stored);
    return Array.isArray(snippets) ? snippets.filter(isSavedSnippet) : [];
  } catch {
    return [];
  }
}

export function saveSnippet(
  snippets: SavedSnippet[],
  details: SnippetDetails,
  body: string,
  id?: string | null,
): { snippet: SavedSnippet; snippets: SavedSnippet[] } {
  const now = new Date().toISOString();
  const existing = id ? snippets.find((snippet) => snippet.id === id) : undefined;
  const snippet: SavedSnippet = {
    id: existing?.id ?? createId(),
    details: { ...details },
    body,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const next = [
    snippet,
    ...snippets.filter((savedSnippet) => savedSnippet.id !== snippet.id),
  ];

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return { snippet, snippets: next };
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `snippet-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isSavedSnippet(value: unknown): value is SavedSnippet {
  if (!value || typeof value !== 'object') return false;

  const snippet = value as Partial<SavedSnippet>;
  return (
    typeof snippet.id === 'string' &&
    typeof snippet.body === 'string' &&
    Boolean(snippet.details) &&
    typeof snippet.details?.snippetName === 'string'
  );
}
