import { productosService } from '../service/producto-service.js'

const crearNuevaLinea = (producto, precio, id) => {
  const lineaNuevoCliente = document.createElement('tr')
  const contenido = `
      <td class="td" data-td>${producto}</td>
                  <td>${precio}</td>
                  <td>
                      <ul class="tabla__botoes-controle">
                          <li><a href="../vistas/editar_producto.html?id=${id}" class="boton-simple boton-simple--editar">Editar</a></li>
                          <li><button class="boton-simple boton-simple--excluir" type="button">Eliminar</button></li>
                      </ul>
                  </td>
                  `
  lineaNuevoCliente.innerHTML = contenido
  lineaNuevoCliente.dataset.id = id
  return lineaNuevoCliente
}


const tabla = document.querySelector('[data-tabla]')

tabla.addEventListener('click', async (evento) => {
  let esBotonEliminar = evento.target.className === 'boton-simple boton-simple--excluir'
  if (esBotonEliminar) {
    try {
      const lineaCliente = evento.target.closest('[data-id]')
      let id = lineaCliente.dataset.id
      await productosService.eliminarProductos(id)
      lineaCliente.remove()
    }
    catch (error) {
      console.log(error)
      window.location.href = "../vistas/error.html"
    }
  }
})


const render = async () => {
  try {
    const listarProductos = await productosService.listarProductos()
    listarProductos.forEach(elemento => {
      tabla.appendChild(crearNuevaLinea(elemento.producto, elemento.precio, elemento.id))
    })
  }
  catch (error) {
    console.log(error)
    window.location.href = "../vistas/error.html"
  }

}

render()