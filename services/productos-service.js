const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = true;

const PRODUCTOS_COLLECTION = 'productos';

module.exports = class productosService {
  constructor() { }

  static async init() {
    console.log(`process.env.DB_USER: ${process.env.DB_USER}`);
    console.log(`process.env.DB_PASSWORD: ${process.env.DB_PASSWORD}`);
    console.log(`process.env.CONNECT_STRING: ${process.env.CONNECT_STRING}`);

    try {
      console.log('Creando pool de conexiones...')
      await oracledb.createPool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.CONNECT_STRING,
      });
      console.log('Pool de conexiones creado.')
      return new productosService();
    } catch (e) {
      console.log('Error en conexion: ');
      console.log(e);
    }
  }

  async getAll() {
    let connection;
    const result = [];

    try {
      connection = await oracledb.getConnection();

      const soda = connection.getSodaDatabase();
      const productosCollection = await soda.createCollection(PRODUCTOS_COLLECTION);
      let productos = await productosCollection.find().getDocuments();
      productos.forEach((element) => {
        result.push({
          id: element.key,
          createdOn: element.createdOn,
          lastModified: element.lastModified,
          ...element.getContent(),
        });
      });
    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        try {
          await connection.close();
        }
        catch (err) {
          console.error(err);
        }
      }
    }
    return result;
  }

  async getById(productoId) {
    let connection, producto, result;

    try {
      connection = await oracledb.getConnection();

      const soda = connection.getSodaDatabase();
      const clientesCollection = await soda.createCollection(PRODUCTOS_COLLECTION);
      producto = await clientesCollection.find().key(productoId).getOne();
      result = {
        id: producto.key,
        createdOn: producto.createdOn,
        lastModified: producto.lastModified,
        ...producto.getContent(),
      };

    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        try {
          await connection.close();
        }
        catch (err) {
          console.error(err);
        }
      }
    }

    return result;
  }

  async save(cliente) {
    let connection, novoCliente, result;

    try {
      connection = await oracledb.getConnection();
      const soda = connection.getSodaDatabase();
      const clientesCollection = await soda.createCollection(PRODUCTOS_COLLECTION);
      /*
          insertOneAndGet() does not return the doc
          for performance reasons
          see: http://oracle.github.io/node-oracledb/doc/api.html#sodacollinsertoneandget
      */
      novoCliente = await clientesCollection.insertOneAndGet(cliente);
      result = {
        id: novoCliente.key,
        createdOn: novoCliente.createdOn,
        lastModified: novoCliente.lastModified,
      };
    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        try {
          await connection.close();
        }
        catch (err) {
          console.error(err);
        }
      }
    }

    return result;
  }

  async update(id, producto) {
    let connection, result;

    try {
      connection = await oracledb.getConnection();
      const soda = connection.getSodaDatabase();
      const productosCollection = await soda.createCollection(PRODUCTOS_COLLECTION);
      producto = await productosCollection.find().key(id).replaceOneAndGet(producto);
      result = {
        id: producto.key,
        createdOn: producto.createdOn,
        lastModified: producto.lastModified,
      };
    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        try {
          await connection.close();
        }
        catch (err) {
          console.error(err);
        }
      }
    }

    return result;
  }

  async deleteById(productoId) {
    let connection;
    let removed = false;

    try {
      connection = await oracledb.getConnection();

      const soda = connection.getSodaDatabase();
      const productosCollection = await soda.createCollection(PRODUCTOS_COLLECTION);
      removed = await productosCollection.find().key(productoId).remove();

    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        try {
          await connection.close();
        }
        catch (err) {
          console.error(err);
        }
      }
    }
    return removed;
  }

  async closePool() {
    console.log('Closing connection pool...');
    try {
      await oracledb.getPool().close(10);
      console.log('Pool closed');
    } catch (err) {
      console.error(err);
    }
  }
}
