/* Copyright (c) 2020, Oracle and/or its affiliates. All rights reserved. */

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
 * The node-oracledb test suite uses 'mocha', 'should' and 'async'.
 * See LICENSE.md for relevant licenses.
 *
 * NAME
 *   239. plsqlBindCursorsIN.js
 *
 * DESCRIPTION
 *  Test the support for binding Cursors IN to PL/SQL procedures
 *
 *****************************************************************************/
'use strict';

const oracledb  = require('oracledb');
const should    = require('should');
const dbconfig  = require('./dbconfig.js');
const testsUtil = require('./testsUtil.js');

describe('239. plsqlBindCursorsIN.js', () => {

  let conn;
  const DefaultPrefetchRows = oracledb.prefetchRows;
  const tableName = "nodb_tab_bind_cursors_in";
  const procName1 = "nodb_proc_bind_cursors_in";
  const procName2 = "nodb_proc_bind_cursors_out";

  const sqlRefCursor = `
    select 1, 'String 1' from dual
    union all
    select 2, 'String 2' from dual
    union all
    select 3, 'String 3' from dual
    union all
    select 4, 'String 4' from dual
    union all
    select 5, 'String 5' from dual
    order by 1
  `;

  before(async () => {
    try {
      conn = await oracledb.getConnection(dbconfig);

      let sql = `
        create table ${tableName} (
            id number(9) not null,
            strval varchar2(100)
        )
      `;
      let plsql = testsUtil.sqlCreateTable(tableName, sql);
      await conn.execute(plsql);

      plsql = `
        create or replace procedure ${procName1} (
          a_Cursor            sys_refcursor
        ) is
            t_Id                number;
            t_StrVal            varchar2(100);
        begin
            delete from ${tableName};
            loop
                fetch a_Cursor
                into t_Id, t_StrVal;
                exit when a_cursor%notfound;
                insert into ${tableName}
                values (t_id, t_StrVal);
            end loop;
            close a_Cursor;
            commit;
        end;
      `;
      await conn.execute(plsql);

      plsql = `
        create or replace procedure ${procName2} (
          a_Cursor OUT        sys_refcursor
        ) is
        begin
            open a_Cursor for select 1, 'String 1' from dual
                union all
                select 2, 'String 2' from dual
                union all
                select 3, 'String 3' from dual
                union all
                select 4, 'String 4' from dual
                union all
                select 5, 'String 5' from dual
                order by 1;
        end;
      `;
      await conn.execute(plsql);

      await conn.commit();

    } catch (error) {
      should.not.exist(error);
    }
  }); // before()

  after(async () => {
    try {
      let sql = `drop table ${tableName} purge`;
      await conn.execute(sql);

      sql = `drop procedure ${procName1}`;
      await conn.execute(sql);

      sql = `drop procedure ${procName2}`;
      await conn.execute(sql);

      await conn.close();

      oracledb.prefetchRows = DefaultPrefetchRows;
    } catch (error) {
      should.not.exist(error);
    }
  }); // after()

  it('239.1 disable prefetchRows by setting it to be 0', async () => {
    try {
      const refCursorOptions = {
        resultSet: true,
        prefetchRows: 0
      };
      let result = await conn.execute(sqlRefCursor, [], refCursorOptions);

      let plsql = `begin ${procName1}(:bv); end;`;
      await conn.execute(
        plsql,
        {
          bv: {val: result.resultSet, type: oracledb.CURSOR, dir: oracledb.BIND_IN }
        }
      );

      const sqlQuery = `select * from ${tableName}`;
      const queryResult = await conn.execute(sqlQuery);

      should.strictEqual(queryResult.rows.length, 5);

    } catch (error) {
      should.not.exist(error);
    }
  }); // 239.1

  it('239.2 prefetchRows is enabled with default value', async () => {
    try {
      const refCursorOptions = {
        resultSet: true
      };
      let result = await conn.execute(sqlRefCursor, [], refCursorOptions);

      let plsql = `begin ${procName1}(:bv); end;`;
      await conn.execute(
        plsql,
        {
          bv: {val: result.resultSet, type: oracledb.CURSOR, dir: oracledb.BIND_IN }
        }
      );

      const sqlQuery = `select * from ${tableName}`;
      const queryResult = await conn.execute(sqlQuery);

      should.strictEqual(queryResult.rows.length, 3);
    } catch (error) {
      should.not.exist(error);
    }
  }); // 239.2

  it('239.3 cursor bind OUT then bind IN', async () => {
    try {
      let result = await conn.execute(
        `begin ${procName2}(:bv); end;`,
        {
          bv: {dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
        },
        {
          prefetchRows: 2  // prefetch doesn't impact result
        }
      );

      await conn.execute(
        `begin ${procName1}(:bv); end;`,
        {
          bv: {val:result.outBinds.bv, type: oracledb.CURSOR}
        }
      );

      const sqlQuery = `select * from ${tableName}`;
      const queryResult = await conn.execute(sqlQuery);

      should.strictEqual(queryResult.rows.length, 5);

    } catch (error) {
      should.not.exist(error);
    }
  }); // 239.3

  it('239.4 implicit binding type', async () => {
    try {
      let result = await conn.execute(
        `begin ${procName2}(:bv); end;`,
        {
          bv: {dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
        },
        {
          prefetchRows: 2  // prefetch doesn't impact result
        }
      );

      await conn.execute(
        `begin ${procName1}(:bv); end;`,
        [result.outBinds.bv]
      );

      const sqlQuery = `select * from ${tableName}`;
      const queryResult = await conn.execute(sqlQuery);

      should.strictEqual(queryResult.rows.length, 5);

    } catch (error) {
      should.not.exist(error);
    }
  }); // 239.4

  it('239.5 check REF CURSOR round-trips with no prefetching', async () => {
    if (!dbconfig.test.DBA_PRIVILEGE) {
      it.skip('');
      return;
    }
    try {
      const sid = await testsUtil.getSid(conn);
      let rt = await testsUtil.getRoundTripCount(sid);
      let result = await conn.execute(
        `begin ${procName2}(:bv); end;`,
        {
          bv: {dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
        },
        {
          prefetchRows: 0
        }
      );
      const rc = result.outBinds.bv;
      await rc.getRows(2);
      await rc.getRows(2);
      rt = await testsUtil.getRoundTripCount(sid) - rt;

      should.strictEqual(rt, 3);

    } catch (error) {
      should.not.exist(error);
    }
  }); // 239.5

  it('239.6 check REF CURSOR round-trips with prefetching', async () => {
    if (!dbconfig.test.DBA_PRIVILEGE) {
      it.skip('');
      return;
    }
    try {
      const sid = await testsUtil.getSid(conn);
      let rt = await testsUtil.getRoundTripCount(sid);

      let result = await conn.execute(
        `begin ${procName2}(:bv); end;`,
        {
          bv: {dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
        },
        {
          prefetchRows: 100
        }
      );
      const rc = result.outBinds.bv;
      await rc.getRows(2);
      await rc.getRows(2);
      rt = await testsUtil.getRoundTripCount(sid) - rt;

      should.strictEqual(rt, 2);

    } catch (error) {
      should.not.exist(error);
    }
  }); // 239.6

});
