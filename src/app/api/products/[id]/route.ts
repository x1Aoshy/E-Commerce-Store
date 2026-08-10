import { NextResponse } from "next/server";
import { updateProduct, deleteProduct } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req, props) {
  const params = await props.params;
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  try {
    const product = await updateProduct(params.id, body);
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar el producto." }, { status: 500 });
  }
}

// Elimina un producto (sólo admin). 404 si no existía, 200 {ok:true} si se
// borró. El try/catch garantiza que ante cualquier fallo devolvamos JSON con
// error (500) en vez de una excepción sin capturar.
export async function DELETE(req, props) {
  const params = await props.params;
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const deleted = await deleteProduct(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo eliminar el producto." }, { status: 500 });
  }
}
