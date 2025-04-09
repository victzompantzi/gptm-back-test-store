import { productosService } from "../service/producto-service.js";

(async () => {
  const pegaURL = new URL(window.location);

  const id = pegaURL.searchParams.get("id");

  const inputProducto = document.querySelector("[data-producto]");
  const inputPrecio = document.querySelector("[data-precio]");
  const inputCantidad = document.querySelector("[data-cantidad]");

  try {
    const datos = await productosService.detallarProductos(id);
    inputProducto.value = datos.producto;
    inputPrecio.value = datos.precio;
    inputCantidad.value = datos.cantidad;
  } catch (error) {
    console.log(error);
    window.location.href = "../views/error.html";
  }

  const formulario = document.querySelector("[data-form]");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    try {
      await productosService.actualizarProductos(
        id,
        inputProducto.value,
        inputPrecio.value,
        inputCantidad.value
      );
      window.location.href = "../views/edicion_concluida.html";
    } catch (error) {
      console.log(error);
      window.location.href = "../views/error.html";
    }
  });
})();
