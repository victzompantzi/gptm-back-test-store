/* Copyright (c) 2019, 2021, Oracle and/or its affiliates. All rights reserved. */

/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * NAME
 *   208. dbObject9.js
 *
 * DESCRIPTION
 *   REF Cursors and Implicit Results that fetch DbObjects.
 *
 *****************************************************************************/
'use strict';

const oracledb  = require('oracledb');
const should    = require('should');
const dbconfig  = require('./dbconfig.js');
const testsUtil = require('./testsUtil.js');

describe('208. dbObject9.js', function() {

  let isRunnable = false;
  let conn;
  const TYPE = 'NODB_PERSON_T';
  const TABLE = 'NODB_TAB_EMPLOYEES';
  const PEOPLE = [
    { ID: 123, NAME: 'Alice', GENDER: 'Female' },
    { ID: 234, NAME: 'Bob', GENDER: 'Male' },
    { ID: 345, NAME: 'Charlie', GENDER: 'Male' },
    { ID: 456, NAME: 'Dolores', GENDER: 'Female' }
  ];

  before(async function() {
    isRunnable = await testsUtil.checkPrerequisites();
    if (!isRunnable) {
      this.skip();
      return;
    } else {
      try {
        conn = await oracledb.getConnection(dbconfig);

        let sql =
          `CREATE OR REPLACE TYPE ${TYPE} AS OBJECT (
            id     NUMBER,
            name   VARCHAR2(30),
            gender VARCHAR2(20)
          );`;
        await conn.execute(sql);

        sql =
          `CREATE TABLE ${TABLE} (
            empnum NUMBER,
            person ${TYPE}
          )`;
        let plsql = testsUtil.sqlCreateTable(TABLE, sql);
        await conn.execute(plsql);

        const PersonType = await conn.getDbObjectClass(TYPE);
        let bindArr = [];
        for (let i = 0, num, p; i < PEOPLE.length; i++) {
          num = i + 1;
          p = new PersonType(PEOPLE[i]);
          bindArr[i] = [num, p];
        }
        let opts = {
          autoCommit: true,
          bindDefs: [ { type: oracledb.NUMBER }, { type: PersonType } ]
        };
        let result = await conn.executeMany(
          `INSERT INTO ${TABLE} VALUES (:1, :2)`,
          bindArr,
          opts
        );

        should.strictEqual(result.rowsAffected, PEOPLE.length);

      } catch (err) {
        should.not.exist(err);
      }
    }

  }); // before()

  after(async function() {
    if (!isRunnable) {
      return;
    } else {
      try {
        let sql = `DROP TABLE ${TABLE} PURGE`;
        await conn.execute(sql);

        sql = `DROP TYPE ${TYPE}`;
        await conn.execute(sql);

        await conn.close();
      } catch (err) {
        should.not.exist(err);
      }
    }

  }); // after()

  it('208.1 REF cursors that fetch object', async () => {
    try {

      const PROC = 'nodb_proc_getemp';
      let plsql = `
        CREATE OR REPLACE PROCEDURE ${PROC} (p_out OUT SYS_REFCURSOR)
        AS
        BEGIN
          OPEN p_out FOR
            SELECT * FROM ${TABLE};
        END;
      `;
      await conn.execute(plsql);

      plsql = `BEGIN ${PROC}(:out); END;`;
      let opts = { out: { dir: oracledb.BIND_OUT, type: oracledb.DB_TYPE_CURSOR } };
      let result = await conn.execute(plsql, opts);

      // Fetch rows from ResultSet
      const RS = result.outBinds.out;
      let rows = await RS.getRows(PEOPLE.length);
      for (let i = 0; i < PEOPLE.length; i++) {
        should.deepEqual(rows[i][1]._toPojo(), PEOPLE[i]);
        should.strictEqual(JSON.stringify(rows[i][1]), JSON.stringify(PEOPLE[i]));
      }
      await RS.close();

      let sql = `DROP PROCEDURE ${PROC}`;
      await conn.execute(sql);
    } catch (err) {
      should.not.exist(err);
    }
  }); // 208.1

  const queryImpres = `
    DECLARE
      c SYS_REFCURSOR;
    BEGIN
      OPEN c FOR
        SELECT * FROM ${TABLE};

      DBMS_SQL.RETURN_RESULT(C);
    END;
  `;

  it('208.2 Implicit results that fetch objects', async () => {
    try {
      const result = await conn.execute(queryImpres);
      let rows = result.implicitResults[0];
      for (let i = 0; i < PEOPLE.length; i++) {
        should.deepEqual(rows[i][1]._toPojo(), PEOPLE[i]);
        should.strictEqual(JSON.stringify(rows[i][1]), JSON.stringify(PEOPLE[i]));
      }
    } catch (err) {
      should.not.exist(err);
    }
  }); // 208.2

  it('208.3 Implicit results that fetch objects with Result Set', async () => {
    try {
      const result = await conn.execute(queryImpres, [], { resultSet: true});
      let rows = await result.implicitResults[0].getRows(PEOPLE.length);
      for (let i = 0; i < PEOPLE.length; i++) {
        should.deepEqual(rows[i][1]._toPojo(), PEOPLE[i]);
        should.strictEqual(JSON.stringify(rows[i][1]), JSON.stringify(PEOPLE[i]));
      }
    } catch (err) {
      should.not.exist(err);
    }
  }); // 208.3

  it('208.4 DML RETURNING INTO, explicit bind type', async () => {

    try {
      const PersonType = await conn.getDbObjectClass(TYPE);

      const staff = { ID: 1123, NAME: 'Changjie', GENDER: 'Male' };
      const staffNo = 23;
      const p = new PersonType(staff);
      let sql = `INSERT INTO ${TABLE} VALUES (:1, :2) RETURNING empnum, person INTO :3, :4`;
      let bindVar = [
        staffNo,
        { type: PersonType, val: p },
        { dir: oracledb.BIND_OUT, type: oracledb.DB_TYPE_NUMBER },
        { dir: oracledb.BIND_OUT, type: PersonType }
      ];
      let result = await conn.execute(sql, bindVar);

      should.strictEqual(result.rowsAffected, 1);
      should.strictEqual(result.outBinds[0][0], staffNo);
      should.deepEqual(
        result.outBinds[1][0]._toPojo(),
        staff
      );
    } catch (err) {
      should.not.exist(err);
    }
  }); // 208.4

  it('208.5 DML RETURNING INTO, implicit bind type', async () => {
    try {
      const PersonType = await conn.getDbObjectClass(TYPE);

      const staff = { ID: 23456, NAME: 'Chris', GENDER: 'Male' };
      const staffNo = 101;
      const p = new PersonType(staff);
      let sql = `INSERT INTO ${TABLE} VALUES (:1, :2) RETURNING empnum, person INTO :3, :4`;
      let bindVar = [
        staffNo,
        p,
        { dir: oracledb.BIND_OUT, type: oracledb.DB_TYPE_NUMBER },
        { dir: oracledb.BIND_OUT, type: PersonType }
      ];
      let result = await conn.execute(sql, bindVar);

      should.strictEqual(result.rowsAffected, 1);
      should.strictEqual(result.outBinds[0][0], staffNo);
      should.deepEqual(
        result.outBinds[1][0]._toPojo(),
        staff
      );
    } catch (err) {
      should.not.exist(err);
    }
  }); // 208.5

  it('208.6 DML RETURNING INTO, bind by named values', async () => {
    try {
      const PersonType = await conn.getDbObjectClass(TYPE);

      const staff = { ID: 789, NAME: 'Shelly', GENDER: 'Female' };
      const staffNo = 102;
      const p = new PersonType(staff);
      let sql = `INSERT INTO ${TABLE} VALUES (:n, :i) RETURNING empnum, person INTO :o1, :o2`;
      let bindVar = {
        n: staffNo,
        i: p,
        o1: { dir: oracledb.BIND_OUT, type: oracledb.DB_TYPE_NUMBER },
        o2: { dir: oracledb.BIND_OUT, type: PersonType }
      };
      let result = await conn.execute(sql, bindVar);

      should.strictEqual(result.rowsAffected, 1);
      should.strictEqual(result.outBinds.o1[0], staffNo);
      should.deepEqual(
        result.outBinds.o2[0]._toPojo(),
        staff
      );
    } catch (err) {
      should.not.exist(err);
    }
  }); // 208.6

  it.skip('208.7 DML RETURNING INTO and executeMany()', async () => {
    try {
      const PersonType = await conn.getDbObjectClass(TYPE);

      const staffs = [
        { ID: 7001, NAME: 'Emma', GENDER: 'Female' },
        { ID: 7002, NAME: 'Ashley', GENDER: 'Female' },
        { ID: 7003, NAME: 'Alexanda', GENDER: 'Male' },
      ];
      const staffNo = [201, 202, 203];

      let bindArr = [];
      for (let i = 0, num, p; i < staffs.length; i++) {
        num = staffNo[i];
        p = new PersonType(staffs[i]);
        bindArr[i] = [num, p];
      }
      let opts = {
        autoCommit: true,
        bindDefs: [
          { type: oracledb.NUMBER },
          { type: PersonType },
          { dir: oracledb.BIND_OUT, type: oracledb.DB_TYPE_NUMBER },
          { dir: oracledb.BIND_OUT, type: PersonType }
        ]
      };
      let result = await conn.executeMany(
        `INSERT INTO ${TABLE} VALUES (:1, :2) RETURNING empnum, person INTO :3, :4`,
        bindArr,
        opts
      );
      console.log("==== Result of RETURNING INTO ========");
      for (let i = 0; i < staffs.length; i++) {
        console.log(result.outBinds[i]);
      }
      console.log();

      console.log("==== Result in table ========");
      let res = await conn.execute(`SELECT * FROM ${TABLE} WHERE empnum > 200 AND empnum < 205`);
      console.log(res);

    } catch (err) {
      should.not.exist(err);
    }
  }); // 208.7

});
