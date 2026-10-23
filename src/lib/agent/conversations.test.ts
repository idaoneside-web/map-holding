/**
 * MAP HOLDING — BUSINESS AGENT: conversation model tests (Phase 3).
 *
 * Run via the root `npm test` script alongside the access-contract suite
 * (node --test, no framework added).
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACTIVE_CONVERSATION_STORAGE_KEY,
  CLIENT_ACTIVE_CONVERSATION_STORAGE_KEY,
  CONVERSATIONS_STORAGE_KEY,
  deriveTitle,
  loadActiveConversationId,
  loadConversations,
  MAX_CONVERSATIONS,
  newConversationId,
  resolveActiveConversationId,
  sanitizeUserMessage,
  saveActiveConversationId,
  saveConversations,
  toModelPayload,
  type AgentChatMessage,
  type AgentConversation,
  type AgentStorageLike,
} from "./conversations.ts";

class MemoryStorage implements AgentStorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

function msg(
  role: AgentChatMessage["role"],
  content: string,
  extra: Partial<AgentChatMessage> = {},
): AgentChatMessage {
  return { role, content, at: "2026-07-10T00:00:00.000Z", ...extra };
}

test("sanitizeUserMessage trims and caps input", () => {
  assert.equal(sanitizeUserMessage("  hello world "), "hello world");
  const long = "x".repeat(9000);
  assert.equal(sanitizeUserMessage(long).length, 8000);
  assert.equal(sanitizeUserMessage("   "), "");
});

test("deriveTitle uses the first user message and bounds its length", () => {
  assert.equal(deriveTitle([]), "New conversation");
  assert.equal(
    deriveTitle([msg("user", "how do we structure a JV?")]),
    "how do we structure a JV?",
  );
  // 57 characters plus the ellipsis: the title is never longer than 60.
  assert.equal(deriveTitle([msg("user", "a".repeat(80))]).length, 58);
});

test("toModelPayload drops failed attempts, empties and the head beyond context", () => {
  const many = Array.from({ length: 40 }, (_, i) =>
    msg(i % 2 === 0 ? ("user" as const) : ("assistant" as const), `m${i}`),
  );
  const payload = toModelPayload(many);
  assert.equal(payload.length, 30);
  assert.equal(payload[0].content, "m10");
  const mixed = [
    msg("user", "q"),
    msg("assistant", "", {}),
    { ...msg("assistant", "answer"), failed: true },
    msg("user", "next"),
  ];
  assert.deepEqual(toModelPayload(mixed), [
    { role: "user", content: "q" },
    { role: "user", content: "next" },
  ]);
});

test("newConversationId returns a non-empty unique string", () => {
  const a = newConversationId();
  const b = newConversationId();
  assert.equal(typeof a, "string");
  assert.notEqual(a, b);
});

test("storage round-trip preserves valid data, newest-first and bounded", () => {
  const storage = new MemoryStorage();
  const convs: AgentConversation[] = [
    { id: "c1", title: "first", createdAt: "2026-01-01", messages: [msg("user", "hi")] },
    { id: "c2", title: "second", createdAt: "2026-01-02", messages: [msg("user", "yo")] },
  ];
  saveConversations(storage, convs);
  const loaded = loadConversations(storage);
  assert.deepEqual(
    loaded.map((c) => c.id),
    ["c1", "c2"],
  );

  // Bounding: more than the cap survives only its newest entries.
  const overflow: AgentConversation[] = Array.from({ length: MAX_CONVERSATIONS + 5 }, (_, i) => ({
    id: `conv-${i}`,
    title: "t",
    createdAt: "now",
    messages: [],
  }));
  saveConversations(storage, overflow);
  assert.equal(loadConversations(storage).length, MAX_CONVERSATIONS);
});

test("corrupt or hostile storage is dropped, never thrown", () => {
  const storage = new MemoryStorage();
  storage.setItem(CONVERSATIONS_STORAGE_KEY, "{not json");
  assert.deepEqual(loadConversations(storage), []);
  storage.setItem(CONVERSATIONS_STORAGE_KEY, '{"id": 42}');
  assert.deepEqual(loadConversations(storage), []);
  storage.setItem(CONVERSATIONS_STORAGE_KEY, '[{"id":"x","title":"t","createdAt":"c"}]');
  // Missing or malformed `messages` entry is filtered out.
  assert.deepEqual(loadConversations(storage), []);
});

test("open-conversation marker: survives a refresh and degrades safely", () => {
  const storage = new MemoryStorage();
  // Absent marker: restoring falls back to the most recent conversation.
  const convs: AgentConversation[] = [
    { id: "newest", title: "n", createdAt: "2026-01-03", messages: [msg("user", "x")] },
    { id: "older", title: "o", createdAt: "2026-01-02", messages: [msg("user", "y")] },
  ];
  saveConversations(storage, convs);
  assert.equal(loadActiveConversationId(storage, ACTIVE_CONVERSATION_STORAGE_KEY), null);
  assert.equal(
    resolveActiveConversationId(null, loadConversations(storage)),
    "newest",
  );

  // Deliberate blank (user pressed "New conversation") stays blank.
  saveActiveConversationId(storage, null, ACTIVE_CONVERSATION_STORAGE_KEY);
  assert.equal(loadActiveConversationId(storage, ACTIVE_CONVERSATION_STORAGE_KEY), "");
  assert.equal(resolveActiveConversationId("", loadConversations(storage)), null);

  // The open id is restored on the next load, even when another tab evicted
  // nothing: the marker + list both come from this browser's storage.
  saveActiveConversationId(storage, "older", ACTIVE_CONVERSATION_STORAGE_KEY);
  assert.equal(
    resolveActiveConversationId(
      loadActiveConversationId(storage, ACTIVE_CONVERSATION_STORAGE_KEY),
      loadConversations(storage),
    ),
    "older",
  );

  // A marker pointing at an evicted (trimmed-away) conversation falls back
  // to the most recent one instead of a dead link.
  saveActiveConversationId(storage, "gone", ACTIVE_CONVERSATION_STORAGE_KEY);
  assert.equal(
    resolveActiveConversationId(
      loadActiveConversationId(storage, ACTIVE_CONVERSATION_STORAGE_KEY),
      loadConversations(storage),
    ),
    "newest",
  );

  // Hostile/malformed marker values are dropped, never trusted.
  storage.setItem(ACTIVE_CONVERSATION_STORAGE_KEY, "script-injection!!<>");
  assert.equal(loadActiveConversationId(storage, ACTIVE_CONVERSATION_STORAGE_KEY), null);
  storage.setItem(CLIENT_ACTIVE_CONVERSATION_STORAGE_KEY, "client-open");
  assert.equal(
    loadActiveConversationId(storage, CLIENT_ACTIVE_CONVERSATION_STORAGE_KEY),
    "client-open",
  );
});
