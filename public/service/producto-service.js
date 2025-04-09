const BASE_PATH = "/productos";

const listarProductos = () => {
  return fetch(`${BASE_PATH}`, { credentials: "include" }).then((response) => {
    if (response.ok) {
      return response.json();
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
    credentials: "include",
    body: JSON.stringify({
      producto: producto,
      precio: precio,
      cantidad: cantidad,
    }),
  }).then((response) => {
    if (response.ok) {
      return response.body;
    }
    throw new Error("Ocurrio in error");
  });
};

const eliminarProductos = (id) => {
  return fetch(`${BASE_PATH}/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Ocurrio in error");
    }
  });
};

const detallarProductos = (id) => {
  return fetch(`${BASE_PATH}/${id}`, { credentials: "include" }).then(
    (response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Ocurrio in error");
    }
  );
};

const actualizarProductos = (id, producto, precio, cantidad) => {
  return fetch(`${BASE_PATH}/${id}`, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      producto: producto,
      precio: precio,
      cantidad: cantidad,
    }),
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    throw new Error("Ocurrio in error");
  });
};

export const productosService = {
  listarProductos,
  crearProductos,
  eliminarProductos,
  detallarProductos,
  actualizarProductos,
};
