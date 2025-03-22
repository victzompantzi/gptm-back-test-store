import { clienteService } from '../service/cliente-service.js'


(async () => {
  const pegaURL = new URL(window.location)

  const id = pegaURL.searchParams.get('id')

  const inputNome = document.querySelector('[data-nombre]')
  const inputEmail = document.querySelector('[data-email]')
  try {
    const dados = await clienteService.detalhaCliente(id)
    inputNome.value = dados.nombre
    inputEmail.value = dados.email
  }
  catch (error) {
    console.log(error)
    window.location.href = "../vistas/error.html"
  }


  const formulario = document.querySelector('[data-form]')


  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    try {
      await clienteService.actualizaClientes(id, inputNome.value, inputEmail.value)
      window.location.href = "../vistas/edicion_concluida.html"
    }
    catch (error) {
      console.log(error)
      window.location.href = "../vistas/error.html"
    }
  })
})()
