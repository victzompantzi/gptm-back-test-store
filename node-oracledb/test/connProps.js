/* Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved. */

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
 *   193. connProps.js
 *
 * DESCRIPTION
 *   Test the "connection.clientInfo" and "connection.dbOp" properties.
 *   These tests requires DBA privilege.
 *
 *****************************************************************************/
'use strict';

const oracledb  = require('oracledb');
const should    = require('should');
const dbconfig  = require('./dbconfig.js');
const testsUtil = require('./testsUtil.js');

describe('193. connProps.js', function() {

  let isRunnable = false;

  before(async function() {
    let preps = await testsUtil.checkPrerequisites();
    if (preps && dbconfig.test.DBA_PRIVILEGE) {
      isRunnable = true;
    }

    if (!isRunnable) {
      this.skip();
      return;
    } else {
      try {
        let dbaConfig = {
          user          : dbconfig.test.DBA_user,
          password      : dbconfig.test.DBA_password,
          connectString : dbconfig.connectString,
          privilege     : oracledb.SYSDBA,
        };
        const dbaConnection = await oracledb.getConnection(dbaConfig);

        let sql = `GRANT SELECT ANY DICTIONARY TO ${dbconfig.user}`;
        await dbaConnection.execute(sql);

        await dbaConnection.close();
      } catch (err) {
        should.not.exist(err);
      }
    }
  }); // before()

  it('193.1 the default values of clientInfo and dbOp are null', async () => {
    try {
      const conn = await oracledb.getConnection(dbconfig);
      should.strictEqual(conn.clientInfo, null);
      should.strictEqual(conn.dbOp, null);
      await conn.close();
    } catch (err) {
      should.not.exist(err);
    }
  }); // 193.1

  it('193.2 clientInfo and dbOp are write-only properties', async () => {
    try {
      const conn = await oracledb.getConnection(dbconfig);
      conn.clientInfo = 'nodb_193_2';
      conn.dbOp = 'nodb_193_2';
      should.strictEqual(conn.clientInfo, null);
      should.strictEqual(conn.dbOp, null);
      await conn.close();
    } catch (err) {
      should.not.exist(err);
    }
  }); // 193.2

  it('193.3 check the results of setter()', async () => {
    try {
      const conn = await oracledb.getConnection(dbconfig);

      const t_clientInfo = "My demo application";
      const t_dbOp       = "Billing";

      conn.clientInfo = t_clientInfo;
      conn.dbOp       = t_dbOp;

      const sqlOne = `SELECT sys_context('userenv', 'client_info') FROM dual`;
      let result = await conn.execute(sqlOne);
      should.strictEqual(result.rows[0][0], t_clientInfo);

      const sqlTwo = `SELECT dbop_name FROM v$sql_monitor \
             WHERE sid = sys_context('userenv', 'sid') \
             AND status = 'EXECUTING'`;
      result = await conn.execute(sqlTwo);
      should.strictEqual(result.rows[0][0], t_dbOp);

      // Change the values and check quried results again
      const k_clientInfo = "Demo Two";
      const k_dbOp       = "Billing Two";

      conn.clientInfo = k_clientInfo;
      conn.dbOp       = k_dbOp;

      result = await conn.execute(sqlOne);
      should.strictEqual(result.rows[0][0], k_clientInfo);

      result = await conn.execute(sqlTwo);
      should.strictEqual(result.rows[0][0], k_dbOp);

      await conn.close();
    } catch (err) {
      should.not.exist(err);
    }
  }); // 193.3

  it('193.4 Negative - invalid values', async () => {
    try {
      const conn = await oracledb.getConnection(dbconfig);

      // Numeric values
      should.throws(
        () => {
          conn.clientInfo = 3;
        },
        /NJS-004/
      );

      should.throws(
        () => {
          conn.dbOp = 4;
        },
        /NJS-004/
      );

      // NaN
      should.throws(
        () => {
          conn.clientInfo = NaN;
        },
        /NJS-004/
      );

      should.throws(
        () => {
          conn.dbOp = NaN;
        },
        /NJS-004/
      );

      // undefined
      should.throws(
        () => {
          conn.clientInfo = undefined;
        },
        /NJS-004/
      );

      should.throws(
        () => {
          conn.dbOp = undefined;
        },
        /NJS-004/
      );

      await conn.close();
    } catch (err) {
      should.not.exist(err);
    }
  }); // 193.4
});
