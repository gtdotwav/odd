import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  try {
    const { handle } = await params;

    if (!handle || handle.length > 50) {
      return NextResponse.json(
        { error: "invalid_handle" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_profile", {
      p_handle: handle,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "user_not_found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[users/handle] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
