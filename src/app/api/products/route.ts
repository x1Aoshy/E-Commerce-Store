import { NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ products: await getProducts() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudieron leer los productos." }, { status: 500 });
  }
}

export async function POST(req) {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  try {
    const product = await createProduct(body);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo crear el producto." }, { status: 500 });
  }
}
