const BASE_PATH = "/productos";

const listarProductos = () => {
  return fetch(`${BASE_PATH}`).then((resposta) => {
    if (resposta.ok) {
      return resposta.json();
    }
    throw new Error("Ocurrio in error");
  });
};

const crearProductos = (producto, precio, cantidad) => {
  return fetch(`${BASE_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      producto: producto,
      precio: precio,
      cantidad: cantidad,
    }),
  }).then((resposta) => {
    if (resposta.ok) {
      return resposta.body;
    }
    throw new Error("Ocurrio in error");
  });
};

const eliminarProductos = (id) => {
  return fetch(`${BASE_PATH}/${id}`, {
    method: "DELETE",
  }).then((resposta) => {
    if (!resposta.ok) {
      throw new Error("Ocurrio in error");
    }
  });
};

const detallarProductos = (id) => {
  return fetch(`${BASE_PATH}/${id}`).then((resposta) => {
    if (resposta.ok) {
      return resposta.json();
    }

    throw new Error("Ocurrio in error");
  });
};

const actualizarProductos = (id, producto, precio, cantidad) => {
  return fetch(`${BASE_PATH}/${id}`, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      producto: producto,
      precio: precio,
      cantidad: cantidad,
    }),
  }).then((resposta) => {
    if (resposta.ok) {
      return resposta.json();
    }
    throw new Error("Ocurrio in error");
  });
};

// TODO conts pagarProductos 

const openModal = function () {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
};

export const productosService = {
  listarProductos,
  crearProductos,
  eliminarProductos,
  detallarProductos,
  actualizarProductos,
};
