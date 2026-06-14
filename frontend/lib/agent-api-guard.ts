import { NextResponse } from "next/server";

export function agentApiGuard(request: Request): NextResponse | null {
  const secret = process.env.AGENT_API_SECRET;
  if (!secret) {
    console.error("[agent-api] AGENT_API_SECRET not configured");
    return NextResponse.json({ error: "Agent API not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
