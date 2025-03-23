import { productosService } from '../service/producto-service.js'


(async () => {
  const pegaURL = new URL(window.location)

  const id = pegaURL.searchParams.get('id')

  const inputProducto = document.querySelector('[data-nombre]')
  const inputPrecio = document.querySelector('[data-precio]')
  try {
    const datos = await productosService.detalhaCliente(id)
    inputProducto.value = datos.producto
    inputPrecio.value = datos.precio
  }
  catch (error) {
    console.log(error)
    window.location.href = "../vistas/error.html"
  }


  const formulario = document.querySelector('[data-form]')


  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    try {
      await productosService.actualizarProductos(id, inputProducto.value, inputPrecio.value)
      window.location.href = "../vistas/edicion_concluida.html"
    }
    catch (error) {
      console.log(error)
      window.location.href = "../vistas/error.html"
    }
  })
})()
