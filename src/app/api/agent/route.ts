import { streamText, stepCountIs } from "ai";
import { auth } from "@/lib/auth/config";
import { agentModel, SYSTEM_PROMPT } from "@/lib/agent";
import { createAgentTools } from "@/lib/agent/tools";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  const tools = createAgentTools(session.user.id);

  const result = streamText({
    model: agentModel,
    system: SYSTEM_PROMPT,
    messages,
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
