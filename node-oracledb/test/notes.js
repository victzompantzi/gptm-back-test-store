/* Copyright (c) 2018, 2021, Oracle and/or its affiliates. All rights reserved. */

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
 *   notes.js
 *
 * DESCRIPTION
 *   The prerequiste checks of test suite.
 *
 *****************************************************************************/
'use strict';

const oracledb = require('oracledb');
const async = require('async');
const dbconfig = require('./dbconfig.js');

/****************** Verify the "user/password" provided by user **********************/
const LOGTAG = "Global before-all Hook:\n";

const configList = [
  {
    user: dbconfig.user,
    password: dbconfig.password,
    connectString: dbconfig.connectString,
    errMsg: LOGTAG +
      "\tGetting connection using default schema user failed.\n" +
      "\tPlease ensure you set the following environment variables correctly:\n" +
      "\t* NODE_ORACLEDB_USER\n" +
      "\t* NODE_ORACLEDB_PASSWORD\n" +
      "\t* NODE_ORACLEDB_CONNECTIONSTRING\n",
  }
];

if (dbconfig.test.DBA_PRIVILEGE) {
  configList.push({
    user: dbconfig.test.DBA_user,
    password: dbconfig.test.DBA_password,
    connectString: dbconfig.connectString,
    privilege: oracledb.SYSDBA,
    errMsg: LOGTAG +
      "\tGetting connection using DBA user failed.\n" +
      "\tPlease ensure you set the following environment variables correctly:\n" +
      "\t* NODE_ORACLEDB_DBA_USER\n" +
      "\t* NODE_ORACLEDB_DBA_PASSWORD\n" +
      "\tOr skip tests that requires DBA privilege using:\n" +
      "\tunset NODE_ORACLEDB_DBA_PRIVILEGE\n",
  });
}

if (dbconfig.test.externalAuth) {
  configList.push({
    externalAuth:  true,
    connectString: dbconfig.connectString,
    errMsg: LOGTAG +
      "\tGetting connection using external authentication failed.\n" +
      "\tPlease ensure you set the external authentication environment correctly.\n" +
      "\tOr skip tests that requires external authentication using:\n" +
      "\tunset NODE_ORACLEDB_EXTERNALAUTH\n",
  });
}

if (dbconfig.test.proxySessionUser) {
  configList.push({
    user: `${dbconfig.user}[${dbconfig.test.proxySessionUser}]`,
    password: dbconfig.password,
    connectString: dbconfig.connectString,
    errMsg: LOGTAG +
      "\tGetting connection using proxy authentication failed.\n" +
      "\tPlease ensure you set the proxy authentication environment correctly.\n" +
      "\tOr skip tests that requires proxy authentication using:\n" +
      "\tunset NODE_ORACLEDB_PROXY_SESSION_USER\n"
  });
}

before(function(done) {
  var conn, seriesList = [];
  configList.map(function(conf, index) {
    seriesList.push(function(cb) {
      oracledb.getConnection(conf, function(err, connection) {
        conn = connection;
        cb(err, index);
      });
    });
    seriesList.push(function(cb) {
      conn.execute(
        "select * from dual", [], { outFormat: oracledb.OUT_FORMAT_ARRAY },
        function(err, result) {
          if (!err && result.rows && (result.rows[0][0] === "X")) {
            cb(null, index);
          } else {
            cb(new Error("Query test failed"), index);
          }
        }
      );
    });
    seriesList.push(function(cb) {
      conn.close(function(err) {
        cb(err, index);
      });
    });
  });
  async.series(seriesList, function(err, results) {
    if (err) {
      done(configList[results[results.length - 1]].errMsg);
    } else {
      done();
    }
  });
});
