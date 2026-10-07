import { NextResponse } from "next/server";
import { createServiceClient, DEFAULT_USER_ID } from "@/lib/supabase/server";
import { answerQuestion } from "@/lib/rag/retrieve";

// Three sequential LLM calls plus vector search.
export const maxDuration = 60;

const MAX_QUESTION_CHARS = 2000;

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const question = (body.question ?? "").trim();

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return NextResponse.json({ error: `Question exceeds ${MAX_QUESTION_CHARS} characters` }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", id)
    .eq("owner_id", DEFAULT_USER_ID)
    .maybeSingle();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  try {
    const result = await answerQuestion({ workspaceId: id, question });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
