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
 *   240. errorOffset.js
 *
 * DESCRIPTION
 *   This test verifies a ODPI-C bug fix.
 *
 *****************************************************************************/
'use strict';

const oracledb = require('oracledb');
const should   = require('should');
const dbconfig = require('./dbconfig.js');

describe('240. errorOffset.js', function() {

  let conn;
  before(async () => {
    try {
      conn = await oracledb.getConnection(dbconfig);
    } catch (error) {
      should.not.exist(error);
    }
  });

  after(async () => {
    try {
      await conn.close();
    } catch (error) {
      should.not.exist(error);
    }
  });

  it('240.1 checks the offset value of the error', async () => {

    try {
      await conn.execute("begin t_Missing := 5; end;");
    } catch (error) {
      should.exist(error);
      should.strictEqual(error.offset, 6);
      should.strictEqual(error.errorNum, 6550);
    }

  }); // 240.1

  it('240.2 database error', async () => {

    const plsql = `
      begin
          execute immediate ('drop table nodb_table_nonexistent');
      end;
    `;
    try {
      await conn.execute(plsql);
    } catch (error) {
      should.exist(error);
      should.strictEqual(error.offset, 0);
      should.strictEqual(error.errorNum, 942);
    }

  }); // 240.2

  it('240.3 the offset of system error is 0', async () => {
    const plsql = `
      BEGIN
          DECLARE v_invalid PLS_INTEGER;
          BEGIN
              v_invalid := 100/0;
          END;
      END;
    `;
    try {
      await conn.execute(plsql);
    } catch (error) {
      should.exist(error);
      should.strictEqual(error.offset, 0);
      should.strictEqual(error.errorNum, 1476);
    }
  });// 240.3

  it('240.4 PL/SQL syntax error', async () => {
    const plsql = `DECLARE v_missing_semicolon PLS_INTEGER
      BEGIN
          v_missing_semicolon := 46;
      END;`;
    try {
      await conn.execute(plsql);
    } catch (error) {
      should.exist(error);
      should.strictEqual(error.offset, 46);
      should.strictEqual(error.errorNum, 6550);
    }
  }); // 240.4
});
