import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validators";

export async function GET() {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId;
  } catch {
    // Clerk not configured
  }
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_user_profile", {
      p_clerk_id: userId,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    // Fallback: se profile não existe, criar automaticamente com dados do Clerk
    if (!data) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const handle = clerkUser.username || `user_${userId.slice(-8)}`;
        const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || handle;
        const avatarUrl = clerkUser.imageUrl || null;

        const { error: createError } = await supabase.rpc("create_profile", {
          p_clerk_id: userId,
          p_handle: handle,
          p_display_name: displayName,
          p_avatar_url: avatarUrl,
        });

        if (createError) {
          console.error("[auth/profile] Auto-create error:", createError);
          return NextResponse.json(
            { error: "profile_creation_failed", message: createError.message },
            { status: 500 },
          );
        }

        // Re-fetch o profile criado
        const { data: newData } = await supabase.rpc("get_user_profile", {
          p_clerk_id: userId,
        });

        return NextResponse.json(newData);
      } catch (clerkErr) {
        console.error("[auth/profile] Clerk fallback error:", clerkErr);
        return NextResponse.json(
          { error: "profile_not_found" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[auth/profile] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId;
  } catch {
    // Clerk not configured
  }
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const supabase = await createClient();

    const handle: string =
      body.handle || `user_${userId.slice(-8)}`;
    const displayName: string = body.display_name || handle;
    const avatarUrl: string | null = body.avatar_url || null;

    const { data, error } = await supabase.rpc("create_profile", {
      p_clerk_id: userId,
      p_handle: handle,
      p_display_name: displayName,
      p_avatar_url: avatarUrl,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data }, { status: 201 });
  } catch (err) {
    console.error("[auth/profile] POST error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId;
  } catch {
    // Clerk not configured
  }
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("update_profile", {
      p_clerk_id: userId,
      p_display_name: parsed.data.display_name || null,
      p_handle: parsed.data.handle || null,
      p_bio: parsed.data.bio || null,
      p_full_name: parsed.data.full_name || null,
      p_cpf: parsed.data.cpf || null,
      p_date_of_birth: parsed.data.date_of_birth || null,
      p_phone: parsed.data.phone || null,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[auth/profile] PATCH error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
