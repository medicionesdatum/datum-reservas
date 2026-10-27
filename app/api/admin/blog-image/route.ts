import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const allowedImages: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecciona una imagen válida." }, { status: 400 });
  }

  const extension = allowedImages[file.type];
  if (!extension) {
    return NextResponse.json({ error: "La portada debe ser JPG, PNG o WebP." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen no puede superar los 5 MB." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const now = new Date();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("blog-images").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
