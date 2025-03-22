/* Copyright (c) 2015, 2021, Oracle and/or its affiliates. All rights reserved. */

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
 *   36. dataTypeTimestamp4.js
 *
 * DESCRIPTION
 *    Testing Oracle data type support - TIMESTAMP (4) WITH TIME ZONE.
 *
 * NOTE
 *   TIMESTAMP support is still under enhancement request. This test is suspended.
 *
 *****************************************************************************/
'use strict';

var oracledb = require('oracledb');
var should   = require('should');
var async    = require('async');
var dbConfig = require('./dbconfig.js');
var assist   = require('./dataTypeAssist.js');

describe('36. dataTypeTimestamp4.js', function() {

  var connection = null;
  var tableName = "nodb_timestamp4";
  before('get one connection', function(done) {
    oracledb.getConnection(dbConfig, function(err, conn) {
      should.not.exist(err);
      connection = conn;
      done();
    }
    );
  });

  after('release connection', function(done) {
    connection.release(function(err) {
      should.not.exist(err);
      done();
    });
  });

  describe('36.1 Testing JavaScript Date with database TIMESTAMP (4) WITH TIME ZONE', function() {
    var dates = assist.data.dates;

    before('create table, insert data', function(done) {
      assist.setUp(connection, tableName, dates, done);
    });

    after(function(done) {
      oracledb.fetchAsString = [];
      connection.execute(
        "DROP table " + tableName + " PURGE",
        function(err) {
          should.not.exist(err);
          done();
        }
      );
    });

    it('36.1.1 works well with SELECT query', function(done) {
      assist.dataTypeSupport(connection, tableName, dates, done);
    });

    it('36.1.2 works well with result set', function(done) {
      assist.verifyResultSet(connection, tableName, dates, done);
    });

    it('36.1.3 works well with REF Cursor', function(done) {
      assist.verifyRefCursor(connection, tableName, dates, done);
    });

    it('36.1.4 columns fetched from REF CURSORS can be mapped by fetchInfo settings', function(done) {
      assist.verifyRefCursorWithFetchInfo(connection, tableName, dates, done);
    });

    it('36.1.5 columns fetched from REF CURSORS can be mapped by oracledb.fetchAsString', function(done) {
      oracledb.fetchAsString = [ oracledb.DATE ];
      assist.verifyRefCursorWithFetchAsString(connection, tableName, dates, done);
    });

  }); // end of 36.1 suite

  describe('36.2 stores null value correctly', function() {
    it('36.2.1 testing Null, Empty string and Undefined', function(done) {
      assist.verifyNullValues(connection, tableName, done);
    });
  });

  describe('36.3 testing TIMESTAMP (4) WITH TIME ZONE', function() {
    var timestamps = assist.TIMESTAMP_TZ_STRINGS_1;

    before(function(done) {
      assist.setUp4sql(connection, tableName, timestamps, done);
    });

    after(function(done) {
      connection.execute(
        "DROP table " + tableName + " PURGE",
        function(err) {
          should.not.exist(err);
          done();
        }
      );
    }); // after

    it('36.3.1 SELECT query - original data', function(done) {
      assist.selectOriginalData(connection, tableName, timestamps, done);
    });

    it('36.3.2 SELECT query - formatted data for comparison', function(done) {
      async.eachSeries(timestamps, function(timestamp, cb) {
        var bv = timestamps.indexOf(timestamp);
        connection.execute(
          "SELECT num, TO_CHAR(content, 'DD-MM-YYYY HH24:MI:SS.FF TZH:TZM') AS TS_DATA FROM " + tableName + " WHERE num = :no",
          { no: bv },
          { outFormat: oracledb.OUT_FORMAT_OBJECT },
          function(err, result) {
            should.not.exist(err);
            (result.rows[0].TS_DATA).should.equal(assist.content.timestamps4[bv]);
            cb();
          }
        );
      }, function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('36.3.3 returns scalar types from PL/SQL block', function(done) {
      var sql = "BEGIN SELECT systimestamp into :bv from dual; END;";
      var binds = { bv: { dir: oracledb.BIND_OUT, type: oracledb.STRING } };
      var options = { outFormat: oracledb.OUT_FORMAT_OBJECT };

      connection.execute(
        sql,
        binds,
        options,
        function(err, result) {
          should.not.exist(err);
          (result.outBinds.bv).should.be.a.String();
          done();
        }
      );

    });

  });

});
