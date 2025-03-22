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
 *   2. pool.js
 *
 * DESCRIPTION
 *   Testing properties of connection pool.
 *
 *****************************************************************************/
'use strict';

var oracledb = require('oracledb');
var async    = require('async');
var should   = require('should');
var dbConfig = require('./dbconfig.js');

describe('2. pool.js', function() {

  describe('2.1 default setting', function() {

    it('2.1.1 testing default values of pool properties', function(done) {

      oracledb.createPool(
        {
          user:          dbConfig.user,
          password:      dbConfig.password,
          connectString: dbConfig.connectString
        },
        function(err, pool) {
          should.not.exist(err);
          pool.should.be.ok();

          var defaultMin = 0;
          var defaultMax = 4;
          var defaultIncrement = 1;
          var defaultTimeout = 60;
          var defaultStmtCacheSize = 30;

          pool.poolMin.should.be.exactly(defaultMin).and.be.a.Number();
          pool.poolMax.should.be.exactly(defaultMax).and.be.a.Number();
          pool.poolIncrement.should.be.exactly(defaultIncrement).and.be.a.Number();
          pool.poolTimeout.should.be.exactly(defaultTimeout).and.be.a.Number();
          pool.stmtCacheSize.should.be.exactly(defaultStmtCacheSize).and.be.a.Number();

          pool.connectionsOpen.should.equal(0);
          pool.connectionsInUse.should.equal(0);

          pool.terminate(function(err) {
            should.not.exist(err);
            done();
          });
        }
      );

    });

  });

  describe('2.2 poolMin', function() {

    it('2.2.1 poolMin cannot be a negative number', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : -5,
          poolMax           : 5,
          poolIncrement     : 1,
          poolTimeout       : 28,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');

          should.not.exist(pool);
          done();
        }
      );
    });

    it('2.2.2 poolMin must be a Number', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : NaN,
          poolMax           : 5,
          poolIncrement     : 1,
          poolTimeout       : 28,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');

          should.not.exist(pool);
          done();
        }
      );
    });

    it('2.2.3 poolMin cannot greater than poolMax', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 10,
          poolMax           : 5,
          poolIncrement     : 1,
          poolTimeout       : 28,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('ORA-24413:');

          should.not.exist(pool);
          done();
        }
      );
    });

    it('2.2.4 (poolMin + poolIncrement) can equal to poolMax', function(done) {

      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 5,
          poolIncrement     : 4,
          poolTimeout       : 28,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.not.exist(err);
          pool.should.be.ok();
          should.strictEqual(pool.connectionsInUse, 0);

          pool.terminate(function(err) {
            should.not.exist(err);
            done();
          });
        }
      );

    });

  }); // 2.2

  describe('2.3 poolMax', function() {

    it('2.3.1 poolMax cannot be a negative value', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 5,
          poolMax           : -5,
          poolIncrement     : 1,
          poolTimeout       : 28,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');

          should.not.exist(pool);
          done();
        }
      );
    });

    it('2.3.2 poolMax cannot be 0', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 0,
          poolMax           : 0,
          poolIncrement     : 1,
          poolTimeout       : 28,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('ORA-24413:');

          should.not.exist(pool);
          done();
        }
      );
    });

    it('2.3.3 poolMax must be a number', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : true,
          poolMax           : 5,
          poolIncrement     : 1,
          poolTimeout       : 28,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');

          should.not.exist(pool);
          done();
        }
      );
    });

    it('2.3.4 poolMax and poolMin actually limit the pool size', function(done) {
      var conns = [], pool, isPoolClosed = false;
      async.series([
        function(cb) {
          oracledb.createPool({
            ...dbConfig,
            poolMax: 2,
            poolMin: 1,
            poolTimeout: 1,
            queueTimeout: 1,
          }, function(err, newPool) {
            pool = newPool;
            cb(err);
          });
        },
        function(cb) {
          pool.getConnection(function(err, newConn) {
            if (!newConn) {
              cb(new Error("Failed to create connection"));
              return;
            }
            conns.push(newConn);
            cb(err);
          });
        },
        function(cb) {
          pool.getConnection(function(err, newConn) {
            if (!newConn) {
              cb(new Error("Failed to create connection"));
              return;
            }
            conns.push(newConn);
            cb(err);
          });
        },
        // The third connection should throw NJS-040 error within queueTimeout ms,
        // No NJS-040 error means poolMax parameter failed to limit connection number
        function(cb) {
          pool.getConnection(function(err) {
            if (err && err.message.startsWith("NJS-040")) {
              cb();
            } else {
              cb(new Error("PoolMax failed to limit connection numbers"));
            }
          });
        },
        function(cb) {
          conns[0].close(function(err) {
            cb(err);
          });
        },
        function(cb) {
          conns[1].close(function(err) {
            cb(err);
          });
        },
        function(cb) {
          setTimeout(function() {
            // The number of remaining connections after poolTimeout seconds should >= poolMin.
            // The number of remaining connections < poolMin means poolMin parameter failed to limit connection number
            if (pool.connectionsOpen < 1) {
              cb(new Error("PoolMin failed to limit connection numbers"));
              return;
            }
            pool.close(function(err) {
              if (!err) isPoolClosed = true;
              cb(err);
            });
          }, 2000);
        },
      ], function(err) {
        if (!isPoolClosed) {
          pool.close(0, function(err) {
            done(err);
          });
        } else {
          done(err);
        }
      });
    });

  }); // 2.3

  describe('2.4 poolIncrement', function() {
    it('2.4.1 poolIncrement cannot be a negative value', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 5,
          poolIncrement     : -1,
          poolTimeout       : 28,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');
          // NJS-007: invalid value for

          should.not.exist(pool);
          done();
        }
      );
    });

    it('2.4.2 poolIncrement must be a Number', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 10,
          poolIncrement     : false,
          poolTimeout       : 28,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');

          should.not.exist(pool);
          done();
        }
      );
    });

    it('2.4.3 the amount of open connections equals to poolMax when (connectionsOpen + poolIncrement) > poolMax', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 4,
          poolIncrement     : 2,
          poolTimeout       : 28,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.not.exist(err);
          pool.should.be.ok();

          pool.getConnection(function(err, conn1) {
            should.not.exist(err);
            conn1.should.be.ok();
            pool.connectionsOpen.should.be.exactly(1);
            pool.connectionsInUse.should.be.exactly(1);

            pool.getConnection(function(err, conn2) {
              should.not.exist(err);
              conn2.should.be.ok();

              pool.connectionsInUse.should.be.exactly(2);

              pool.getConnection(function(err, conn3) {
                should.not.exist(err);
                conn3.should.be.ok();
                pool.connectionsOpen.should.be.exactly(3);
                pool.connectionsInUse.should.be.exactly(3);

                // (connectionsOpen + poolIncrement) > poolMax
                pool.getConnection(function(err, conn4) {
                  should.not.exist(err);
                  conn4.should.be.ok();
                  pool.connectionsOpen.should.be.exactly(4);
                  pool.connectionsOpen.should.be.exactly(4);
                  conn4.release(function(err) {
                    should.not.exist(err);
                    conn3.release(function(err) {
                      should.not.exist(err);
                      conn2.release(function(err) {
                        should.not.exist(err);
                        conn1.release(function(err) {
                          should.not.exist(err);
                          pool.terminate(function(err) {
                            should.not.exist(err);
                            done();
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        }
      );
    });

  }); // 2.4

  describe('2.5 poolTimeout', function() {

    it('2.5.1 poolTimeout cannot be a negative number', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 5,
          poolIncrement     : 1,
          poolTimeout       : -5,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');
          // NJS-007: invalid value for

          should.not.exist(pool);
          done();
        }
      );
    });

    it('2.5.2 poolTimeout can be 0, which disables timeout feature', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 5,
          poolIncrement     : 1,
          poolTimeout       : 0,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.not.exist(err);
          pool.should.be.ok();

          pool.terminate(function(err) {
            should.not.exist(err);
            done();
          });
        }
      );
    });

    it('2.5.3 poolTimeout must be a number', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 5,
          poolIncrement     : 1,
          poolTimeout       : NaN,
          stmtCacheSize     : 23
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');
          // NJS-007: invalid value for

          should.not.exist(pool);
          done();
        }
      );
    });

  });

  describe('2.6 stmtCacheSize', function() {

    it('2.6.1 stmtCacheSize cannot be a negative value', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 5,
          poolIncrement     : 1,
          poolTimeout       : 28,
          stmtCacheSize     : -9
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');
          // NJS-007: invalid value for

          should.not.exist(pool);
          done();
        }
      );
    });

    it('2.6.2 stmtCacheSize can be 0', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 5,
          poolIncrement     : 1,
          poolTimeout       : 28,
          stmtCacheSize     : 0
        },
        function(err, pool) {
          should.not.exist(err);
          pool.should.be.ok();
          pool.terminate(function(err) {
            should.not.exist(err);
            done();
          });
        }
      );
    });

    it('2.6.3 stmtCacheSize must be a Number', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 5,
          poolIncrement     : 1,
          poolTimeout       : 28,
          stmtCacheSize     : NaN
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');
          // NJS-007: invalid value for

          should.not.exist(pool);
          done();
        }
      );
    });

  });

  describe('2.7 getConnection', function() {
    var pool1;

    beforeEach('get pool ready', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 2,
          poolIncrement     : 1,
          poolTimeout       : 1
        },
        function(err, pool) {
          should.not.exist(err);
          pool1 = pool;
          done();
        }
      );
    });

    it('2.7.1 passes error in callback if called after pool is terminated and a callback is provided', function(done) {
      pool1.terminate(function(err) {
        should.not.exist(err);

        pool1.getConnection(function(err, conn) {
          should.exist(err);
          (err.message).should.startWith('NJS-065:');
          // NJS-065: pool closed

          should.not.exist(conn);
          done();
        });
      });
    });

  });

  describe('2.8 connection request queue', function() {

    function getBlockingSql(secondsToBlock) {
      var blockingSql = '' +
        'declare \n' +
        ' \n' +
        '  l_start timestamp with local time zone := systimestamp; \n' +
        ' \n' +
        'begin \n' +
        ' \n' +
        '  loop \n' +
        '    exit when l_start + interval \'' + (secondsToBlock || 3) + '\' second <= systimestamp; \n' +
        '  end loop; \n' +
        ' \n' +
        'end;';

      return blockingSql;
    }

    it('2.8.1 basic case', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 0,
          poolMax           : 1,
          poolIncrement     : 1,
          poolTimeout       : 1
        },
        function(err, pool) {
          should.not.exist(err);

          async.parallel(
            [
              function(cb) {
                pool.getConnection(function(err, conn) {
                  should.not.exist(err);

                  conn.execute(getBlockingSql(3), function(err) {
                    should.not.exist(err);

                    conn.release(function(err) {
                      should.not.exist(err);
                      cb();
                    });
                  });
                });
              },
              function(cb) {
                //using setTimeout to help ensure this connection requests reaches DB later
                setTimeout(function() {
                  pool.getConnection(function(err, conn) {
                    should.not.exist(err);

                    conn.release(function(err) {
                      should.not.exist(err);

                      cb();
                    });
                  });
                }, 100);
              }
            ],
            function(err) {
              should.not.exist(err);
              pool.terminate(function(err) {
                should.not.exist(err);
                done();
              });
            }
          );
        }
      );
    });

    it('2.8.2 generates NJS-040 if request is queued and queueTimeout expires', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 0,
          poolMax           : 1,
          poolIncrement     : 1,
          poolTimeout       : 1,
          queueTimeout      : 2000 //2 seconds
        },
        function(err, pool) {
          should.not.exist(err);

          async.parallel(
            [
              function(cb) {
                pool.getConnection(function(err, conn) {
                  should.not.exist(err);

                  conn.execute(getBlockingSql(4), function(err) {
                    should.not.exist(err);

                    conn.release(function(err) {
                      should.not.exist(err);
                      cb();
                    });
                  });
                });
              },
              function(cb) {
                //using setTimeout to help ensure this gets to the db last
                setTimeout(function() {
                  pool.getConnection(function(err, conn) {
                    should.exist(err);
                    (err.message.startsWith("NJS-040:")).should.be.true();

                    should.not.exist(conn);
                    cb();
                  });
                }, 100);
              }
            ],
            function(err) {
              should.not.exist(err);
              pool.terminate(function(err) {
                should.not.exist(err);
                done();
              });
            }
          );
        }
      );
    });

    it('2.8.3 does not generate NJS-040 if request is queued for less time than queueTimeout', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 0,
          poolMax           : 1,
          poolIncrement     : 1,
          poolTimeout       : 1,
          queueTimeout      : 10000 //10 seconds
        },
        function(err, pool) {
          should.not.exist(err);

          async.parallel(
            [
              function(cb) {
                pool.getConnection(function(err, conn) {
                  should.not.exist(err);

                  conn.execute(getBlockingSql(4), function(err) {
                    should.not.exist(err);

                    conn.release(function(err) {
                      should.not.exist(err);
                      cb();
                    });
                  });
                });
              },
              function(cb) {
                //using setTimeout to help ensure this gets to the db last
                setTimeout(function() {
                  pool.getConnection(function(err, conn) {
                    should.not.exist(err);

                    conn.release(function(err) {
                      should.not.exist(err);
                      cb();
                    });
                  });
                }, 100);
              }
            ],
            function(err) {
              should.not.exist(err);
              pool.terminate(function(err) {
                should.not.exist(err);
                done();
              });
            }
          );
        }
      );
    });

    it('2.8.4 generates NJS-076 if request exceeds queueMax', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 1,
          poolIncrement     : 0,
          queueTimeout      : 5000, // 5 seconds
          queueMax          : 1
        },
        function(err, pool) {
          should.not.exist(err);

          async.parallel(
            [
              function(cb) {
                pool.getConnection(function(err, conn1) {
                  should.not.exist(err);

                  pool.getConnection(function(err, conn2) {  // queued until timeout
                    (err.message.startsWith("NJS-040:")).should.be.true();
                    should.not.exist(conn2);
                    conn1.close(function(err) {
                      should.not.exist(err);
                      cb();
                    });
                  });
                });
              },
              function(cb) {
                //using setTimeout to help ensure this gets to the db last
                setTimeout(function() {
                  pool.getConnection(function(err, conn) {
                    should.exist(err);
                    (err.message.startsWith("NJS-076:")).should.be.true();
                    should.not.exist(conn);
                    cb();
                  });
                }, 100);
              }
            ],
            function(err) {
              should.not.exist(err);
              pool.close(function(err) {
                should.not.exist(err);
                done();
              });
            }
          );
        }
      );
    });

    it('2.8.5 generates NJS-076 if request exceeds queueMax 0', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 1,
          poolMax           : 1,
          poolIncrement     : 0,
          queueTimeout      : 5000, // 5 seconds
          queueMax          : 0
        },
        function(err, pool) {
          should.not.exist(err);

          pool.getConnection(function(err, conn1) {
            should.not.exist(err);
            pool.getConnection(function(err, conn) {
              should.exist(err);
              (err.message.startsWith("NJS-076:")).should.be.true();
              should.not.exist(conn);
              conn1.close(function(err) {
                should.not.exist(err);

                pool.close(function(err) {
                  should.not.exist(err);
                  done();
                });
              });
            });
          });
        });
    });

    it('2.8.6 request queue never terminate for queueTimeout set to 0', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 0,
          poolMax           : 1,
          poolIncrement     : 1,
          poolTimeout       : 1,
          queueTimeout      : 0 // 0 seconds
        },
        function(err, pool) {
          should.not.exist(err);

          async.parallel(
            [
              function(cb) {
                pool.getConnection(function(err, conn) {
                  should.not.exist(err);

                  conn.execute(getBlockingSql(10), function(err) { // This will block for 10 sec
                    should.not.exist(err);

                    conn.release(function(err) {
                      should.not.exist(err);
                      cb();
                    });
                  });
                });
              },
              function(cb) {
                // using setTimeout to help ensure this gets to the db last
                setTimeout(function() {
                // queueTimeout is set to 0, but even after waiting for 10 sec
                // or more in queue, it should get a connection
                  pool.getConnection(function(err, conn) {
                    should.not.exist(err);
                    should.exist(conn);
                    conn.release(function(err) {
                      should.not.exist(err);

                      cb();
                    });
                  });
                }, 100);
              }
            ],
            function(err) {
              should.not.exist(err);
              pool.close(function(err) {
                should.not.exist(err);
                done();
              });
            }
          );
        }
      );
    });

  });

  describe('2.9 _enableStats & _logStats functionality', function() {
    it('2.9.1 does not work after the pool has been terminated', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 0,
          poolMax           : 1,
          poolIncrement     : 1,
          poolTimeout       : 1,
          _enableStats      : true
        },
        function(err, pool) {
          should.not.exist(err);

          pool.getConnection(function(err, conn) {
            should.not.exist(err);

            conn.execute('select 1 from dual', function(err) {
              should.not.exist(err);

              conn.release(function(err) {
                should.not.exist(err);

                pool.terminate(function(err) {
                  should.not.exist(err);

                  try {
                    pool._logStats();
                  } catch (err) {
                    should.exist(err);
                    (err.message).should.startWith("NJS-065:"); // NJS-065: pool closed
                  }

                  done();
                });
              });
            });
          });
        }
      );
    });
  });

  describe('2.10 Close method', function() {
    it('2.10.1 close can be used as an alternative to release', function(done) {
      oracledb.createPool(
        {
          user              : dbConfig.user,
          password          : dbConfig.password,
          connectString     : dbConfig.connectString,
          poolMin           : 0,
          poolMax           : 1,
          poolIncrement     : 1,
          poolTimeout       : 1
        },
        function(err, pool) {
          should.not.exist(err);

          pool.close(function(err) {
            should.not.exist(err);

            done();
          });
        }
      );
    });
  }); // 2.10

  describe('2.11 Invalid Credential', function() {

    it('2.11.1 error occurs at creating pool when poolMin >= 1', function(done) {
      oracledb.createPool(
        {
          user: 'notexist',
          password: 'nopass',
          connectString: dbConfig.connectString,
          poolMin: 5
        },
        function(err, pool) {
          should.exist(err);
          (err.message).should.startWith('ORA-24413: ');
          // ORA-24413: Invalid number of sessions specified
          should.not.exist(pool);
          done();
        }
      );
    }); // 2.11.1

    it('2.11.2 error occurs at getConnection() when poolMin is the default value 0', function(done) {
      oracledb.createPool(
        {
          user: 'notexist',
          password: 'nopass',
          connectString: dbConfig.connectString
        },
        function(err, pool) {
          should.exist(pool);
          pool.getConnection(function(err, conn) {
            should.exist(err);
            (err.message).should.startWith('ORA-01017: ');
            // ORA-01017: invalid username/password; logon denied
            should.not.exist(conn);

            pool.close(function(err) {
              should.not.exist(err);
              done();
            });

          });
        }
      );
    }); // 2.11.2

  }); // 2.11

  describe('2.12 connectionString alias', function() {
    it('2.12.1 allows connectionString to be used as an alias for connectString', function(done) {
      oracledb.createPool(
        {
          user: dbConfig.user,
          password: dbConfig.password,
          connectionString: dbConfig.connectString,
          poolMin: 1,
          poolMax: 1,
          poolIncrement: 0
        },
        function(err, pool) {
          should.not.exist(err);

          pool.should.be.ok();

          pool.close(function(err) {
            should.not.exist(err);

            done();
          });
        }
      );
    });

  }); // 2.12

  describe('2.13 connectString & connectionString provided', function() {
    it('2.13.1 both connectString & connectionString provided',
      function(done) {
        oracledb.createPool(
          {
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString,
            connectionString: dbConfig.connectString,
            poolMin: 1,
            poolMax: 1,
            poolIncrement: 0
          },
          function(err, pool) {
            should.not.exist(pool);
            should.exist(err);
            (err.message).should.startWith('NJS-075');
            done();
          }
        );
      }
    );  // 2.13.1
  });  // 2.13.1

  describe('2.14 username alias', function() {
    it('2.14.1 allows username to be used as an alias for user', function(done) {
      oracledb.createPool(
        {
          username: dbConfig.user,
          password: dbConfig.password,
          connectString: dbConfig.connectString,
          poolMin: 1,
          poolMax: 1,
          poolIncrement: 0
        },
        function(err, pool) {
          should.not.exist(err);

          pool.should.be.ok();

          pool.close(function(err) {
            should.not.exist(err);

            done();
          });
        }
      );
    }); // 2.14.1
    it('2.14.2 both user and username specified',
      function(done) {
        oracledb.createPool(
          {
            user: dbConfig.user,
            username: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString,
            poolMin: 1,
            poolMax: 1,
            poolIncrement: 0
          },
          function(err, pool) {
            should.not.exist(pool);
            should.exist(err);
            (err.message).should.startWith('NJS-080');
            done();
          }
        );
      }
    ); // 2.14.2
    it('2.14.3 uses username alias to login with SYSDBA privilege',
      function(done) {
        if (!dbConfig.test.DBA_PRIVILEGE) this.skip();
        oracledb.createPool(
          {
            username: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString,
            privilege : oracledb.SYSDBA,
            poolMin: 1,
            poolMax: 1,
            poolIncrement: 0
          },
          function(err, pool) {
            should.exist(pool);
            should.not.exist(err);
            pool.close(function(err) {
              should.not.exist(err);
              done();
            });
          }
        );
      }
    ); // 2.14.3

  }); // 2.14

});
