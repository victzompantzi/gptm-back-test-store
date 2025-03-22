import { clienteService } from '../service/cliente-service.js'

const crearNuevaLinea = (nombre, email, id) => {
  const lineaNuevoCliente = document.createElement('tr')
  const contenido = `
      <td class="td" data-td>${nombre}</td>
                  <td>${email}</td>
                  <td>
                      <ul class="tabla__botoes-controle">
                          <li><a href="../vistas/edita_cliente.html?id=${id}" class="boton-simple boton-simple--editar">Editar</a></li>
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
      await clienteService.removeCliente(id)
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
    const listaClientes = await clienteService.listaClientes()
    listaClientes.forEach(elemento => {
      tabla.appendChild(crearNuevaLinea(elemento.nombre, elemento.email, elemento.id))
    })
  }
  catch (error) {
    console.log(error)
    window.location.href = "../vistas/error.html"
  }

}

render()