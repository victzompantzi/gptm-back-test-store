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
 *   8. autoCommitForSelect.js
 *
 * DESCRIPTION
 *   Testing autoCommit feature for SELECTs feature.
 *
 *****************************************************************************/
'use strict';

var oracledb = require('oracledb');
var should   = require('should');
var async    = require('async');
var dbConfig = require('./dbconfig.js');

describe('8. autoCommitForSelect.js', function() {

  var connection = null;
  var anotherConnection = null;

  var script =
      "BEGIN \
          DECLARE \
              e_table_missing EXCEPTION; \
              PRAGMA EXCEPTION_INIT(e_table_missing, -00942); \
          BEGIN \
              EXECUTE IMMEDIATE ('DROP TABLE nodb_commit4_dept PURGE'); \
          EXCEPTION \
              WHEN e_table_missing \
              THEN NULL; \
          END; \
          EXECUTE IMMEDIATE (' \
              CREATE TABLE nodb_commit4_dept ( \
                  department_id NUMBER,  \
                  department_name VARCHAR2(20) \
              ) \
          '); \
          EXECUTE IMMEDIATE (' \
              INSERT INTO nodb_commit4_dept  \
                   (department_id, department_name) VALUES \
                   (40,''Human Resources'') \
          '); \
          EXECUTE IMMEDIATE (' \
              INSERT INTO nodb_commit4_dept  \
                   (department_id, department_name) VALUES \
                   (20, ''Marketing'') \
          '); \
      END; ";

  before(function(done) {

    async.parallel([
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
        oracledb.getConnection(
          {
            user:          dbConfig.user,
            password:      dbConfig.password,
            connectString: dbConfig.connectString
          },
          function(err, conn) {
            should.not.exist(err);
            anotherConnection = conn;
            callback();
          }
        );
      }
    ], done);
  });

  after(function(done) {
    async.parallel([
      function(callback) {
        connection.release(function(err) {
          if (err) {
            console.error(err.message); return;
          }
          callback();
        });
      },
      function(callback) {
        anotherConnection.release(function(err) {
          if (err) {
            console.error(err.message); return;
          }
          callback();
        });
      }
    ], done);
  });

  beforeEach(function(done) {
    connection.execute(script, function(err) {
      if (err) {
        console.error(err.message); return;
      }
      // DML 'insert' statement does not commit automatically.
      // So the explicit commit is added.
      connection.commit(function(err) {
        should.not.exist(err);
        done();
      });
    });
  });

  afterEach(function(done) {
    connection.execute(
      'DROP TABLE nodb_commit4_dept purge',
      function(err) {
        if (err) {
          console.error(err.message); return;
        }
        done();
      }
    );
  });

  it('8.1 should return previous value when autoCommit is false', function(done) {
    connection.should.be.ok();
    oracledb.autoCommit = false;

    async.series([
      function(callback) {
        connection.execute(
          "INSERT INTO nodb_commit4_dept VALUES (180, 'Construction')",
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function(callback) {
        connection.execute(
          "UPDATE nodb_commit4_dept SET department_id = 99 WHERE department_name = 'Marketing'",
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function(callback) {
        connection.execute(
          "SELECT * FROM nodb_commit4_dept ORDER BY department_id",
          function(err, result) {
            should.not.exist(err);
            (result.rows).should.containEql([180, 'Construction']);
            callback();
          }
        );
      },
      function(callback) {
        anotherConnection.execute(
          "SELECT * FROM nodb_commit4_dept ORDER BY department_id",
          function(err, result) {
            should.not.exist(err);
            (result.rows).should.not.containEql([180, 'Construction']);
            callback();
          }
        );
      },
      function(callback) {
        connection.execute(
          "SELECT department_id FROM nodb_commit4_dept WHERE department_name = 'Marketing'",
          function(err, result) {
            should.not.exist(err);
            (result.rows[0][0]).should.eql(99);
            callback();
          }
        );
      },
      function(callback) {
        anotherConnection.execute(
          "SELECT department_id FROM nodb_commit4_dept WHERE department_name = 'Marketing'",
          function(err, result) {
            should.not.exist(err);
            (result.rows[0][0]).should.eql(20);
            callback();
          }
        );
      }
    ], done);
  });

  it('8.2 can use explicit commit() to keep data consistent', function(done) {
    connection.should.be.ok();
    oracledb.autoCommit = false;

    async.series([
      function(callback) {
        connection.execute(
          "INSERT INTO nodb_commit4_dept VALUES (180, 'Construction')",
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function(callback) {
        connection.execute(
          "UPDATE nodb_commit4_dept SET department_id = 99 WHERE department_name = 'Marketing'",
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function(callback) {
        connection.commit(function(err) {
          should.not.exist(err);
          callback();
        });
      },
      function(callback) {
        connection.execute(
          "SELECT * FROM nodb_commit4_dept ORDER BY department_id",
          function(err, result) {
            should.not.exist(err);
            (result.rows).should.containEql([180, 'Construction']);
            callback();
          }
        );
      },
      function(callback) {
        anotherConnection.execute(
          "SELECT * FROM nodb_commit4_dept ORDER BY department_id",
          function(err, result) {
            should.not.exist(err);
            (result.rows).should.containEql([180, 'Construction']);
            callback();
          }
        );
      },
      function(callback) {
        connection.execute(
          "SELECT department_id FROM nodb_commit4_dept WHERE department_name = 'Marketing'",
          function(err, result) {
            should.not.exist(err);
            (result.rows[0][0]).should.eql(99);
            callback();
          }
        );
      },
      function(callback) {
        anotherConnection.execute(
          "SELECT department_id FROM nodb_commit4_dept WHERE department_name = 'Marketing'",
          function(err, result) {
            should.not.exist(err);
            (result.rows[0][0]).should.eql(99);
            callback();
          }
        );
      }
    ], done);
  });

  it('8.3 can also use the autoCommit for SELECTs feature', function(done) {
    connection.should.be.ok();
    oracledb.autoCommit = false;

    async.series([
      function(callback) {
        connection.execute(
          "INSERT INTO nodb_commit4_dept VALUES (180, 'Construction')",
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function(callback) {
        connection.execute(
          "UPDATE nodb_commit4_dept SET department_id = 99 WHERE department_name = 'Marketing'",
          function(err) {
            should.not.exist(err);
            callback();
          }
        );
      },
      function(callback) {
        connection.commit(function(err) {
          should.not.exist(err);
          callback();
        });
      },
      function(callback) {
        connection.execute(
          "SELECT * FROM nodb_commit4_dept ORDER BY department_id",
          {},
          {autoCommit: true},
          function(err, result) {
            should.not.exist(err);
            (result.rows).should.containEql([180, 'Construction']);
            callback();
          }
        );
      },
      function(callback) {
        anotherConnection.execute(
          "SELECT * FROM nodb_commit4_dept ORDER BY department_id",
          function(err, result) {
            should.not.exist(err);
            (result.rows).should.containEql([180, 'Construction']);
            callback();
          }
        );
      },
      function(callback) {
        connection.execute(
          "SELECT department_id FROM nodb_commit4_dept WHERE department_name = 'Marketing'",
          function(err, result) {
            should.not.exist(err);
            (result.rows[0][0]).should.eql(99);
            callback();
          }
        );
      },
      function(callback) {
        anotherConnection.execute(
          "SELECT department_id FROM nodb_commit4_dept WHERE department_name = 'Marketing'",
          function(err, result) {
            should.not.exist(err);
            (result.rows[0][0]).should.eql(99);
            callback();
          }
        );
      }
    ], done);
  });
});
