import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const VALID_DOC_TYPES = ["id_front", "proof_address"];

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(ip, { interval: 60_000, limit: 5 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "rate_limited", message: "Muitas tentativas. Aguarde 1 minuto." },
      { status: 429 },
    );
  }

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
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });
    }

    if (!docType || !VALID_DOC_TYPES.includes(docType)) {
      return NextResponse.json({ error: "Tipo de documento inválido" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande (máx. 5MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou PDF." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${userId}/${docType}_${Date.now()}.${ext}`;

    const supabase = await createClient();

    // Upload para Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("kyc-documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[kyc/upload] Storage error:", uploadError);
      return NextResponse.json(
        { error: "upload_failed", message: uploadError.message },
        { status: 500 },
      );
    }

    // Registrar no banco
    const { data, error } = await supabase.rpc("submit_kyc_document", {
      p_clerk_id: userId,
      p_type: docType,
      p_storage_path: storagePath,
      p_original_filename: file.name,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[kyc/upload] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
