import { productosService } from '../service/producto-service.js'

const formulario = document.querySelector('[data-form]')


formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault()
  try {
    const nombre = evento.target.querySelector('[data-nombre]').value
    const email = evento.target.querySelector('[data-precio]').value

    await productosService.crearProductos(nombre, email)
    window.location.href = '../vistas/registro_concluido.html'
  }
  catch (error) {
    console.log(error)
    window.location.href = "../vistas/error.html"
  }
})