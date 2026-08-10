import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BUCKET = "product-media";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

// Crea el bucket público la primera vez (idempotente) y se asegura de que sea
// público aunque ya existiera privado. Así no hay que configurar nada a mano en
// Supabase: con sólo definir las variables de entorno, las subidas funcionan.
let bucketReady = false;
async function ensureBucket(supabase) {
  if (bucketReady) return;
  await supabase.storage.createBucket(BUCKET, { public: true });
  await supabase.storage.updateBucket(BUCKET, { public: true });
  bucketReady = true;
}
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

// Sube un archivo a Supabase Storage usando la service role (server-only) y
// devuelve la URL pública. Sólo admin.
export async function POST(req) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera el límite de 15 MB." },
        { status: 413 }
      );
    }
    const type = file.type || "application/octet-stream";
    if (!ALLOWED.includes(type)) {
      return NextResponse.json(
        { error: "Formato no permitido. Usá imágenes o video (MP4/WebM)." },
        { status: 415 }
      );
    }

    const rawExt = (file.name?.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const ext = rawExt || type.split("/")[1] || "bin";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabase();
    await ensureBucket(supabase);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: type, upsert: false });
    if (error) {
      console.error("Storage upload error:", error.message);
      return NextResponse.json(
        {
          error:
            "No se pudo subir el archivo. Revisá que exista el bucket público 'product-media' en Supabase.",
        },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo procesar la subida." }, { status: 500 });
  }
}
