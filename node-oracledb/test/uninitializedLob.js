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
 *   65. uninitializedLob.js
 *
 * DESCRIPTION
 *   This test is provided by GitHub user for issue #344
 *   It tests an uninitialized LOB returns from a PL/SQL block.
 *
 *****************************************************************************/
'use strict';

var oracledb = require('oracledb');
var async    = require('async');
var should   = require('should');
var crypto   = require('crypto');
var stream   = require('stream');
var dbConfig = require('./dbconfig.js');

describe('65. uninitializedLob.js', function() {

  var connection = null;
  before(function(done) {
    async.series([
      function getConn(cb) {
        oracledb.getConnection(
          {
            user:          dbConfig.user,
            password:      dbConfig.password,
            connectString: dbConfig.connectString
          },
          function(err, conn) {
            should.not.exist(err);
            connection = conn;
            cb();
          }
        );
      },
      function createTab(callback) {
        var proc =  "BEGIN \n" +
                    "  DECLARE \n" +
                    "    e_table_missing EXCEPTION; \n" +
                    "    PRAGMA EXCEPTION_INIT(e_table_missing, -00942);\n " +
                    "   BEGIN \n" +
                    "     EXECUTE IMMEDIATE ('DROP TABLE nodb_lobdpi PURGE'); \n" +
                    "   EXCEPTION \n" +
                    "     WHEN e_table_missing \n" +
                    "     THEN NULL; \n" +
                    "   END; \n" +
                    "   EXECUTE IMMEDIATE (' \n" +
                    "     CREATE TABLE nodb_lobdpi ( \n" +
                    "       id NUMBER NOT NULL PRIMARY KEY, \n" +
                    "       spoc_cm_id NUMBER, \n" +
                    "       created_timestamp TIMESTAMP(5) DEFAULT SYSTIMESTAMP, \n" +
                    "       modified_timestamp TIMESTAMP(5) DEFAULT SYSTIMESTAMP \n" +
                    "     ) \n" +
                    "   '); \n" +
                    "END; ";

        connection.execute(
          proc,
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function createSeq(callback) {
        var proc =  "BEGIN \n" +
                    "  DECLARE \n" +
                    "    e_sequence_exists EXCEPTION; \n" +
                    "    PRAGMA EXCEPTION_INIT(e_sequence_exists, -02289);\n " +
                    "   BEGIN \n" +
                    "     EXECUTE IMMEDIATE ('DROP SEQUENCE nodb_lobdpi_seq'); \n" +
                    "   EXCEPTION \n" +
                    "     WHEN e_sequence_exists \n" +
                    "     THEN NULL; \n" +
                    "   END; \n" +
                    "   EXECUTE IMMEDIATE (' \n" +
                    "     CREATE SEQUENCE nodb_lobdpi_seq INCREMENT BY 1 START WITH 1 NOMAXVALUE CACHE 50 ORDER  \n" +
                    "   '); \n" +
                    "END; ";

        connection.execute(
          proc,
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function(callback) {
        var proc = "create or replace trigger nodb_lobdpi_rbi  \n" +
                   "  before insert on nodb_lobdpi referencing old as old new as new \n" +
                   "  for each row \n" +
                   "begin \n" +
                   "  :new.id := nodb_lobdpi_seq.nextval;\n" +
                   "end;";
        connection.execute(
          proc,
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function(callback) {
        var proc = "create or replace trigger nodb_lobdpi_rbu  \n" +
                   "  before update on nodb_lobdpi referencing old as old new as new \n" +
                   "  for each row \n" +
                   "begin \n" +
                   "  :new.modified_timestamp := systimestamp;\n" +
                   "end;";
        connection.execute(
          proc,
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function(callback) {
        var sql = "ALTER TABLE nodb_lobdpi ADD (blob_1 BLOB, unit32_1 NUMBER, date_1 TIMESTAMP(5), " +
                  "  string_1 VARCHAR2(250), CONSTRAINT string_1_uk UNIQUE (string_1))";

        connection.execute(
          sql,
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      }
    ], done);
  }); // before

  after(function(done) {
    async.series([
      function(callback) {
        connection.execute(
          "DROP SEQUENCE nodb_lobdpi_seq",
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function(callback) {
        connection.execute(
          "DROP TABLE nodb_lobdpi PURGE",
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function(callback) {
        connection.release(function(err) {
          should.not.exist(err);
          callback();
        });
      }
    ], done);
  }); // after

  it('65.1 an uninitialized Lob is returned from a PL/SQL block', function(done) {
    // async's times applies a function n times in series.
    async.timesSeries(3, function(n, next) {
      var string_1 = n % 2;
      var proc = "DECLARE \n" +
                 "  row_count NUMBER := 0;" +
                 "  negative_one NUMBER := -1;" +
                 "BEGIN \n" +
                 "  SELECT COUNT(*) INTO row_count FROM nodb_lobdpi WHERE (string_1 = :string_1);" +
                 "    IF (row_count = 0 ) THEN\n" +
                 "      INSERT INTO nodb_lobdpi (blob_1, string_1, spoc_cm_id) \n" +
                 "      VALUES (empty_blob(), :string_1, :spoc_cm_id) \n" +
                 "      RETURNING id, blob_1 INTO :id, :blob_1; \n" +
                 "    ELSE \n" +
                 "      :id     := negative_one;\n" +
                 "      :blob_1 := null; \n" +   // <---- make sure :blob_1 always has a value. Or it hits DPI-007 error.
                 "    END IF;\n" +
                 "END; ";

      connection.execute(
        proc,
        {
          id        : {type: oracledb.NUMBER, dir: oracledb.BIND_OUT},
          blob_1    : {type: oracledb.BLOB, dir: oracledb.BIND_OUT},
          string_1  : string_1,
          spoc_cm_id: 1
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false },
        function(err, result) {
          if (err) {
            console.error(err.message);
            return next(err);
          }

          //console.log(n + ':',result);

          if (result.outBinds.id == -1) {
            // a dup was found
            return next(null);
          }

          crypto.randomBytes(16, function(ex, buf) {
            var passthrough = new stream.PassThrough();
            passthrough.on('error', function(err) {
              should.not.exist(err);
            });

            result.outBinds.blob_1.on('error', function(err) {
              should.not.exist(err);
            });

            result.outBinds.blob_1.on('finish', function(err) {
              next(err);
            });

            passthrough.write(buf, function() {
              passthrough.pipe(result.outBinds.blob_1);
              passthrough.end();
            });
          });

        }
      );
    }, function(err) {
      should.not.exist(err);
      done();
    });
  }); //65.1
});
