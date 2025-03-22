import { clienteService } from '../service/cliente-service.js'

const formulario = document.querySelector('[data-form]')


formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault()
  try {
    const nombre = evento.target.querySelector('[data-nombre]').value
    const email = evento.target.querySelector('[data-email]').value

    await clienteService.criaCliente(nombre, email)
    window.location.href = '../vistas/registro_concluido.html'
  }
  catch (error) {
    console.log(error)
    window.location.href = "../vistas/error.html"
  }
})