/* Copyright (c) 2020, 2021, Oracle and/or its affiliates. All rights reserved. */

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
 *   224. booleanBind.js
 *
 * DESCRIPTION
 *   Test PL/SQL boolean parameters to be bound and to be included in PL/SQL
 *   records/collections. Based on
 *   https://github.com/oracle/node-oracledb/pull/1190
 *
 *****************************************************************************/
'use strict';

const oracledb  = require('oracledb');
const should    = require('should');
const assert    = require('assert');
const dbconfig  = require('./dbconfig.js');
const testsUtil = require('./testsUtil.js');

describe('224. booleanBind.js', function()  {

  let conn;
  let isRunnable = false;

  const pkgName = 'NODB_PKG_TEST_BOOLEANS';
  before(async function() {
    isRunnable = await testsUtil.checkPrerequisites(1200000000, 1200000000);
    if (!isRunnable) {
      this.skip();
    }

    let plsqlPkg = `
      create or replace package ${pkgName} as

          type udt_BooleanList is table of boolean index by binary_integer;

          type udt_DemoRecord is record (
              NumberValue                     number,
              StringValue                     varchar2(30),
              DateValue                       date,
              BooleanValue                    boolean
          );

          function GetStringRep (
              a_Value                         boolean
          ) return varchar2;

          function IsLessThan10 (
              a_Value                         number
          ) return boolean;

          function TestInArrays (
              a_Value                         udt_BooleanList
          ) return number;

          procedure TestOutArrays (
              a_NumElements                   number,
              a_Value                         out nocopy udt_BooleanList
          );

          procedure DemoRecordsInOut (
              a_Value                         in out nocopy udt_DemoRecord
          );

      end;
    `;

    let plsqlPkgBody = `
      create or replace package body ${pkgName} as

          function GetStringRep (
              a_Value                         boolean
          ) return varchar2 is
          begin
              if a_Value is null then
                  return 'NULL';
              elsif a_Value then
                  return 'TRUE';
              end if;
              return 'FALSE';
          end;

          function IsLessThan10 (
              a_Value                         number
          ) return boolean is
          begin
              return a_Value < 10;
          end;

          function TestInArrays (
              a_Value                         udt_BooleanList
          ) return number is
              t_Result                        pls_integer;
          begin
              t_Result := 0;
              for i in 0..a_Value.count - 1 loop
                  if a_Value(i) then
                      t_Result := t_Result + 1;
                  end if;
              end loop;
              return t_Result;
          end;

          procedure TestOutArrays (
              a_NumElements                   number,
              a_Value                         out nocopy udt_BooleanList
          ) is
          begin
              for i in 1..a_NumElements loop
                  a_Value(i) := (mod(i, 2) = 1);
              end loop;
          end;

          procedure DemoRecordsInOut (
              a_Value                         in out nocopy udt_DemoRecord
          ) is
          begin
              a_Value.NumberValue := a_Value.NumberValue * 2;
              a_Value.StringValue := a_Value.StringValue || ' (Modified)';
              a_Value.DateValue := a_Value.DateValue + 5;
              a_Value.BooleanValue := not a_Value.BooleanValue;
          end;

      end;
    `;

    try {
      conn = await oracledb.getConnection(dbconfig);
      await conn.execute(plsqlPkg);
      await conn.execute(plsqlPkgBody);
    } catch (err) {
      should.not.exist(err);
    }
  }); // before()

  after(async function() {
    if (!isRunnable) {
      return;
    }

    try {
      let plsql = `drop package ${pkgName}`;
      await conn.execute(plsql);
      await conn.close();
    } catch (err) {
      should.not.exist(err);
    }
  }); // after()

  it('224.1 IN bind boolean value', async function() {

    let binds = {
      inval: true,
      outval: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 10 }
    };
    let sql = `begin :outval := ${pkgName}.GetStringRep(:inval); end;`;

    try {
      let result = await conn.execute(sql, binds);
      should.strictEqual('TRUE', result.outBinds.outval);
    } catch (error) {
      should.not.exist(error);
    }
  }); // 224.1

  it('224.2 IN bind value "false"', async function() {
    let binds = {
      inval: false,
      outval: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 10 }
    };
    let sql = `begin :outval := ${pkgName}.GetStringRep(:inval); end;`;

    try {
      let result = await conn.execute(sql, binds);
      should.strictEqual('FALSE', result.outBinds.outval);
    } catch (error) {
      should.not.exist(error);
    }
  }); // 224.2

  it('224.3 IN bind value "null"', async function() {
    let binds = {
      inval: { type: oracledb.DB_TYPE_BOOLEAN, val: null },
      outval: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 10 }
    };
    let sql = `begin :outval := ${pkgName}.GetStringRep(:inval); end;`;

    try {
      let result = await conn.execute(sql, binds);
      should.strictEqual('NULL', result.outBinds.outval);
    } catch (error) {
      should.not.exist(error);
    }
  }); // 224.3

  it('224.4 Negative - IN bind value type mismatch', async function() {
    let binds = {
      inval: { type: oracledb.DB_TYPE_BOOLEAN, val: 123 },
      outval: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 10 }
    };
    let sql = `begin :outval := ${pkgName}.GetStringRep(:inval); end;`;

    try {
      await assert.rejects(
        async function() {
          await conn.execute(sql, binds);
        },
        /NJS-011/
      );
    } catch (error) {
      should.not.exist(error);
    }
  });

  it('224.5 OUT bind value "false"', async function() {
    let binds = {
      inval: 12,
      outval: { dir: oracledb.BIND_OUT, type: oracledb.DB_TYPE_BOOLEAN }
    };
    let sql = `begin :outval := ${pkgName}.IsLessThan10(:inval); end;`;

    try {
      let result = await conn.execute(sql, binds);
      should.strictEqual(false, result.outBinds.outval);
    } catch (error) {
      should.not.exist(error);
    }
  }); // 224.5

  it('224.6 OUT bind value "true"', async function() {
    let binds = {
      inval: 9,
      outval: { dir: oracledb.BIND_OUT, type: oracledb.DB_TYPE_BOOLEAN }
    };
    let sql = `begin :outval := ${pkgName}.IsLessThan10(:inval); end;`;

    try {
      let result = await conn.execute(sql, binds);
      should.strictEqual(true, result.outBinds.outval);
    } catch (error) {
      should.not.exist(error);
    }
  }); // 224.6

  it('224.7 IN bind array with boolean data', async function() {
    try {
      const cls = await conn.getDbObjectClass(`${pkgName}.UDT_BOOLEANLIST`);
      const arr = new cls([true, false, true, true, false, true, false, true]);
      const binds = {
        inval: arr,
        outval: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      };
      const sql = `begin :outval := ${pkgName}.TestInArrays(:inval); end;`;
      const result = await conn.execute(sql, binds);
      should.strictEqual(5, result.outBinds.outval);
    } catch (error) {
      should.not.exist(error);
    }
  }); // 224.7

  it('224.8 OUT bind array with boolean data', async function() {
    try {
      const cls = await conn.getDbObjectClass(`${pkgName}.UDT_BOOLEANLIST`);
      const arr = new cls([true, false, true, true, false, true, false, true]);
      const binds = {
        inval: arr,
        outval: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      };
      const sql = `begin :outval := ${pkgName}.TestInArrays(:inval); end;`;
      const result = await conn.execute(sql, binds);
      should.strictEqual(5, result.outBinds.outval);
    } catch (error) {
      should.not.exist(error);
    }
  }); // 224.8

  it('224.9 INOUT bind record with boolean data', async function() {
    try {
      const cls = await conn.getDbObjectClass(`${pkgName}.UDT_DEMORECORD`);
      const obj = new cls();
      obj.NUMBERVALUE = 6;
      obj.STRINGVALUE = "A string";
      obj.DATEVALUE = new Date();
      obj.BOOLEANVALUE = false;
      const binds = [
        { val: obj, type: cls, dir: oracledb.BIND_INOUT }
      ];
      let sql = `begin ${pkgName}.DemoRecordsInOut(:1); end;`;
      const result = await conn.execute(sql, binds);
      should.strictEqual(12, result.outBinds[0].NUMBERVALUE);
      should.strictEqual('A string (Modified)', result.outBinds[0].STRINGVALUE);
      (result.outBinds[0].DATEVALUE).should.be.a.Date();
      should.strictEqual(true, result.outBinds[0].BOOLEANVALUE);
    } catch (error) {
      should.not.exist(error);
    }
  }); // 224.9
});
