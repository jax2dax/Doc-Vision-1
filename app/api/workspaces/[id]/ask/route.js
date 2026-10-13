import { NextResponse } from "next/server";
import { failure, requireWorkspace } from "@/lib/auth/access";
import { answerQuestion } from "@/lib/rag/retrieve";

// Three sequential LLM calls plus vector search.
export const maxDuration = 60;

const MAX_QUESTION_CHARS = 2000;

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    await requireWorkspace(id);

    const body = await request.json().catch(() => ({}));
    const question = (body.question ?? "").trim();
    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }
    if (question.length > MAX_QUESTION_CHARS) {
      return NextResponse.json({ error: `Question exceeds ${MAX_QUESTION_CHARS} characters` }, { status: 400 });
    }

    try {
      return NextResponse.json(await answerQuestion({ workspaceId: id, question }));
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
  } catch (err) {
    return failure(err);
  }
}
