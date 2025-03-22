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
 *   41. dataTypeBlob.js
 *
 * DESCRIPTION
 *    Testing Oracle data type support - BLOB.
 *    This test corresponds to example files:
 *         blobinsert1.js, blobstream1.js and blobstream2.js
 *    Firstly, Loads an image data and INSERTs it into a BLOB column.
 *    Secondly, SELECTs the BLOB and pipes it to a file, blobstreamout.jpg
 *    Thirdly, SELECTs the BLOB and compares it with the original image
 *
 *****************************************************************************/
'use strict';

var oracledb = require('oracledb');
var fs       = require('fs');
var async    = require('async');
var should   = require('should');
var dbConfig = require('./dbconfig.js');
var assist   = require('./dataTypeAssist.js');

var inFileName = 'test/fuzzydinosaur.jpg';  // contains the image to be inserted
var outFileName = 'test/blobstreamout.jpg';

describe('41. dataTypeBlob.js', function() {

  var connection = null;
  var tableName = "nodb_myblobs";

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

  describe('41.1 testing BLOB data type', function() {
    before('create table', function(done) {
      assist.createTable(connection, tableName, done);
    });

    after(function(done) {
      connection.execute(
        "DROP table " + tableName + " PURGE",
        function(err) {
          should.not.exist(err);
          done();
        }
      );
    });

    it('41.1.1 stores BLOB value correctly', function(done) {
      connection.should.be.ok();
      async.series([
        function blobinsert1(callback) {

          connection.execute(
            "INSERT INTO nodb_myblobs (num, content) VALUES (:n, EMPTY_BLOB()) RETURNING content INTO :lobbv",
            { n: 2, lobbv: {type: oracledb.BLOB, dir: oracledb.BIND_OUT} },
            { autoCommit: false },  // a transaction needs to span the INSERT and pipe()
            function(err, result) {
              should.not.exist(err);
              (result.rowsAffected).should.be.exactly(1);
              (result.outBinds.lobbv.length).should.be.exactly(1);

              var inStream = fs.createReadStream(inFileName);
              inStream.on('error', function(err) {
                should.not.exist(err, "inStream.on 'end' event");
              });

              var lob = result.outBinds.lobbv[0];

              lob.on('error', function(err) {
                should.not.exist(err, "lob.on 'error' event");
              });

              inStream.pipe(lob);  // pipes the data to the BLOB

              lob.on('finish', function() {
                connection.commit(function(err) {
                  should.not.exist(err);
                  callback();
                });
              });

            }
          );
        },
        function blobstream1(callback) {
          connection.execute(
            "SELECT content FROM nodb_myblobs WHERE num = :n",
            { n: 2 },
            function(err, result) {
              should.not.exist(err);

              var lob = result.rows[0][0];
              should.exist(lob);

              lob.on('error', function(err) {
                should.not.exist(err, "lob.on 'error' event");
              });

              var outStream = fs.createWriteStream(outFileName);

              outStream.on('error', function(err) {
                should.not.exist(err, "outStream.on 'error' event");
              });

              lob.pipe(outStream);

              outStream.on('finish', function() {
                fs.readFile(inFileName, function(err, originalData) {
                  should.not.exist(err);

                  fs.readFile(outFileName, function(err, generatedData) {
                    should.not.exist(err);
                    originalData.should.eql(generatedData);
                    callback();
                  });
                });

              }); // finish event
            }
          );
        },
        function blobstream2(callback) {

          connection.execute(
            "SELECT content FROM nodb_myblobs WHERE num = :n",
            { n: 2 },
            function(err, result) {
              should.not.exist(err);

              var blob = Buffer.alloc(0);
              var blobLength = 0;
              var lob = result.rows[0][0];

              should.exist(lob);

              lob.on('error', function(err) {
                should.not.exist(err, "lob.on 'error' event");
              });

              lob.on('data', function(chunk) {
                blobLength = blobLength + chunk.length;
                blob = Buffer.concat([blob, chunk], blobLength);
              });

              lob.on('end', function() {
                fs.readFile(inFileName, function(err, data) {
                  should.not.exist(err);
                  data.length.should.be.exactly(blob.length);
                  data.should.eql(blob);
                  callback();
                });
              });  // close event

            }
          );
        },
        function deleteOutFile(callback) {
          fs.unlink(outFileName, function(err) {
            should.not.exist(err);
            callback();
          });
        }
      ], done);
    }); // 41.1.1

    it('41.1.2 BLOB getData()', function(done) {
      connection.should.be.ok();
      async.series([
        function blobinsert1(callback) {

          connection.execute(
            "INSERT INTO nodb_myblobs (num, content) VALUES (:n, EMPTY_BLOB()) RETURNING content INTO :lobbv",
            { n: 3, lobbv: {type: oracledb.BLOB, dir: oracledb.BIND_OUT} },
            { autoCommit: false },  // a transaction needs to span the INSERT and pipe()
            function(err, result) {
              should.not.exist(err);
              (result.rowsAffected).should.be.exactly(1);
              (result.outBinds.lobbv.length).should.be.exactly(1);

              var inStream = fs.createReadStream(inFileName);
              inStream.on('error', function(err) {
                should.not.exist(err, "inStream.on 'end' event");
              });

              var lob = result.outBinds.lobbv[0];

              lob.on('error', function(err) {
                should.not.exist(err, "lob.on 'error' event");
              });

              inStream.pipe(lob);  // pipes the data to the BLOB

              lob.on('finish', function() {
                connection.commit(function(err) {
                  should.not.exist(err);
                  callback();
                });
              });

            }
          );
        },
        function blobstream2(callback) {

          connection.execute(
            "SELECT content FROM nodb_myblobs WHERE num = :n",
            { n: 3 },
            function(err, result) {
              should.not.exist(err);

              var lob = result.rows[0][0];
              should.exist(lob);

              fs.readFile(inFileName, function(err, data) {
                should.not.exist(err);
                lob.getData(function(err, blob) {
                  data.length.should.be.exactly(blob.length);
                  data.should.eql(blob);
                  callback();
                });
              });
            });
        }
      ], done);
    }); // 41.1.2

  }); //41.1

  describe('41.2 stores null value correctly', function() {
    it('41.2.1 testing Null, Empty string and Undefined', function(done) {
      assist.verifyNullValues(connection, tableName, done);
    });
  });

});
