"use server";

import { z } from "zod";
import { requireUser } from "@/server/auth/require-user";
import { getMetricsSnapshot } from "@/server/services/assistant-metrics";
import { answerWithMetrics } from "@/server/ai/assistant";

export type AskResult = { answer?: string; source?: "ai" | "deterministic"; error?: string };

const schema = z.string().trim().min(1).max(500);

export async function askAssistantAction(question: string): Promise<AskResult> {
  const user = await requireUser();
  const parsed = schema.safeParse(question);
  if (!parsed.success) return { error: "Please enter a question." };

  const { facts } = await getMetricsSnapshot(user.orgId);
  const { answer, source } = await answerWithMetrics(parsed.data, facts);
  return { answer, source };
}
