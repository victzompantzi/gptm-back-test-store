/* Copyright (c) 2021, Oracle and/or its affiliates. All rights reserved. */

/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, withOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * The node-oracledb test suite uses 'mocha', 'should' and 'async'.
 * See LICENSE.md for relevant licenses.
 *
 * NAME
 *   246. dupColNames1.js
 *
 * DESCRIPTION
 *   Test cases to detect duplicate column names and suffix for col names
 *
 *****************************************************************************/
'use strict';

const oracledb = require('oracledb');
const should   = require('should');
const dbconfig = require('./dbconfig.js');

describe('246. dupColNames1.js', function() {
  let connection = null;
  let outFormatBak = oracledb.outFormat;
  const tableNameDept = "nodb_dupDepartment";
  const tableNameEmp = "nodb_dupEmployee";
  const create_table_sql = `
      BEGIN
            DECLARE
                e_table_missing EXCEPTION;
                PRAGMA EXCEPTION_INIT(e_table_missing, -00942);
            BEGIN
                EXECUTE IMMEDIATE ('DROP TABLE nodb_dupDepartment');
            EXCEPTION
                WHEN e_table_missing
                THEN NULL;
            END;
            EXECUTE IMMEDIATE ('
                CREATE TABLE nodb_dupDepartment (
                    department_id NUMBER,
                    department_name VARCHAR2(20)
                )
            ');
        END; `;
  const deptInsert = "INSERT INTO " + tableNameDept + " VALUES( :1, :2)";
  const create_table_emp_sql = `
        BEGIN
             DECLARE
                 e_table_missing EXCEPTION;
                 PRAGMA EXCEPTION_INIT(e_table_missing, -00942);
             BEGIN
                 EXECUTE IMMEDIATE('DROP TABLE nodb_dupEmployee PURGE');
             EXCEPTION
                 WHEN e_table_missing
                 THEN NULL;
             END;
             EXECUTE IMMEDIATE ('
                 CREATE TABLE nodb_dupEmployee (
                     employee_id NUMBER,
                     department_id NUMBER,
                     employee_name VARCHAR2(20)
                 )
             ');
         END; `;
  const empInsert = "INSERT INTO " + tableNameEmp + " VALUES ( :1, :2, :3) ";

  var traverse_rows = async function(resultSet) {
    const fetchedRows = [];
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const row = await resultSet.getRow();
        if (!row) {
          break;
        }
        fetchedRows.push(row);
      }
      return fetchedRows;
    } catch (err) {
      should.not.exist(err);
    }

  };

  var  traverse_results = async function(resultSet) {
    const fetchedRows = [];
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const row = await resultSet.getRow();
        if (!row) {
          break;
        }
        for (const i in row) {
          if (row[i] instanceof oracledb.ResultSet) {
            row[i] = await traverse_results(row[i]);
          }
        }
        fetchedRows.push(row);
      }
      return fetchedRows;
    } catch (err) {
      should.not.exist(err);
    }

  };

  before(async function() {
    try {
      // set the outformat to object
      oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

      connection = await oracledb.getConnection (dbconfig);

      await connection.execute(create_table_sql);
      await connection.execute(deptInsert, [101, "R&D"]);
      await connection.execute(deptInsert, [201, "Sales"]);
      await connection.execute(deptInsert, [301, "Marketing"]);

      await connection.execute(create_table_emp_sql);
      await connection.execute(empInsert, [1001, 101, "Krishna Mohan"]);
      await connection.execute(empInsert, [1002, 102, "P Venkatraman"]);
      await connection.execute(empInsert, [2001, 201, "Chris Jones"]);
      await connection.execute(empInsert, [3001, 301, "John Millard"]);

      await connection.commit();
    } catch (err) {
      should.not.exist(err);
    }
  });

  after(async function() {
    try {
      await connection.execute("DROP TABLE nodb_dupEmployee PURGE");
      await connection.execute("DROP TABLE nodb_dupDepartment PURGE");
      await connection.commit();
      await connection.close();

      oracledb.outFormat = outFormatBak;
    } catch (err) {
      should.not.exist(err);
    }
  });

  describe('246.1 Duplicate column names, query with simple execution', function() {
    it('246.1.1 Two duplicate columns', async function() {
      let sql =
        `SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_NAME
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
         ORDER BY A.EMPLOYEE_ID`;

      let result = await connection.execute(sql);
      should.equal(result.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.metaData[3].name, "DEPARTMENT_NAME");
      should.equal(result.rows[0].EMPLOYEE_ID, 1001);
      should.equal(result.rows[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[1].DEPARTMENT_ID_1, 201);
      should.equal(result.rows[1].DEPARTMENT_NAME, "Sales");
    });

    it('246.1.2 Three duplicate columns', async function() {
      let sql =
        `SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
         ORDER BY A.EMPLOYEE_ID`;

      let result = await connection.execute(sql);
      should.equal(result.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.metaData[3].name, "DEPARTMENT_ID_2");
      should.equal(result.rows[0].EMPLOYEE_ID, 1001);
      should.equal(result.rows[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_1, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_2, 101);
    });

    it('246.1.3 Duplicate column with conflicting alias name', async function() {
      let sql =
        `SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID AS DEPARTMENT_ID_1
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
         ORDER BY A.EMPLOYEE_ID`;

      let result = await connection.execute(sql);
      should.equal(result.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].name, "DEPARTMENT_ID_2");
      should.equal(result.metaData[3].name, "DEPARTMENT_ID_1");
      should.equal(result.rows[0].EMPLOYEE_ID, 1001);
      should.equal(result.rows[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_1, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_2, 101);
    });

    it('246.1.4 Duplicate column with non-conflicting alias name', async function() {
      let sql =
        `SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID AS DEPARTMENT_ID_5
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
         ORDER BY A.EMPLOYEE_ID`;

      let result = await connection.execute(sql);
      should.equal(result.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.metaData[3].name, "DEPARTMENT_ID_5");
      should.equal(result.rows[0].EMPLOYEE_ID, 1001);
      should.equal(result.rows[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_1, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_5, 101);
    });

    it('246.1.5 Negative not-case sensitive', async function() {
      // alias name is within quotes and so does not match any string
      // comparison
      let sql =
        `SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.department_id, B.department_id AS "department_id_1"
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.department_id = B.department_id
         ORDER BY A.EMPLOYEE_ID`;

      let result = await connection.execute(sql);
      should.equal(result.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.metaData[3].name, "department_id_1");
      should.equal(result.rows[0].EMPLOYEE_ID, 1001);
      should.equal(result.rows[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_1, 101);
      should.equal(result.rows[0].department_id_1, 101);
    });

    it('246.1.6 Two Dupliate columns using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME, B.DEPARTMENT_ID,
               cursor(SELECT A.EMPLOYEE_NAME, A.DEPARTMENT_ID , A.DEPARTMENT_ID
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                       ORDER BY A.EMPLOYEE_NAME
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql);
      should.equal(result.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].name, "NC");
      should.equal(result.metaData[2].metaData[0].name, "EMPLOYEE_NAME");
      should.equal(result.metaData[2].metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.rows[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].DEPARTMENT_NAME, "R&D");
      should.equal(result.rows[0].NC[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID_1, 101);
    });

    it('246.1.7 Three dupliate columns using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME , B.DEPARTMENT_ID , B.DEPARTMENT_ID,
               cursor(SELECT A.EMPLOYEE_NAME , A.DEPARTMENT_ID
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql);
      should.equal(result.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.metaData[3].name, "NC");
      should.equal(result.metaData[3].metaData[0].name, "EMPLOYEE_NAME");
      should.equal(result.metaData[3].metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.rows[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_1, 101);
      should.equal(result.rows[0].DEPARTMENT_NAME, "R&D");
      should.equal(result.rows[0].NC[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID, 101);
    });

    it('246.1.8 Three dupliate columns using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME , B.DEPARTMENT_ID,
               cursor(SELECT A.EMPLOYEE_NAME , A.DEPARTMENT_ID , A.DEPARTMENT_ID , A.DEPARTMENT_ID
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql);
      should.equal(result.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].name, "NC");
      should.equal(result.metaData[2].metaData[0].name, "EMPLOYEE_NAME");
      should.equal(result.metaData[2].metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.metaData[2].metaData[3].name, "DEPARTMENT_ID_2");
      should.equal(result.rows[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].DEPARTMENT_NAME, "R&D");
      should.equal(result.rows[0].NC[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID_1, 101);
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID_2, 101);
    });

    it('246.1.9 Duplicate column with conflicting alias name using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME , B.DEPARTMENT_ID,
               cursor(SELECT A.EMPLOYEE_NAME , A.DEPARTMENT_ID , A.DEPARTMENT_ID , A.DEPARTMENT_ID AS DEPARTMENT_ID_1
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql);
      should.equal(result.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].name, "NC");
      should.equal(result.metaData[2].metaData[0].name, "EMPLOYEE_NAME");
      should.equal(result.metaData[2].metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].metaData[2].name, "DEPARTMENT_ID_2");
      should.equal(result.metaData[2].metaData[3].name, "DEPARTMENT_ID_1");
      should.equal(result.rows[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].DEPARTMENT_NAME, "R&D");
      should.equal(result.rows[0].NC[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID_1, 101);
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID_2, 101);
    });

    it('246.1.10 Duplicate column with non-conflicting alias name using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME , B.DEPARTMENT_ID,
               cursor(SELECT A.EMPLOYEE_NAME , A.DEPARTMENT_ID, A.DEPARTMENT_ID , A.DEPARTMENT_ID AS DEPARTMENT_ID_5
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql);
      should.equal(result.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].name, "NC");
      should.equal(result.metaData[2].metaData[0].name, "EMPLOYEE_NAME");
      should.equal(result.metaData[2].metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.metaData[2].metaData[3].name, "DEPARTMENT_ID_5");
      should.equal(result.rows[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].DEPARTMENT_NAME, "R&D");
      should.equal(result.rows[0].NC[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID_1, 101);
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID_5, 101);
    });

    it('246.1.11 Duplicate column with case sensitive alias name using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME , B.DEPARTMENT_ID AS "department_id_1",
               cursor(SELECT A.EMPLOYEE_NAME , A.DEPARTMENT_ID , A.DEPARTMENT_ID
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql);
      should.equal(result.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.metaData[1].name, "department_id_1");
      should.equal(result.metaData[2].name, "NC");
      should.equal(result.metaData[2].metaData[0].name, "EMPLOYEE_NAME");
      should.equal(result.metaData[2].metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.rows[0].department_id_1, 101);
      should.equal(result.rows[0].DEPARTMENT_NAME, "R&D");
      should.equal(result.rows[0].NC[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].NC[0].DEPARTMENT_ID_1, 101);
    });


    it('246.1.12 Two duplicate columns using REF cursor', async function() {
      const PROC = 'proc_dupColNames';
      let proc = `
          CREATE OR REPLACE PROCEDURE ${PROC} (p_out OUT SYS_REFCURSOR)
          AS
          BEGIN
            OPEN p_out FOR
              SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_NAME
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
         ORDER BY A.DEPARTMENT_ID;
          END;
        `;

      await connection.execute(proc);
      let plsql = `BEGIN ${PROC}(:cursor); END;`;
      let opts = { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } };
      let result = await connection.execute(plsql, opts);
      let row_data = await traverse_results(result.outBinds.cursor);
      should.equal(result.outBinds.cursor.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.outBinds.cursor.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.outBinds.cursor.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.outBinds.cursor.metaData[3].name, "DEPARTMENT_NAME");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_NAME, "R&D");
    });

    it('246.1.13 Three duplicate columns using REF cursor', async function() {
      const PROC = 'proc_dupColNames';
      let proc = `
          CREATE OR REPLACE PROCEDURE ${PROC} (p_out OUT SYS_REFCURSOR)
          AS
          BEGIN
            OPEN p_out FOR
              SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID;
          END;
        `;

      await connection.execute(proc);
      let plsql = `BEGIN ${PROC}(:cursor); END;`;
      let opts = { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } };
      let result = await connection.execute(plsql, opts);
      let row_data = await traverse_results(result.outBinds.cursor);
      should.equal(result.outBinds.cursor.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.outBinds.cursor.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.outBinds.cursor.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.outBinds.cursor.metaData[3].name, "DEPARTMENT_ID_2");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_2, 101);
    });

    it('246.1.14 Duplicate column with conflicting alias name using REF cursor', async function() {
      const PROC = 'proc_dupColNames';
      let proc = `
          CREATE OR REPLACE PROCEDURE ${PROC} (p_out OUT SYS_REFCURSOR)
          AS
          BEGIN
            OPEN p_out FOR
              SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID AS DEPARTMENT_ID_1
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID;
          END;
        `;

      await connection.execute(proc);
      let plsql = `BEGIN ${PROC}(:cursor); END;`;
      let opts = { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } };
      let result = await connection.execute(plsql, opts);
      let row_data = await traverse_results(result.outBinds.cursor);
      should.equal(result.outBinds.cursor.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.outBinds.cursor.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.outBinds.cursor.metaData[2].name, "DEPARTMENT_ID_2");
      should.equal(result.outBinds.cursor.metaData[3].name, "DEPARTMENT_ID_1");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_2, 101);
    });

    it('246.1.15 Duplicate column with non-conflicting alias name using REF cursor', async function() {
      const PROC = 'proc_dupColNames';
      let proc = `
          CREATE OR REPLACE PROCEDURE ${PROC} (p_out OUT SYS_REFCURSOR)
          AS
          BEGIN
            OPEN p_out FOR
              SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID AS DEPARTMENT_ID_5
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID;
          END;
        `;

      await connection.execute(proc);
      let plsql = `BEGIN ${PROC}(:cursor); END;`;
      let opts = { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } };
      let result = await connection.execute(plsql, opts);
      let row_data = await traverse_results(result.outBinds.cursor);
      should.equal(result.outBinds.cursor.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.outBinds.cursor.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.outBinds.cursor.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.outBinds.cursor.metaData[3].name, "DEPARTMENT_ID_5");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_5, 101);
    });

    it('246.1.16 Duplicate column with case sensitive alias name using REF cursor', async function() {
      const PROC = 'proc_dupColNames';
      let proc = `
          CREATE OR REPLACE PROCEDURE ${PROC} (p_out OUT SYS_REFCURSOR)
          AS
          BEGIN
            OPEN p_out FOR
              SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.department_id, B.department_id AS "department_id_1"
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.department_id = B.department_id;
          END;
        `;

      await connection.execute(proc);
      let plsql = `BEGIN ${PROC}(:cursor); END;`;
      let opts = { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } };
      let result = await connection.execute(plsql, opts);
      let row_data = await traverse_results(result.outBinds.cursor);
      should.equal(result.outBinds.cursor.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.outBinds.cursor.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.outBinds.cursor.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.outBinds.cursor.metaData[3].name, "department_id_1");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].department_id_1, 101);
    });

    it('246.1.17 Duplicate column with case sensitive alias name from dual', async function() {
      let result = await connection.execute(`SELECT dummy "abc", dummy "ABC" FROM dual`);
      should.equal(result.metaData[0].name, "abc");
      should.equal(result.metaData[1].name, "ABC");
      should.equal(result.rows[0].abc, "X");
      should.equal(result.rows[0].ABC, "X");
    });

    it('246.1.18 1000 duplicate columns', async function() {
      let column_size = 1000;
      let columns_string = genColumns(column_size);
      function genColumns(size) {
        let buffer = [];
        for (let i = 0; i < size; i++) {
          buffer[i] = "B.DEPARTMENT_ID";
        }
        return buffer.join();
      }
      let sql =
        "SELECT " +
        "    A.EMPLOYEE_ID, A.DEPARTMENT_ID, " +
        columns_string +
        " FROM nodb_dupEmployee A, nodb_dupDepartment B " +
        " WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID " +
        " ORDER BY A.EMPLOYEE_ID";
      let result = await connection.execute(sql);

      should.equal(result.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.metaData[3].name, "DEPARTMENT_ID_2");
      should.equal(result.metaData[100].name, "DEPARTMENT_ID_99");
      should.equal(result.metaData[500].name, "DEPARTMENT_ID_499");
      should.equal(result.metaData[1001].name, "DEPARTMENT_ID_1000");
      should.equal(result.rows[0].EMPLOYEE_ID, 1001);
      should.equal(result.rows[0].DEPARTMENT_ID, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_1, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_2, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_99, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_499, 101);
      should.equal(result.rows[0].DEPARTMENT_ID_1000, 101);
    });
  });

  describe('246.2 Duplicate column names, query with ResultSet', function() {
    it('246.2.1 Two duplicate columns', async function() {
      let sql =
        `SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_NAME
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID`;

      let result = await connection.execute(sql, [], { resultSet: true });
      let row_data = await traverse_results(result.resultSet);
      should.equal(result.resultSet.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.resultSet.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.resultSet.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.resultSet.metaData[3].name, "DEPARTMENT_NAME");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_NAME, "R&D");
    });

    it('246.2.2 Three duplicate columns', async function() {
      let sql =
        `SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID`;

      let result = await connection.execute(sql, [], { resultSet: true });
      let row_data = await traverse_results(result.resultSet);
      should.equal(result.resultSet.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.resultSet.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.resultSet.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.resultSet.metaData[3].name, "DEPARTMENT_ID_2");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_2, 101);
    });

    it('246.2.3 Duplicate column with conflicting alias name', async function() {
      let sql =
        `SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID AS DEPARTMENT_ID_1
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID`;

      let result = await connection.execute(sql, [], { resultSet: true });
      let row_data = await traverse_results(result.resultSet);
      should.equal(result.resultSet.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.resultSet.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.resultSet.metaData[2].name, "DEPARTMENT_ID_2");
      should.equal(result.resultSet.metaData[3].name, "DEPARTMENT_ID_1");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_2, 101);
    });

    it('246.2.4 Duplicate column with non-conflicting alias name', async function() {
      let sql =
        `SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID AS DEPARTMENT_ID_5
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID`;

      let result = await connection.execute(sql, [], { resultSet: true });
      let row_data = await traverse_results(result.resultSet);
      should.equal(result.resultSet.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.resultSet.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.resultSet.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.resultSet.metaData[3].name, "DEPARTMENT_ID_5");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_5, 101);
    });

    it('246.2.5 Negative not-case sensitive', async function() {
      let sql =
        `SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.department_id, B.department_id AS "department_id_1"
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.department_id = B.department_id`;

      let result = await connection.execute(sql, [], { resultSet: true });
      let row_data = await traverse_results(result.resultSet);
      should.equal(result.resultSet.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.resultSet.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.resultSet.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.resultSet.metaData[3].name, "department_id_1");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].department_id_1, 101);
    });

    it('246.2.6 Two duplicate columns using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME , B.DEPARTMENT_ID,
               cursor(SELECT A.EMPLOYEE_NAME , A.DEPARTMENT_ID , A.DEPARTMENT_ID
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                       ORDER BY A.EMPLOYEE_NAME
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql, [], { resultSet: true });
      let row = await traverse_rows(result.resultSet);
      let row_data = await traverse_results(row[0].NC);
      should.equal(result.resultSet.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.resultSet.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.resultSet.metaData[2].name, "NC");
      should.equal(row[0].NC.metaData[0].name, "EMPLOYEE_NAME");
      should.equal(row[0].NC.metaData[1].name, "DEPARTMENT_ID");
      should.equal(row[0].NC.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(row[0].DEPARTMENT_ID, 101);
      should.equal(row[0].DEPARTMENT_NAME, "R&D");
      should.equal(row_data[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
    });

    it('246.2.7 Three duplicate columns using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME , B.DEPARTMENT_ID , B.DEPARTMENT_ID,
               cursor(SELECT A.EMPLOYEE_NAME , A.DEPARTMENT_ID
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql, [], { resultSet: true });
      let row = await traverse_rows(result.resultSet);
      let row_data = await traverse_results(row[0].NC);
      should.equal(result.resultSet.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.resultSet.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.resultSet.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.resultSet.metaData[3].name, "NC");
      should.equal(row[0].NC.metaData[0].name, "EMPLOYEE_NAME");
      should.equal(row[0.].NC.metaData[1].name, "DEPARTMENT_ID");
      should.equal(row[0].DEPARTMENT_ID, 101);
      should.equal(row[0].DEPARTMENT_ID_1, 101);
      should.equal(row[0].DEPARTMENT_NAME, "R&D");
      should.equal(row_data[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(row_data[0].DEPARTMENT_ID, 101);
    });

    it('246.2.8 Three duplicate columns using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME , B.DEPARTMENT_ID,
               cursor(SELECT A.EMPLOYEE_NAME , A.DEPARTMENT_ID , A.DEPARTMENT_ID , A.DEPARTMENT_ID
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql, [], { resultSet: true });
      let row = await traverse_rows(result.resultSet);
      let row_data = await traverse_results(row[0].NC);
      should.equal(result.resultSet.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.resultSet.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.resultSet.metaData[2].name, "NC");
      should.equal(row[0].NC.metaData[0].name, "EMPLOYEE_NAME");
      should.equal(row[0].NC.metaData[1].name, "DEPARTMENT_ID");
      should.equal(row[0].NC.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(row[0].NC.metaData[3].name, "DEPARTMENT_ID_2");
      should.equal(row[0].DEPARTMENT_ID, 101);
      should.equal(row[0].DEPARTMENT_NAME, "R&D");
      should.equal(row_data[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_2, 101);
    });

    it('246.2.9 Duplicate column with conflicting alias name using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME , B.DEPARTMENT_ID,
               cursor(SELECT A.EMPLOYEE_NAME , A.DEPARTMENT_ID , A.DEPARTMENT_ID , A.DEPARTMENT_ID AS DEPARTMENT_ID_1
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql, [], { resultSet: true });
      let row = await traverse_rows(result.resultSet);
      let row_data = await traverse_results(row[0].NC);
      should.equal(result.resultSet.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.resultSet.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.resultSet.metaData[2].name, "NC");
      should.equal(row[0].NC.metaData[0].name, "EMPLOYEE_NAME");
      should.equal(row[0].NC.metaData[1].name, "DEPARTMENT_ID");
      should.equal(row[0].NC.metaData[2].name, "DEPARTMENT_ID_2");
      should.equal(row[0].NC.metaData[3].name, "DEPARTMENT_ID_1");
      should.equal(row[0].DEPARTMENT_ID, 101);
      should.equal(row[0].DEPARTMENT_NAME, "R&D");
      should.equal(row_data[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_2, 101);
    });

    it('246.2.10 Duplicate column with non-conflicting alias name using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME , B.DEPARTMENT_ID,
               cursor(SELECT A.EMPLOYEE_NAME , A.DEPARTMENT_ID , A.DEPARTMENT_ID , A.DEPARTMENT_ID AS DEPARTMENT_ID_5
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql, [], { resultSet: true });
      let row = await traverse_rows(result.resultSet);
      let row_data = await traverse_results(row[0].NC);
      should.equal(result.resultSet.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.resultSet.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.resultSet.metaData[2].name, "NC");
      should.equal(row[0].NC.metaData[0].name, "EMPLOYEE_NAME");
      should.equal(row[0].NC.metaData[1].name, "DEPARTMENT_ID");
      should.equal(row[0].NC.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(row[0].NC.metaData[3].name, "DEPARTMENT_ID_5");
      should.equal(row[0].DEPARTMENT_ID, 101);
      should.equal(row[0].DEPARTMENT_NAME, "R&D");
      should.equal(row_data[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_5, 101);
    });

    it('246.2.11 Duplicate column with case sensitive alias name using nested cursor', async function() {
      let sql = `
         SELECT B.DEPARTMENT_NAME , B.DEPARTMENT_ID AS "department_id_1",
               cursor(SELECT A.EMPLOYEE_NAME , A.DEPARTMENT_ID , A.DEPARTMENT_ID
                       FROM nodb_dupEmployee A
                       WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID
                      ) as NC
                FROM nodb_dupDepartment B
                ORDER BY B.DEPARTMENT_ID
              `;

      let result = await connection.execute(sql, [], { resultSet: true });
      let row = await traverse_rows(result.resultSet);
      let row_data = await traverse_results(row[0].NC);
      should.equal(result.resultSet.metaData[0].name, "DEPARTMENT_NAME");
      should.equal(result.resultSet.metaData[1].name, "department_id_1");
      should.equal(result.resultSet.metaData[2].name, "NC");
      should.equal(row[0].NC.metaData[0].name, "EMPLOYEE_NAME");
      should.equal(row[0].NC.metaData[1].name, "DEPARTMENT_ID");
      should.equal(row[0].NC.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(row[0].department_id_1, 101);
      should.equal(row[0].DEPARTMENT_NAME, "R&D");
      should.equal(row_data[0].EMPLOYEE_NAME, "Krishna Mohan");
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
    });

    it('246.2.12 Two Duplicate columns using REF cursor', async function() {
      const PROC = 'proc_dupColNames';
      let proc = `
          CREATE OR REPLACE PROCEDURE ${PROC} (p_out OUT SYS_REFCURSOR)
          AS
          BEGIN
            OPEN p_out FOR
              SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_NAME
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID;
          END;
        `;

      await connection.execute(proc);
      let plsql = `BEGIN ${PROC}(:cursor); END;`;
      let opts = { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } };
      let result = await connection.execute(plsql, opts, { resultSet: true });
      let row_data = await traverse_results(result.outBinds.cursor);
      should.equal(result.outBinds.cursor.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.outBinds.cursor.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.outBinds.cursor.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.outBinds.cursor.metaData[3].name, "DEPARTMENT_NAME");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_NAME, "R&D");
    });

    it('246.2.13 Three duplicate columns using REF cursor', async function() {
      const PROC = 'proc_dupColNames';
      let proc = `
          CREATE OR REPLACE PROCEDURE ${PROC} (p_out OUT SYS_REFCURSOR)
          AS
          BEGIN
            OPEN p_out FOR
              SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID;
          END;
        `;

      await connection.execute(proc);
      let plsql = `BEGIN ${PROC}(:cursor); END;`;
      let opts = { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } };
      let result = await connection.execute(plsql, opts, { resultSet: true });
      let row_data = await traverse_results(result.outBinds.cursor);
      should.equal(result.outBinds.cursor.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.outBinds.cursor.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.outBinds.cursor.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.outBinds.cursor.metaData[3].name, "DEPARTMENT_ID_2");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_2, 101);
    });

    it('246.2.14 Duplicate column with conflicting alias name using REF cursor', async function() {
      const PROC = 'proc_dupColNames';
      let proc = `
          CREATE OR REPLACE PROCEDURE ${PROC} (p_out OUT SYS_REFCURSOR)
          AS
          BEGIN
            OPEN p_out FOR
              SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID AS DEPARTMENT_ID_1
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID;
          END;
        `;

      await connection.execute(proc);
      let plsql = `BEGIN ${PROC}(:cursor); END;`;
      let opts = { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } };
      let result = await connection.execute(plsql, opts, { resultSet: true });
      let row_data = await traverse_results(result.outBinds.cursor);
      should.equal(result.outBinds.cursor.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.outBinds.cursor.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.outBinds.cursor.metaData[2].name, "DEPARTMENT_ID_2");
      should.equal(result.outBinds.cursor.metaData[3].name, "DEPARTMENT_ID_1");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_2, 101);
    });

    it('246.2.15 Duplicate column with non-conflicting alias name using REF cursor', async function() {
      const PROC = 'proc_dupColNames';
      let proc = `
          CREATE OR REPLACE PROCEDURE ${PROC} (p_out OUT SYS_REFCURSOR)
          AS
          BEGIN
            OPEN p_out FOR
              SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.DEPARTMENT_ID, B.DEPARTMENT_ID AS DEPARTMENT_ID_5
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.DEPARTMENT_ID = B.DEPARTMENT_ID;
          END;
        `;

      await connection.execute(proc);
      let plsql = `BEGIN ${PROC}(:cursor); END;`;
      let opts = { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } };
      let result = await connection.execute(plsql, opts, { resultSet: true });
      let row_data = await traverse_results(result.outBinds.cursor);
      should.equal(result.outBinds.cursor.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.outBinds.cursor.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.outBinds.cursor.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.outBinds.cursor.metaData[3].name, "DEPARTMENT_ID_5");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].DEPARTMENT_ID_5, 101);
    });

    it('246.2.16 Duplicate column with case sensitive alias name using REF cursor', async function() {
      const PROC = 'proc_dupColNames';
      let proc = `
          CREATE OR REPLACE PROCEDURE ${PROC} (p_out OUT SYS_REFCURSOR)
          AS
          BEGIN
            OPEN p_out FOR
              SELECT
            A.EMPLOYEE_ID, A.DEPARTMENT_ID,
            B.department_id, B.department_id AS "department_id_1"
         FROM nodb_dupEmployee A, nodb_dupDepartment B
         WHERE A.department_id = B.department_id;
          END;
        `;

      await connection.execute(proc);
      let plsql = `BEGIN ${PROC}(:cursor); END;`;
      let opts = { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } };
      let result = await connection.execute(plsql, opts, { resultSet: true });
      let row_data = await traverse_results(result.outBinds.cursor);
      should.equal(result.outBinds.cursor.metaData[0].name, "EMPLOYEE_ID");
      should.equal(result.outBinds.cursor.metaData[1].name, "DEPARTMENT_ID");
      should.equal(result.outBinds.cursor.metaData[2].name, "DEPARTMENT_ID_1");
      should.equal(result.outBinds.cursor.metaData[3].name, "department_id_1");
      should.equal(row_data[0].EMPLOYEE_ID, 1001);
      should.equal(row_data[0].DEPARTMENT_ID, 101);
      should.equal(row_data[0].DEPARTMENT_ID_1, 101);
      should.equal(row_data[0].department_id_1, 101);
    });

    it('246.2.17 Duplicate column with case sensitive alias name from dual', async function() {
      let result = await connection.execute(`SELECT dummy "abc", dummy "ABC" from dual`, [], { resultSet: true });
      let row_data = await traverse_results(result.resultSet);
      should.equal(result.resultSet.metaData[0].name, "abc");
      should.equal(result.resultSet.metaData[1].name, "ABC");
      should.equal(row_data[0].abc, "X");
      should.equal(row_data[0].ABC, "X");
    });
  });

});
