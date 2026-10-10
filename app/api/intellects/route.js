import { NextResponse } from "next/server";
import { listIntellectSummaries } from "@/lib/intellects";

export async function GET() {
  return NextResponse.json({ intellects: listIntellectSummaries() });
}
