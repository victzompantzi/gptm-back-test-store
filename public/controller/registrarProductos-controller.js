import { productosService } from "../service/producto-service.js";

const formulario = document.querySelector("[data-form]");

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  try {
    const producto = evento.target.querySelector("[data-producto]").value;
    const precio = evento.target.querySelector("[data-precio]").value;
    const cantidad = evento.target.querySelector("[data-cantidad]").value;

    await productosService.crearProductos(producto, precio, cantidad);
    window.location.href = "../vistas/registro_concluido.html";
  } catch (error) {
    console.log(error);
    window.location.href = "../vistas/error.html";
  }
});
