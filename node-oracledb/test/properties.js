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
 *   58. properties.js
 *
 * DESCRIPTION
 *   Testing getters and setters for oracledb and pool classes.
 *   This test aims to increase the code coverage rate.
 *
 *****************************************************************************/
'use strict';

var oracledb = require('oracledb');
var should   = require('should');
var async    = require('async');
var dbConfig = require('./dbconfig.js');
var assist   = require('./dataTypeAssist.js');

describe('58. properties.js', function() {

  describe('58.1 Oracledb Class', function() {

    var defaultValues = {};

    before('save the default values', function() {
      defaultValues.poolMin          = oracledb.poolMin;
      defaultValues.poolMax          = oracledb.poolMax;
      defaultValues.poolIncrement    = oracledb.poolIncrement;
      defaultValues.poolTimeout      = oracledb.poolTimeout;
      defaultValues.maxRows          = oracledb.maxRows;
      defaultValues.fetchArraySize   = oracledb.fetchArraySize;
      defaultValues.autoCommit       = oracledb.autoCommit;
      defaultValues.dbObjectAsPojo   = oracledb.dbObjectAsPojo;
      defaultValues.connectionClass  = oracledb.connectionClass;
      defaultValues.externalAuth     = oracledb.externalAuth;
      defaultValues.fetchAsString    = oracledb.fetchAsString;
      defaultValues.outFormat        = oracledb.outFormat;
      defaultValues.lobPrefetchSize  = oracledb.lobPrefetchSize;
      defaultValues.queueTimeout     = oracledb.queueTimeout;
      defaultValues.queueMax         = oracledb.queueMax;
      defaultValues.stmtCacheSize    = oracledb.stmtCacheSize;
      defaultValues.poolPingInterval = oracledb.poolPingInterval;
      defaultValues.fetchAsBuffer    = oracledb.fetchAsBuffer;
      defaultValues.edition          = oracledb.edition;
      defaultValues.events           = oracledb.events;
    });

    after('restore the values', function() {
      oracledb.poolMin          = defaultValues.poolMin;
      oracledb.poolMax          = defaultValues.poolMax;
      oracledb.poolIncrement    = defaultValues.poolIncrement;
      oracledb.poolTimeout      = defaultValues.poolTimeout;
      oracledb.maxRows          = defaultValues.maxRows;
      oracledb.fetchArraySize   = defaultValues.fetchArraySize;
      oracledb.autoCommit       = defaultValues.autoCommit;
      oracledb.dbObjectAsPojo   = defaultValues.dbObjectAsPojo;
      oracledb.connectionClass  = defaultValues.connectionClass;
      oracledb.externalAuth     = defaultValues.externalAuth;
      oracledb.fetchAsString    = defaultValues.fetchAsString;
      oracledb.outFormat        = defaultValues.outFormat;
      oracledb.lobPrefetchSize  = defaultValues.lobPrefetchSize;
      oracledb.queueTimeout     = defaultValues.queueTimeout;
      oracledb.queueMax         = defaultValues.queueMax;
      oracledb.stmtCacheSize    = defaultValues.stmtCacheSize;
      oracledb.poolPingInterval = defaultValues.poolPingInterval;
      oracledb.fetchAsBuffer    = defaultValues.fetchAsBuffer;
      oracledb.edition          = defaultValues.edition;
      oracledb.events           = defaultValues.events;
    });

    it('58.1.1 poolMin', function() {
      var t = oracledb.poolMin;
      oracledb.poolMin = t + 1;

      t.should.eql(defaultValues.poolMin);
      (oracledb.poolMin).should.eql(defaultValues.poolMin + 1);
    });

    it('58.1.2 poolMax', function() {
      var t = oracledb.poolMax;
      oracledb.poolMax = t + 1;

      t.should.eql(defaultValues.poolMax);
      (oracledb.poolMax).should.eql(defaultValues.poolMax + 1);
    });

    it('58.1.3 poolIncrement', function() {
      var t = oracledb.poolIncrement;
      oracledb.poolIncrement = t + 1;

      t.should.eql(defaultValues.poolIncrement);
      (oracledb.poolIncrement).should.eql(defaultValues.poolIncrement + 1);
    });

    it('58.1.4 poolTimeout', function() {
      var t = oracledb.poolTimeout;
      oracledb.poolTimeout = t + 1;

      t.should.eql(defaultValues.poolTimeout);
      (oracledb.poolTimeout).should.eql(defaultValues.poolTimeout + 1);
    });

    it('58.1.5 maxRows', function() {
      var t = oracledb.maxRows;
      oracledb.maxRows = t + 1;

      t.should.eql(defaultValues.maxRows);
      (oracledb.maxRows).should.eql(defaultValues.maxRows + 1);
    });

    it('58.1.6 fetchArraySize', function() {
      var t = oracledb.fetchArraySize;
      oracledb.fetchArraySize = t + 1;

      t.should.eql(defaultValues.fetchArraySize);
      (oracledb.fetchArraySize).should.eql(defaultValues.fetchArraySize + 1);
    });

    it('58.1.7 autoCommit', function() {
      var t = oracledb.autoCommit;
      oracledb.autoCommit = !t;

      t.should.eql(defaultValues.autoCommit);
      (oracledb.autoCommit).should.eql(!defaultValues.autoCommit);

    });

    it('58.1.8 version (read-only)', function() {
      (oracledb.version).should.be.a.Number();
      should.throws(
        function() {
          oracledb.version = 5;
        },
        "TypeError: Cannot assign to read only property 'version' of object '#<OracleDb>"
      );
    });

    it('58.1.9 connectionClass', function() {
      var t = oracledb.connectionClass;
      oracledb.connectionClass = 'DEVPOOL';
      var cclass = oracledb.connectionClass;

      should.equal(t, '');
      should.strictEqual(cclass, 'DEVPOOL');
    });

    it('58.1.10 externalAuth', function() {
      var t = oracledb.externalAuth;
      oracledb.externalAuth = !t;

      t.should.eql(defaultValues.externalAuth);
      (oracledb.externalAuth).should.eql(!defaultValues.externalAuth);
    });

    it('58.1.11 fetchAsString', function() {
      var t = oracledb.fetchAsString;
      oracledb.fetchAsString = [oracledb.DATE];

      t.should.eql(defaultValues.fetchAsString);
      (oracledb.fetchAsString).should.not.eql(defaultValues.fetchAsString);
    });

    it('58.1.12 outFormat', function() {
      var t = oracledb.outFormat;
      oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

      t.should.eql(oracledb.OUT_FORMAT_ARRAY);
      (oracledb.outFormat).should.not.eql(defaultValues.outFormat);
    });

    it('58.1.13 lobPrefetchSize', function() {
      var t = oracledb.lobPrefetchSize;
      oracledb.lobPrefetchSize = t + 1;

      t.should.eql(defaultValues.lobPrefetchSize);
      (oracledb.lobPrefetchSize).should.eql(defaultValues.lobPrefetchSize + 1);
    });

    it('58.1.14 oracleClientVersion (read-only)', function() {
      var t = oracledb.oracleClientVersion;
      t.should.be.a.Number();

      should.throws(
        function() {
          oracledb.oracleClientVersion = t + 1;
        },
        "TypeError: Cannot assign to read only property 'oracleClientVersion' of object '#<OracleDb>"
      );
    });

    it('58.1.15 queueTimeout', function() {
      var t = oracledb.queueTimeout;
      oracledb.queueTimeout = t + 1000;

      should.equal(t, defaultValues.queueTimeout);
      should.notEqual(oracledb.queueTimeout, defaultValues.queueTimeout);
    });

    it('58.1.16 queueMax', function() {
      var t = oracledb.queueMax;
      oracledb.queueMax = t + 1000;

      should.equal(t, defaultValues.queueMax);
      should.notEqual(oracledb.queueMax, defaultValues.queueMax);
    });

    it('58.1.17 stmtCacheSize', function() {
      var t = oracledb.stmtCacheSize;
      oracledb.stmtCacheSize = t + 5;

      should.equal(t, defaultValues.stmtCacheSize);
      should.notEqual(oracledb.stmtCacheSize, defaultValues.stmtCacheSize);
    });

    it('58.1.18 poolPingInterval', function() {
      var t = oracledb.poolPingInterval;
      oracledb.poolPingInterval = t + 100;

      should.equal(t, defaultValues.poolPingInterval);
      should.notEqual(oracledb.poolPingInterval, defaultValues.poolPingInterval);
    });

    it('58.1.19 fetchAsBuffer', function() {
      var t = oracledb.fetchAsBuffer;
      oracledb.fetchAsBuffer = [ oracledb.BLOB ];

      t.should.eql(defaultValues.fetchAsBuffer);
      (oracledb.fetchAsBuffer).should.not.eql(defaultValues.fetchAsBuffer);
    });

    it('58.1.20 Negative - connectionClass ', function() {
      should.throws(
        function() {
          oracledb.connectionClass = NaN;
        },
        /NJS-004: invalid value for property [\w]/
      );
    });

    it('58.1.21 Negative - autoCommit', function() {
      should.throws(
        function() {
          oracledb.autoCommit = 2017;
        },
        /NJS-004: invalid value for property [\w]/
      );
    });

    it('58.1.22 Negative - outFormat', function() {
      should.throws(
        function() {
          oracledb.outFormat = 'abc';
        },
        /NJS-004: invalid value for property [\w]/
      );
    });

    it('58.1.23 Negative - externalAuth', function() {
      should.throws(
        function() {
          oracledb.externalAuth = 2017;
        },
        /NJS-004: invalid value for property [\w]/
      );
    });

    it('58.1.24 versionString (read-only)', function() {
      var t = oracledb.versionString;
      t.should.be.a.String();

      should.throws(
        function() {
          oracledb.versionString = t + "foobar";
        },
        "TypeError: Cannot assign to read only property 'versionString' of object '#<OracleDb>"
      );
    });

    it('58.1.25 versionSuffix (read-only)', function() {
      var t = oracledb.versionSuffix;

      if (t) // it could be a String, or undefined
        t.should.be.a.String();

      should.throws(
        function() {
          oracledb.versionSuffix = t + "foobar";
        },
        "TypeError: Cannot assign to read only property 'versionSuffix' of object '#<OracleDb>"
      );
    });

    it('58.1.26 oracleClientVersionString (read-only)', function() {
      var t = oracledb.oracleClientVersionString;
      t.should.be.a.String();

      should.throws(
        function() {
          oracledb.oracleClientVersion = t + "foobar";
        },
        "TypeError: Cannot assign to read only property 'oracleClientVersionString' of object '#<OracleDb>"
      );
    });

    it('58.1.27 edition', function() {
      var t = oracledb.edition;
      oracledb.edition = 'foobar';
      var e = oracledb.edition;

      should.equal(t, '');
      should.strictEqual(e, 'foobar');
    });

    it('58.1.28 Negative - edition', function() {
      should.throws(
        function() {
          oracledb.edition = 123;
        },
        /NJS-004: invalid value for property edition/
      );
    });

    it('58.1.29 events', function() {
      var t = oracledb.events;
      oracledb.events = true;

      should.strictEqual(t, false);
      should.strictEqual(oracledb.events, true);
    });

    it('58.1.30 Negative - events', function() {
      should.throws(
        function() {
          oracledb.events = 'hello';
        },
        /NJS-004: invalid value for property events/
      );
    });

    it('58.1.31 dbObjectAsPojo', function() {
      var t = oracledb.dbObjectAsPojo;
      oracledb.dbObjectAsPojo = !t;

      t.should.eql(defaultValues.dbObjectAsPojo);
      (oracledb.dbObjectAsPojo).should.eql(!defaultValues.dbObjectAsPojo);

    });

  }); // 58.1

  describe('58.2 Pool Class', function() {
    var pool = null;

    before(function(done) {
      oracledb.createPool(
        {
          user:          dbConfig.user,
          password:      dbConfig.password,
          connectString: dbConfig.connectString
        },
        function(err, p) {
          should.not.exist(err);
          pool = p;
          done();
        }
      );
    });

    after(function(done) {
      pool.terminate(function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('58.2.1 poolMin', function() {
      var t = pool.poolMin;
      t.should.be.a.Number();

      should.throws(
        function() {
          pool.poolMin = t + 1;
        },
        "TypeError: Cannot assign to read only property 'poolMin' of object '#<Pool>"
      );
    });

    it('58.2.2 poolMax', function() {
      var t = pool.poolMax;
      t.should.be.a.Number();

      should.throws(
        function() {
          pool.poolMax = t + 1;
        },
        "TypeError: Cannot assign to read only property 'poolMax' of object '#<Pool>"
      );
    });

    it('58.2.3 poolIncrement', function() {
      var t = pool.poolIncrement;
      t.should.be.a.Number();

      should.throws(
        function() {
          pool.poolIncrement = t + 1;
        },
        "TypeError: Cannot assign to read only property 'poolIncrement' of object '#<Pool>"
      );
    });

    it('58.2.4 poolTimeout', function() {
      var t = pool.poolTimeout;
      t.should.be.a.Number();

      should.throws(
        function() {
          pool.poolTimeout = t + 1;
        },
        "TypeError: Cannot assign to read only property 'poolTimeout' of object '#<Pool>"
      );
    });

    it('58.2.5 stmtCacheSize', function() {
      var t = pool.stmtCacheSize;
      t.should.be.a.Number();

      should.throws(
        function() {
          pool.stmtCacheSize = t + 1;
        },
        "TypeError: Cannot assign to read only property 'stmtCacheSize' of object '#<Pool>"
      );
    });

    it('58.2.6 connectionsInUse', function() {
      var t = pool.connectionsInUse;
      t.should.be.a.Number();

      should.throws(
        function() {
          pool.connectionsInUse = t + 1;
        },
        "TypeError: Cannot assign to read only property 'connectionsInUse' of object '#<Pool>"
      );
    });

    it('58.2.7 connectionsOpen', function() {
      var t = pool.connectionsOpen;
      t.should.be.a.Number();

      should.throws(
        function() {
          pool.connectionsOpen = t + 1;
        },
        "TypeError: Cannot assign to read only property 'connectionsOpen' of object '#<Pool>"
      );
    });

    it('58.2.8 queueTimeout', function() {
      var t = pool.queueTimeout;
      t.should.be.a.Number();

      should.throws(
        function() {
          pool.queueTimeout = t + 1000;
        },
        "TypeError: Cannot assign to read only property 'queueTimeout' of object '#<Pool>"
      );
    });

    it('58.2.9 poolPingInterval', function() {
      var t = pool.poolPingInterval;
      t.should.be.a.Number();

      should.throws(
        function() {
          pool.poolPingInterval = t + 100;
        },
        "TypeError: Cannot assign to read only property 'poolPingInterval' of object '#<Pool>"
      );
    });

    it('58.2.10 queueMax', function() {
      var t = pool.queueMax;
      t.should.be.a.Number();

      should.throws(
        function() {
          pool.queueMax = t + 1000;
        },
        "TypeError: Cannot assign to read only property 'queueMax' of object '#<Pool>"
      );
    });

  }); // 58.2

  describe('58.3 Connection Class', function() {
    var connection = null;

    before('get one connection', function(done) {
      oracledb.getConnection(
        {
          user:          dbConfig.user,
          password:      dbConfig.password,
          connectString: dbConfig.connectString
        },
        function(err, conn) {
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

    it('58.3.1 Connection object initial toString values', function() {
      connection.should.be.an.Object;

      should.equal(connection.action, null);
      should.equal(connection.module, null);
      should.equal(connection.clientId, null);

      (connection.stmtCacheSize).should.be.a.Number();
      (connection.stmtCacheSize).should.be.greaterThan(0);
    });

    it('58.3.2 stmtCacheSize (read-only)', function() {
      var t = connection.stmtCacheSize;
      t.should.be.a.Number();

      should.throws(
        function() {
          connection.stmtCacheSize = t + 1;
        },
        "TypeError: Cannot assign to read only property 'stmtCacheSize' of object '#<Connection>"
      );
    });

    it('58.3.3 clientId (write-only)', function() {
      var t = connection.clientId;
      should.strictEqual(t, null);

      should.throws(
        function() {
          connection.clientId = 4;
        },
        /NJS-004: invalid value for property [\w]/
      );

      should.doesNotThrow(
        function() {
          connection.clientId = "103.3";
        }
      );
    });

    it('58.3.4 action (write-only)', function() {
      var t = connection.action;
      should.strictEqual(t, null);

      should.throws(
        function() {
          connection.action = 4;
        },
        /NJS-004: invalid value for property [\w]/
      );

      should.doesNotThrow(
        function() {
          connection.action = "103.3 action";
        }
      );
    });

    it('58.3.5 module (write-only)', function() {
      var t = connection.module;
      should.strictEqual(t, null);

      should.throws(
        function() {
          connection.module = 4;
        },
        /NJS-004: invalid value for property [\w]/
      );

      should.doesNotThrow(
        function() {
          connection.clientId = "103.3 module";
        }
      );
    });

    it('58.3.6 oracleServerVersion (read-only)', function() {
      var t = connection.oracleServerVersion;
      t.should.be.a.Number();

      should.throws(
        function() {
          connection.oracleServerVersion = t + 1;
        },
        "TypeError: Cannot assign to read only property 'oracleServerVersion' of object '#<Connection>"
      );
    });

    it('58.3.7 oracleServerVersionString (read-only)', function() {
      var t = connection.oracleServerVersionString;
      t.should.be.a.String();

      should.throws(
        function() {
          connection.oracleServerVersion = t + "foobar";
        },
        "TypeError: Cannot assign to read only property 'oracleServerVersion' of object '#<Connection>"
      );
    });

    it('58.3.8 currentSchema', function() {
      var t = connection.currentSchema;
      should.strictEqual(t, '');

      should.throws(
        function() {
          connection.currentSchema = 4;
        },
        /NJS-004: invalid value for property [\w]/
      );

      should.doesNotThrow(
        function() {
          connection.currentSchema = dbConfig.user;
        }
      );
    });

  }); // 58.3

  describe('58.4 ResultSet Class', function() {

    var tableName = "nodb_number";
    var numbers = assist.data.numbers;
    var connection = null;
    var resultSet = null;

    before('get resultSet class', function(done) {
      async.series([
        function(callback) {
          oracledb.getConnection(
            {
              user:          dbConfig.user,
              password:      dbConfig.password,
              connectString: dbConfig.connectString
            },
            function(err, conn) {
              should.not.exist(err);
              connection = conn;
              callback();
            }
          );
        },
        function(callback) {
          assist.setUp(connection, tableName, numbers, callback);
        },
        function(callback) {
          connection.execute(
            "SELECT * FROM " + tableName + " ORDER BY num",
            [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT },
            function(err, result) {
              should.not.exist(err);
              resultSet = result.resultSet;
              callback();
            }
          );
        }
      ], done);
    });

    after(function(done) {
      connection.execute(
        "DROP TABLE " + tableName + " PURGE",
        function(err) {
          should.not.exist(err);

          connection.release(function(err) {
            should.not.exist(err);
            done();
          });
        }
      );
    });

    it('58.4.1 metaData (read-only)', function(done) {
      should.exist(resultSet.metaData);
      var t = resultSet.metaData;
      t.should.eql([ { name: 'NUM' }, { name: 'CONTENT' } ]);

      should.throws(
        function() {
          resultSet.metaData = {"foo": "bar"};
        },
        "TypeError: Cannot assign to read only property 'metaData' of object '#<ResultSet>"
      );
      resultSet.close(done);
    });

  }); // 58.4
});
