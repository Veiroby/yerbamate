import { prisma } from "@/lib/db";

export type AnalyticsPayload = Record<string, unknown>;

/**
 * Record an analytics event (server-side). Fire-and-forget; errors are logged but not thrown.
 */
export async function recordEvent(
  eventName: string,
  options: {
    sessionId?: string | null;
    userId?: string | null;
    payload?: AnalyticsPayload | null;
  } = {},
): Promise<void> {
  const { sessionId, userId, payload } = options;
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventName,
        sessionId: sessionId ?? undefined,
        userId: userId ?? undefined,
        payload: payload ? (payload as object) : undefined,
      },
    });
  } catch (err) {
    console.error("[analytics] recordEvent failed:", eventName, err);
  }
}
