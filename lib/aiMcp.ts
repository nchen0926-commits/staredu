/**
 * Minimal stateless MCP (Model Context Protocol) server over HTTP JSON-RPC, exposing ONE create-only tool.
 * No SDK needed: ChatGPT / other clients only need initialize, tools/list and tools/call.
 * Auth is done by the router in aiPublish.ts before a request gets here.
 */

type CreateFn = (body: unknown) => Promise<{ status: number; body: Record<string, unknown> }>;

const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];

const TOOL = {
  name: "create_article",
  title: "Create article on e-staredu.com",
  description:
    "Creates ONE article on the 小管家兒童理財 website (e-staredu.com). Create-only: cannot edit or delete. " +
    'status defaults to "draft". Use status "published" ONLY after the site owner (Nancy) has explicitly said to publish to the website. ' +
    "Call at most once per article; on a 409 (slug in use) ask the owner for a new slug instead of retrying.",
  inputSchema: {
    type: "object",
    required: ["title", "slug", "contentHtml"],
    properties: {
      title: { type: "string", maxLength: 200, description: "Article title; also the page H1 and search title." },
      slug: { type: "string", description: "URL name: lowercase letters, digits, hyphens (e.g. kids-money-tips). Must be unique; cannot start with art-." },
      excerpt: { type: "string", maxLength: 500, description: "Short summary shown in article lists." },
      seoDescription: { type: "string", maxLength: 300, description: "Meta description." },
      author: { type: "string", maxLength: 60 },
      category: { type: "string", enum: ["大人理財", "兒童理財", "企業永續", "金融科技"] },
      coverImage: { type: "string", description: "https URL of the cover image (optional)." },
      contentHtml: { type: "string", description: "Body HTML starting at the intro paragraph (no h1). Allowed: p, h2, h3, ul, ol, li, blockquote, strong, em, a, img, br." },
      status: { type: "string", enum: ["draft", "published"], default: "draft" },
      publishedAt: { type: "string", description: "Optional ISO 8601 time with offset, e.g. 2026-11-01T09:00:00+08:00. Future time = scheduled." },
    },
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
};

const ok = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });
const fail = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

async function handleOne(msg: any, create: CreateFn): Promise<unknown | null> {
  if (!msg || typeof msg !== "object" || typeof msg.method !== "string") return fail(msg?.id ?? null, -32600, "Invalid request");
  const { id, method } = msg;
  const isNotification = id === undefined || id === null;

  switch (method) {
    case "initialize": {
      const asked = String(msg.params?.protocolVersion ?? "");
      return ok(id, {
        protocolVersion: SUPPORTED.includes(asked) ? asked : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "e-staredu-article-publisher", version: "1.0.0" },
        instructions: "Create-only article publishing for e-staredu.com. Default to draft; publish only on the owner's explicit instruction.",
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: [TOOL] });
    case "tools/call": {
      if (msg.params?.name !== TOOL.name) return fail(id, -32602, `Unknown tool: ${String(msg.params?.name)}`);
      const result = await create(msg.params?.arguments ?? {});
      return ok(id, {
        content: [{ type: "text", text: JSON.stringify(result.body) }],
        isError: result.status >= 400,
      });
    }
    default:
      if (isNotification || method.startsWith("notifications/")) return null;
      return fail(id, -32601, `Method not found: ${method}`);
  }
}

/** Returns the JSON-RPC reply, or null when there is nothing to send back (notifications only). */
export async function handleMcp(body: unknown, create: CreateFn): Promise<unknown | null> {
  if (Array.isArray(body)) {
    const replies = (await Promise.all(body.map((m) => handleOne(m, create)))).filter((r) => r !== null);
    return replies.length ? replies : null;
  }
  return handleOne(body, create);
}
