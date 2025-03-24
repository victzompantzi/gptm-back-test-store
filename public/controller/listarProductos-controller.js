import { productosService } from "../service/producto-service.js";

const crearNuevaLinea = (producto, cantidad, precio, id) => {
  const lineaNuevoProducto = document.createElement("tr");
  const contenido = `
      <td class="td" data-td>${producto}</td>
                  <td>${cantidad}</td>
                  <td>${precio}</td>
                  <td>
                      <ul class="tabla__botoes-controle">
                          <li><a href="../vistas/editar_producto.html?id=${id}" class="boton-simple boton-simple--editar">Editar</a></li>
                          <li><button class="boton-simple boton-simple--excluir" type="button">Eliminar</button></li>
                      </ul>
                  </td>
                  `;
  lineaNuevoProducto.innerHTML = contenido;
  lineaNuevoProducto.dataset.id = id;
  return lineaNuevoProducto;
};

const tabla = document.querySelector("[data-tabla]");

tabla.addEventListener("click", async (evento) => {
  let esBotonEliminar =
    evento.target.className === "boton-simple boton-simple--excluir";
  if (esBotonEliminar) {
    try {
      const lineaCliente = evento.target.closest("[data-id]");
      let id = lineaCliente.dataset.id;
      await productosService.eliminarProductos(id);
      lineaCliente.remove();
    } catch (error) {
      console.log(error);
      window.location.href = "../vistas/error.html";
    }
  }
});

// Implementa un acumulador a través de la función 'reduce' sobre el array de productos para obtener el total
const calcularTotal = (productos) => {
  return productos.reduce(
    (acc, { precio, cantidad }) => acc + Number(precio) * Number(cantidad),
    0
  );
};

const render = async () => {
  try {
    const listarProductos = await productosService.listarProductos();
    listarProductos.forEach((elemento) => {
      tabla.appendChild(
        crearNuevaLinea(
          elemento.producto,
          elemento.cantidad,
          elemento.precio,
          elemento.id
        )
      );
    });
    // Calculate total and display it at the end of the table
    const total = calcularTotal(listarProductos);
    const trTotal = document.createElement("tr");
    trTotal.innerHTML = `<td colspan="3"><strong>Total</strong></td><td><strong>$ ${total}</strong></td>`;
    tabla.appendChild(trTotal);
  } catch (error) {
    console.log(error);
    window.location.href = "../vistas/error.html";
  }
};

render();
