import { NextResponse } from "next/server";
import { failure } from "@/lib/auth/access";
import { requireUser } from "@/lib/auth/session";
import { listIntellectSummaries } from "@/lib/intellects";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({ intellects: listIntellectSummaries() });
  } catch (err) {
    return failure(err);
  }
}
