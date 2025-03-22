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
 * distributed under the License is distributed on an "AS IS" BASIS, withOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * The node-oracledb test suite uses 'mocha', 'should' and 'async'.
 * See LICENSE.md for relevant licenses.
 *
 * NAME
 *   255. poolReconfig.js
 *
 * DESCRIPTION
 *   Test cases to pool-reconfigure
 *
 *****************************************************************************/
'use strict';

const oracledb  = require('oracledb');
const should    = require('should');
const assert    = require('assert');
const dbConfig  = require('./dbconfig.js');
const testsUtil = require('./testsUtil.js');

describe('255. poolReconfigure.js', function() {

  let poolMinOriginalVal = 2;
  let poolMaxOriginalVal = 10;
  let poolIncrementOriginalVal = 2;
  let enableStatisticsOriginalVal = false;

  let poolConfig = {
    user             : dbConfig.user,
    password         : dbConfig.password,
    connectionString : dbConfig.connectString,
    poolMin          : poolMinOriginalVal,
    poolMax          : poolMaxOriginalVal,
    poolIncrement    : poolIncrementOriginalVal,
    enableStatistics : enableStatisticsOriginalVal
  };

  if (dbConfig.test.externalAuth) {
    poolConfig = {
      externalAuth     :  true,
      connectionString : dbConfig.connectString,
      poolMin          : poolMinOriginalVal,
      poolMax          : poolMaxOriginalVal,
      poolIncrement    : poolIncrementOriginalVal,
      enableStatistics : enableStatisticsOriginalVal
    };
  }

  function checkOriginalPoolConfig(pool) {
    should.strictEqual(pool.poolMin, poolMinOriginalVal);
    should.strictEqual(pool.poolMax, poolMaxOriginalVal);
    should.strictEqual(pool.poolIncrement, poolIncrementOriginalVal);
    should.strictEqual(pool.enableStatistics, enableStatisticsOriginalVal);
  }

  describe('255.1 poolReconfigure - poolMin/poolMax/poolIncrement properties', function() {
    let pool;

    beforeEach(async function() {
      pool = await oracledb.createPool(poolConfig);
      checkOriginalPoolConfig(pool);
    });

    afterEach(async function() {
      await pool.close(0);
    });

    it('255.1.1 Change poolMin - increase', async function() {
      let conn1 = await testsUtil.getPoolConnection(pool);
      let conn2 = await testsUtil.getPoolConnection(pool);
      should.strictEqual(pool.connectionsInUse, 2);
      if (dbConfig.test.externalAuth) {
        should.strictEqual(pool.connectionsOpen, 2);
      } else {
        should.strictEqual(pool.connectionsOpen, poolMinOriginalVal);
      }

      let poolMin = pool.poolMin * 2;
      let config = {
        poolMin : poolMin
      };
      await pool.reconfigure(config);
      should.strictEqual(pool.poolMin, poolMin);
      should.strictEqual(pool.poolMax, poolMaxOriginalVal);
      should.strictEqual(pool.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(pool.connectionsInUse, 2);

      await conn1.close();
      await conn2.close();

      let conn3 = await testsUtil.getPoolConnection(pool);
      should.strictEqual(pool.connectionsInUse, 1);
      await conn3.close();
    });

    it('255.1.2 Change poolMin - decrease', async function() {
      let conn = await testsUtil.getPoolConnection(pool);
      should.strictEqual(pool.connectionsInUse, 1);
      if (dbConfig.test.externalAuth) {
        should.strictEqual(pool.connectionsOpen, 1);
      } else {
        should.strictEqual(pool.connectionsOpen, poolMinOriginalVal);
      }

      let poolMin = Math.floor(pool.poolMin / 2);
      let config = {
        poolMin : poolMin
      };

      await pool.reconfigure (config);
      should.strictEqual(pool.poolMin, poolMin);
      should.strictEqual(pool.poolMax, poolMaxOriginalVal);
      should.strictEqual(pool.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(pool.connectionsInUse, 1);

      await conn.close();
    });

    it('255.1.3 Change poolMax - increase', async function() {
      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }

      should.strictEqual(pool.connectionsInUse, poolMaxOriginalVal);
      should.strictEqual(pool.connectionsOpen, poolMaxOriginalVal);

      let poolMax = pool.poolMax * 2;
      let config = {
        poolMax : poolMax
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolMin, poolMinOriginalVal);
      should.strictEqual(pool.poolIncrement, poolIncrementOriginalVal);

      let connNew = await testsUtil.getPoolConnection(pool);
      should.strictEqual(pool.connectionsInUse, poolMaxOriginalVal + 1);
      if (dbConfig.test.externalAuth) {
        should.strictEqual(pool.connectionsOpen, poolMaxOriginalVal + 1);
      } else {
        should.strictEqual(pool.connectionsOpen, poolMaxOriginalVal + poolIncrementOriginalVal);
      }

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }
      await connNew.close();

    });


    it('255.1.4 Change poolMax - decrease', async function() {
      let conn = await testsUtil.getPoolConnection(pool);
      should.strictEqual(pool.connectionsInUse, 1);
      if (dbConfig.test.externalAuth) {
        should.strictEqual(pool.connectionsOpen, 1);
      } else {
        should.strictEqual(pool.connectionsOpen, poolMinOriginalVal);
      }

      let poolMax = Math.floor (pool.poolMax / 2);
      let config = {
        poolMax : poolMax
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolMin, poolMinOriginalVal);
      should.strictEqual(pool.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(pool.connectionsInUse, 1);
      if (dbConfig.test.externalAuth) {
        should.strictEqual(pool.connectionsOpen, 1);
      } else {
        should.strictEqual(pool.connectionsOpen, poolMinOriginalVal);
      }

      await conn.close();
    });

    it('255.1.5 Change poolIncrement - increase', async function() {
      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMinOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }
      should.strictEqual(pool.connectionsInUse, poolMinOriginalVal);
      should.strictEqual(pool.connectionsOpen, poolMinOriginalVal);

      let poolIncrement = pool.poolIncrement * 2;
      let config = {
        poolIncrement : poolIncrement
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolIncrement, poolIncrement);
      should.strictEqual(pool.poolMin, poolMinOriginalVal);
      should.strictEqual(pool.poolMax, poolMaxOriginalVal);

      let connNew = await testsUtil.getPoolConnection(pool);
      should.strictEqual(pool.connectionsInUse, poolMinOriginalVal + 1);
      if (dbConfig.test.externalAuth) {
        should.strictEqual(pool.connectionsOpen, poolMinOriginalVal + 1);
      } else {
        should.strictEqual(pool.connectionsOpen, poolMinOriginalVal + poolIncrement);
      }

      for (conIndex = 0; conIndex < poolMinOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }
      await connNew.close();
    });


    it('255.1.6 Change poolIncrement - decrease', async function() {
      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMinOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }
      should.strictEqual(pool.connectionsInUse, poolMinOriginalVal);
      should.strictEqual(pool.connectionsOpen, poolMinOriginalVal);

      let poolIncrement = Math.floor(pool.poolIncrement / 2);
      let config = {
        poolIncrement : poolIncrement
      };
      await pool.reconfigure(config);
      should.strictEqual(pool.poolIncrement, poolIncrement);
      should.strictEqual(pool.poolMin, poolMinOriginalVal);
      should.strictEqual(pool.poolMax, poolMaxOriginalVal);

      let connNew = await testsUtil.getPoolConnection(pool);
      should.strictEqual(pool.connectionsInUse, poolMinOriginalVal + 1);
      if (dbConfig.test.externalAuth) {
        should.strictEqual(pool.connectionsOpen, poolMinOriginalVal + 1);
      } else {
        should.strictEqual(pool.connectionsOpen, poolMinOriginalVal + poolIncrement);
      }

      for (conIndex = 0; conIndex < poolMinOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }

      await connNew.close();
    });

    it('255.1.7 increase poolMin & poolMax', async function() {
      let poolMin = 2 * pool.poolMin;
      let poolMax = 2 * pool.poolMax;
      let config =  {
        poolMin : poolMin,
        poolMax : poolMax
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolMin, poolMin);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolIncrement, poolIncrementOriginalVal);
    });

    it('255.1.8 increase poolMin & poolIncrement', async function() {
      let poolMin = 2 * pool.poolMin;
      let poolIncrement = 2 * pool.poolIncrement;
      let config =  {
        poolMin       : poolMin,
        poolIncrement : poolIncrement
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolMin, poolMin);
      should.strictEqual(pool.poolIncrement, poolIncrement);
      should.strictEqual(pool.poolMax, poolMaxOriginalVal);
    });

    it('255.1.9 increase poolMax & poolIncrement', async function() {
      let poolMax = 2 * pool.poolMax;
      let poolIncrement = 2 * pool.poolIncrement;
      let config =  {
        poolMax       : poolMax,
        poolIncrement : poolIncrement
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolIncrement, poolIncrement);
      should.strictEqual(pool.poolMin, poolMinOriginalVal);
    });


    it('255.1.10 increase poolMin/poolMax/poolIncrement', async function() {
      let poolMin = 2 * pool.poolMin;
      let poolMax = 2 * pool.poolMax;
      let poolIncrement = 2 * pool.poolIncrement;
      let config =  {
        poolMin       : poolMin,
        poolMax       : poolMax,
        poolIncrement : poolIncrement
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolMin, poolMin);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolIncrement, poolIncrement);
    });

    it('255.1.11 Change enableStatistics to true', async function() {
      let config = {
        enableStatistics  : true
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.enableStatistics, true);
      should.strictEqual(pool.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(pool.poolMin, poolMinOriginalVal);
      should.strictEqual(pool.poolMax, poolMaxOriginalVal);
    });

    it('255.1.12 Change enableStatistics to false', async function() {
      let config = {
        enableStatistics  : false
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.enableStatistics, false);
      should.strictEqual(pool.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(pool.poolMin, poolMinOriginalVal);
      should.strictEqual(pool.poolMax, poolMaxOriginalVal);
    });

    it('255.1.13 Decreasing poolMax when all connection are in use', async function() {
      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }

      should.strictEqual(pool.connectionsInUse, poolMaxOriginalVal);
      should.strictEqual(pool.connectionsOpen, poolMaxOriginalVal);

      let poolMax = Math.floor (pool.poolMax / 2);
      let config = {
        poolMax : poolMax
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolMin, poolMinOriginalVal);
      should.strictEqual(pool.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(pool.connectionsInUse, poolMaxOriginalVal);
      should.strictEqual(pool.connectionsOpen, poolMaxOriginalVal);

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }
    });

    it('255.1.14 reconfigure poolMin/poolMax/poolIncrement multiple times', async function() {
      let poolMin = 2 * pool.poolMin;
      let poolMax = 2 * pool.poolMax;
      let poolIncrement = 2 * pool.poolIncrement;
      let config =  {
        poolMin       : poolMin,
        poolMax       : poolMax,
        poolIncrement : poolIncrement
      };

      await pool.reconfigure(config);
      await pool.reconfigure(config);
      should.strictEqual(pool.poolMin, poolMin);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolIncrement, poolIncrement);

      await pool.reconfigure(config);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      should.strictEqual(pool.poolMin, poolMin);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolIncrement, poolIncrement);

    });

    it('255.1.15 reconfigure poolMin/poolMax/poolIncrement multiple times', async function() {
      let poolMin = 2 * pool.poolMin;
      let poolMax = 2 * pool.poolMax;
      let poolIncrement = 2 * pool.poolIncrement;
      let config =  {
        poolMin       : poolMin,
        poolMax       : poolMax,
        poolIncrement : poolIncrement
      };
      await pool.reconfigure(config);

      poolMin = pool.poolMin - 1;
      poolMax = 3 * pool.poolMax;
      poolIncrement = 3 * pool.poolIncrement;
      config =  {
        poolMin       : poolMin,
        poolMax       : poolMax,
        poolIncrement : poolIncrement
      };
      await pool.reconfigure(config);
      should.strictEqual(pool.poolMin, poolMin);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolIncrement, poolIncrement);

      poolMin = 1;
      poolMax = 3;
      poolIncrement = 1;
      config =  {
        poolMin       : poolMin,
        poolMax       : poolMax,
        poolIncrement : poolIncrement
      };
      await pool.reconfigure(config);
      should.strictEqual(pool.poolMin, poolMin);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolIncrement, poolIncrement);
    });

    it('255.1.16 Connection queuing after decreasing poolMax', async function() {
      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }

      let poolMax = poolMaxOriginalVal - 2;
      let config = {
        poolMax : poolMax
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolMin, poolMinOriginalVal);
      should.strictEqual(pool.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(pool.connectionsInUse, poolMaxOriginalVal);

      // Execute a query using the existing connections
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        await conns[conIndex].execute(`select user from dual`);
      }

      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      // release two connections
      await conns[poolMaxOriginalVal - 1].close();
      await conns[poolMaxOriginalVal - 2].close();
      // Get a new connection
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      // release a third connection
      await conns[poolMaxOriginalVal - 3].close();
      // Get a new connection
      conns[poolMaxOriginalVal - 3] = await testsUtil.getPoolConnection(pool);
      // Get a new connection
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      for (conIndex = 0; conIndex < poolMax; conIndex++) {
        await conns[conIndex].close();
      }

    });

    it('255.1.17 Connection queuing after increasing poolMax', async function() {
      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }

      should.strictEqual(pool.connectionsInUse, poolMaxOriginalVal);
      should.strictEqual(pool.connectionsOpen, poolMaxOriginalVal);

      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      let poolMax = pool.poolMax + 10;
      let config = {
        poolMax : poolMax
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolMin, poolMinOriginalVal);
      should.strictEqual(pool.poolIncrement, poolIncrementOriginalVal);

      for (conIndex = poolMaxOriginalVal; conIndex < poolMax; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }

      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      for (conIndex = 0; conIndex < poolMax; conIndex++) {
        // Execute a query using the existing connections
        await conns[conIndex].execute(`select user from dual`);
        await conns[conIndex].close();
      }
    });

  });

  // Other properties: pingInterval/Timeout/maxPerShard/stmtCacheSize/
  //  resetStatistics/queueMax/queueTimeout/maxSessionsPerShard/
  //  sodaMetaDataCache
  describe('255.2 poolReconfigure - other properties', function() {
    let pool;

    poolConfig = {
      user             : dbConfig.user,
      password         : dbConfig.password,
      connectionString : dbConfig.connectString,
      poolMin          : poolMinOriginalVal,
      poolMax          : poolMaxOriginalVal,
      poolIncrement    : poolIncrementOriginalVal,
      enableStatistics : enableStatisticsOriginalVal,
      queueTimeout     : 5
    };

    if (dbConfig.test.externalAuth) {
      poolConfig = {
        externalAuth     :  true,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        enableStatistics : enableStatisticsOriginalVal,
        queueTimeout     : 5
      };
    }

    beforeEach(async function() {
      pool = await oracledb.createPool(poolConfig);
      checkOriginalPoolConfig(pool);
    });

    afterEach(async function() {
      await pool.close(0);
    });

    it('255.2.1 change poolPingInterval', async function() {
      let poolPingInterval = 2 * pool.poolPingInterval;
      let config = {
        poolPingInterval : poolPingInterval
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolPingInterval, poolPingInterval);
      checkOriginalPoolConfig(pool);
    });

    it('255.2.2 change poolTimeout', async function() {
      let poolTimeout = 2 * pool.poolTimeout;
      let config = {
        poolTimeout : poolTimeout
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolTimeout, poolTimeout);
      checkOriginalPoolConfig(pool);
    });

    it('255.2.3 change maxPerShard', async function() {
      let poolMaxPerShard = 2 * pool.poolMaxPerShard;
      let config = {
        poolMaxPerShard : poolMaxPerShard
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolMaxPerShard, poolMaxPerShard);
      checkOriginalPoolConfig(pool);
    });

    it('255.2.4 change stmtCacheSize', async function() {
      let stmtCacheSize = 2 * pool.stmtCacheSize;
      let config = {
        stmtCacheSize : stmtCacheSize
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.stmtCacheSize, stmtCacheSize);
      checkOriginalPoolConfig(pool);
    });

    it('255.2.5 change resetStatistics with enableStatistics', async function() {
      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      let totalConnectionRequestsOriginalVal = pool._totalConnectionRequests;
      let totalRequestsDequeuedOriginalVal = pool._totalConnectionRequests;
      let totalRequestsEnqueuedOriginalVal = pool._totalRequestsEnqueued;
      let totalFailedRequestsOriginalVal = pool._totalFailedRequests;
      let totalRequestsRejectedOriginalVal = pool._totalRequestsRejected;
      let timeOfLastResetOriginalVal = pool._timeOfReset;
      should.strictEqual(totalConnectionRequestsOriginalVal, 0);
      should.strictEqual(totalRequestsDequeuedOriginalVal, 0);
      should.strictEqual(totalRequestsEnqueuedOriginalVal, 0);
      should.strictEqual(totalFailedRequestsOriginalVal, 0);
      should.strictEqual(totalRequestsRejectedOriginalVal, 0);

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }

      let config = {
        resetStatistics : true,
        enableStatistics : true
      };
      await pool.reconfigure(config);

      conns = new Array();
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      should.strictEqual(pool._totalConnectionRequests, poolMaxOriginalVal + 1);
      should.strictEqual(pool._totalRequestsDequeued, 0);
      should.strictEqual(pool._totalRequestsEnqueued, 1);
      should.strictEqual(pool._totalFailedRequests, 0);
      should.strictEqual(pool._totalRequestsRejected, 0);
      (pool._timeOfReset).should.above(timeOfLastResetOriginalVal);

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }

    });

    it('255.2.6 change resetStatistics', async function() {
      let config = {
        resetStatistics : true
      };
      await pool.reconfigure(config);
      should.strictEqual(pool.enableStatistics, enableStatisticsOriginalVal);
    });

    it('255.2.7 getStatistics', async function() {
      await pool.close(0);

      poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        enableStatistics : enableStatisticsOriginalVal,
        queueTimeout     : 5,
        poolAlias        : "255.2.7"
      };
      pool = await oracledb.createPool(poolConfig);

      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      let poolStatistics = await pool.getStatistics();
      should.strictEqual(poolStatistics, null);
      let timeOfLastResetOriginalVal = pool._timeOfReset;

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }

      let config = {
        resetStatistics : true,
        enableStatistics : true
      };
      await pool.reconfigure(config);

      conns = new Array();
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      poolStatistics = await pool.getStatistics();

      (poolStatistics.upTime).should.above(0);
      (poolStatistics.upTimeSinceReset).should.above(0);
      (pool._timeOfReset).should.above(timeOfLastResetOriginalVal);
      should.strictEqual(poolStatistics.connectionRequests, poolMaxOriginalVal + 1);
      should.strictEqual(poolStatistics.requestsEnqueued, 1);
      should.strictEqual(poolStatistics.requestsDequeued, 0);
      should.strictEqual(poolStatistics.failedRequests, 0);
      should.strictEqual(poolStatistics.rejectedRequests, 0);
      should.strictEqual(poolStatistics.requestTimeouts, 1);
      should.strictEqual(poolStatistics.currentQueueLength, 0);
      should.strictEqual(poolStatistics.maximumQueueLength, 1);
      (poolStatistics.minimumTimeInQueue).should.above(0);
      (poolStatistics.maximumTimeInQueue).should.above(0);
      (poolStatistics.timeInQueue).should.aboveOrEqual(5);
      (poolStatistics.averageTimeInQueue).should.aboveOrEqual(5);
      should.strictEqual(poolStatistics.connectionsInUse, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.connectionsOpen, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolAlias, "255.2.7");
      should.strictEqual(poolStatistics.queueMax, 500);
      should.strictEqual(poolStatistics.queueTimeout, 5);
      should.strictEqual(poolStatistics.poolMin, poolMinOriginalVal);
      should.strictEqual(poolStatistics.poolMax, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(poolStatistics.poolPingInterval, 60);
      should.strictEqual(poolStatistics.poolTimeout, 60);
      should.strictEqual(poolStatistics.poolMaxPerShard, 0);
      should.strictEqual(poolStatistics.sessionCallback, undefined);
      should.strictEqual(poolStatistics.stmtCacheSize, 30);
      should.strictEqual(poolStatistics.sodaMetaDataCache, false);
      should.strictEqual(poolStatistics.threadPoolSize, undefined);

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }

    });

  });

  describe('255.3 poolReconfigure JS layer properties', function() {
    let pool;

    beforeEach(async function() {
      pool = await oracledb.createPool(poolConfig);
      checkOriginalPoolConfig(pool);
    });

    afterEach(async function() {
      await pool.close(0);
    });

    it('255.3.1 change queueMax', async function() {
      let queueMax = pool.queueMax + 10;
      let config = {
        queueMax : queueMax
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.queueMax, queueMax);
      checkOriginalPoolConfig(pool);
    });

    it('255.3.2 change queueTimeout', async function() {
      let queueTimeout = pool.queueTimeout + 10;
      let config = {
        queueTimeout : queueTimeout
      };

      await pool.reconfigure(config);

      should.strictEqual(pool.queueTimeout, queueTimeout);
      checkOriginalPoolConfig(pool);
    });

    it('255.3.3 change maxPerShard', async function() {
      // maxPerShard is supported only >= 18.3
      if (oracledb.oracleClientVersion < 1803000000) {
        this.skip();
        return;
      }

      let maxPerShard = 10;
      let config = {
        poolMaxPerShard : maxPerShard
      };

      await pool.reconfigure(config);
      should.strictEqual(pool.poolMaxPerShard, maxPerShard);
      checkOriginalPoolConfig(pool);
    });

    it('255.3.4 sodaMetaDataCache set to true', async function() {
      let config = {
        sodaMetaDataCache : true
      };
      // The SODA metadata cache is available with Oracle Client 21.3 and
      // in 19 from 19.11
      if (oracledb.oracleClientVersion < 2103000000) {
        if (oracledb.oracleClientVersion < 1911000000 ||
            oracledb.oracleClientVersion >= 2000000000) {
          this.skip();
          return;
        }
      }
      await pool.reconfigure(config);
      should.strictEqual(pool.sodaMetaDataCache, config.sodaMetaDataCache);
    });

    it('255.3.5 sodaMetaDataCache set to false', async function() {
      let config = {
        sodaMetaDataCache : false
      };
      // The SODA metadata cache is available with Oracle Client 21.3 and
      // in 19 from 19.11
      if (oracledb.oracleClientVersion < 2103000000) {
        if (oracledb.oracleClientVersion < 1911000000 ||
            oracledb.oracleClientVersion >= 2000000000) {
          this.skip();
          return;
        }
      }
      await pool.reconfigure(config);
      should.strictEqual(pool.sodaMetaDataCache, config.sodaMetaDataCache);
      checkOriginalPoolConfig(pool);
    });

  });

  describe('255.4 Pool properties NOT dynamically configurable, they will be ignored', function() {
    let pool;

    beforeEach(async function() {
      pool = await oracledb.createPool(poolConfig);
      checkOriginalPoolConfig(pool);
    });

    afterEach(async function() {
      await pool.close(0);
    });

    it('255.4.1 connectionsInUse', async function() {
      let conn = await testsUtil.getPoolConnection(pool);
      await pool.reconfigure({connectionsInUse: 3});
      should.strictEqual(pool.connectionsInUse, 1);
      await conn.close();
      should.strictEqual(pool.connectionsInUse, 0);
    });

    it('255.4.2 connectionsOpen', async function() {
      if (dbConfig.test.externalAuth) {
        should.strictEqual(pool.connectionsOpen, 0);
      } else {
        should.strictEqual(pool.connectionsOpen, poolMinOriginalVal);
      }

      await pool.reconfigure({connectionsOpen: 2});

      if (dbConfig.test.externalAuth) {
        should.strictEqual(pool.connectionsOpen, 0);
      } else {
        should.strictEqual(pool.connectionsOpen, poolMinOriginalVal);
      }

    });

    it('255.4.3 connectString', async function() {
      await pool.reconfigure({connectString: 'invalid_connection_string'});
      let conn = await testsUtil.getPoolConnection(pool);
      should.exist(conn);
      await conn.close();
    });

    it('255.4.4 connectionString', async function() {
      await pool.reconfigure({connectionString: 'invalid_connection_string'});
      let conn = await testsUtil.getPoolConnection(pool);
      should.exist(conn);
      await conn.close();
    });

    it('255.4.5 edition', async function() {
      let editionBak = oracledb.edition;
      await pool.reconfigure({edition: 'e2'});
      should.strictEqual(oracledb.edition, editionBak);
    });

    it('255.4.6 events', async function() {
      let eventsBak = oracledb.events;
      await pool.reconfigure({events: true});
      should.strictEqual(oracledb.events, eventsBak);
    });

    it('255.4.7 homogeneous', async function() {
      let homogeneousBak = pool.homogeneousl;
      await pool.reconfigure ({homogeneous: false});
      should.strictEqual(pool.homogeneous, homogeneousBak);
    });

    it('255.4.8 externalAuth', async function() {
      let externalAuthBak = oracledb.externalAuth;
      await pool.reconfigure({externalAuth: true});
      should.strictEqual(oracledb.externalAuth, externalAuthBak);
    });

    it('255.4.9 password', async function() {
      await pool.reconfigure({password: 'testing'});
      should.strictEqual(oracledb.password, undefined);
    });

    it('255.4.10 poolAlias', async function() {
      let poolAliasBak = pool.poolAlias;
      await pool.reconfigure({poolAlias: 'poolalias1'});
      should.strictEqual(pool.poolAlias, poolAliasBak);
    });

    it('255.4.11 status', async function() {
      let statusBak = pool.status;
      await pool.reconfigure({status: oracledb.POOL_STATUS_DRAINING});
      should.strictEqual(pool.status, statusBak);
    });

    it('255.4.12 username', async function() {
      await pool.reconfigure({username: 'testinguser'});
      should.strictEqual(pool.username, undefined);
    });

    it('255.4.13 user', async function() {
      await pool.reconfigure({user: 'testinguser'});
      should.strictEqual(pool.user, undefined);
    });

    it('255.4.14 _enableStats', async function() {
      await pool.close(0);

      let config =  {
        user              : dbConfig.user,
        password          : dbConfig.password,
        connectionString  : dbConfig.connectString
      };

      pool = await oracledb.createPool(config);

      let config1 = {
        resetStatistics : true,
        _enableStats    : true
      };
      await pool.reconfigure(config1);
      let poolStatistics1 = await pool.getStatistics();
      should.strictEqual(pool._enableStats, false);
      should.strictEqual(pool.enableStatistics, false);
      should.strictEqual(poolStatistics1, null);

      let config2 = {
        _enableStats : true
      };
      await pool.reconfigure(config2);
      let poolStatistics2 = await pool.getStatistics();
      should.strictEqual(pool._enableStats, false);
      should.strictEqual(pool.enableStatistics, false);
      should.strictEqual(poolStatistics2, null);

      let config3 = {
        resetStatistics : false,
        _enableStats    : true
      };
      await pool.reconfigure(config3);
      let poolStatistics3 = await pool.getStatistics();
      should.strictEqual(pool._enableStats, false);
      should.strictEqual(pool.enableStatistics, false);
      should.strictEqual(poolStatistics3, null);

    });

  });

  describe('255.5 Negative cases', function() {
    let pool;
    let poolMin = 2;
    let poolMax = 50;
    let poolIncrement = 2;
    let enableStatistics = true;
    let poolPingInterval = 10;
    let poolTimeout = 20;
    let poolMaxPerShard = 2;
    let queueMax = 10;
    let queueTimeout = 5;
    let stmtCacheSize = 10;
    let sodaMetaDataCache = true;
    let resetStatistics = true;

    let config =  {
      poolMin           : poolMin,
      poolMax           : poolMax,
      poolIncrement     : poolIncrement,
      enableStatistics  : enableStatistics,
      poolPingInterval  : poolPingInterval,
      poolTimeout       : poolTimeout,
      poolMaxPerShard   : poolMaxPerShard,
      queueMax          : queueMax,
      queueTimeout      : queueTimeout,
      stmtCacheSize     : stmtCacheSize,
      sodaMetaDataCache : sodaMetaDataCache,
      resetStatistics   : resetStatistics
    };

    beforeEach(async function() {
      pool = await oracledb.createPool(poolConfig);
      checkOriginalPoolConfig(pool);
    });

    afterEach(async function() {
      await pool.close(0);
    });

    it('255.5.1 passing empty config to pool.reconfigure', async function() {
      let config = {};

      await pool.reconfigure(config);
      checkOriginalPoolConfig(pool);
    });

    it('255.5.2 passing invalid poolMin to pool.reconfigure', async function() {
      try {
        await assert.rejects(
          async function() {
            await pool.reconfigure({poolMin: -1});
          },
          /NJS-007/
        );

        await assert.rejects(
          async function() {
            await pool.reconfigure({poolMin: NaN});
          },
          /NJS-007/
        );

        await assert.rejects(
          async function() {
            await pool.reconfigure({poolMin: null});
          },
          /NJS-007/
        );

        await assert.rejects(
          async function() {
            await pool.reconfigure({poolMin: '10'});
          },
          /NJS-007/
        );
      } catch (err) {
        should.not.exist(err);
      }
    });

    it('255.5.3 passing invalid poolMax to pool.reconfigure', async function() {
      try {
        await pool.reconfigure ({ poolMax: -1 });
      } catch (err) {
        (err.message).startsWith('NJS-007');
      }

      try {
        await pool.reconfigure({poolMax: NaN});
      } catch (err) {
        (err.message).startsWith('NJS-007');
      }

      try {
        await pool.reconfigure({poolMax: null});
      } catch (err) {
        (err.message).startsWith('NJS-007');
      }

      try {
        await pool.reconfigure({poolMax: 0});
      } catch (err) {
        (err.message).startsWith ('ORA-24413');
      }

      try {
        await pool.reconfigure({poolMax:"10"});
      } catch (err) {
        (err.message).startsWith ("NJS-007");
      }

    });

    it('255.5.4 passing invalid poolIncrement to pool.reconfigure', async function() {
      try {
        await pool.reconfigure ({poolIncrement : -1 });
      } catch (err) {
        (err.message).startsWith ('NJS-007');
      }

      try {
        await pool.reconfigure({ poolIncrement: NaN});
      } catch (err) {
        (err.message).startsWith ('NJS-007');
      }

      await assert.rejects(
        async function() {
          await pool.reconfigure({poolIncrement: null});
        },
        /NJS-007/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({poolIncrement: "100"});
        },
        /NJS-007/
      );

    });

    it('255.5.5 passing invalid enableStatistics to pool.reconfigure', async function() {
      await assert.rejects(
        async function() {
          await pool.reconfigure({enableStatistics: null});
        },
        /NJS-004/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({enableStatistics: -100});
        },
        /NJS-004/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({enableStatistics: NaN});
        },
        /NJS-004/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({enableStatistics: "true"});
        },
        /NJS-004/
      );
    });

    it('255.5.6 passing invalid poolPingInterval to pool.reconfigure', async function() {
      await assert.rejects(
        async function() {
          await pool.reconfigure({poolPingInterval: null});
        },
        /NJS-007/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({poolPingInterval: NaN});
        },
        /NJS-007/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({poolPingInterval: "10"});
        },
        /NJS-007/
      );

    });

    it('255.5.7 passing invalid poolTimeout to pool.reconfigure', async function() {
      await assert.rejects(
        async function() {
          await pool.reconfigure({poolTimeout: null});
        },
        /NJS-007/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({poolTimeout: -100});
        },
        /NJS-007/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({poolTimeout: NaN});
        },
        /NJS-007/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({poolTimeout: "10"});
        },
        /NJS-007/
      );
    });

    it('255.5.8 passing invalid poolMaxPerShard to pool.reconfigure', async function() {
      await assert.rejects(
        async function() {
          await pool.reconfigure({poolMaxPerShard: null});
        },
        /NJS-007/
      );

      try {
        await pool.reconfigure({poolMaxPerShard: -100});
      } catch (err) {
        should.exist(err);
        (err.message).startsWith('ORA-24328');
      }

      await assert.rejects(
        async function() {
          await pool.reconfigure({poolMaxPerShard: NaN});
        },
        /NJS-007/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({poolMaxPerShard: "10"});
        },
        /NJS-007/
      );
    });

    it('255.5.9 passing invalid queueMax to pool.reconfigure', async function() {
      try {
        await pool.reconfigure({queueMax: null});
      } catch (err) {
        (err.message).startsWith('NJS-004');
      }

      try {
        await pool.reconfigure({queueMax : -100});
      } catch (err) {
        (err.message).startsWith('NJS-004');
      }

      try {
        await pool.reconfigure({queueMax :NaN});
      }  catch (err) {
        (err.message).startsWith('NJS-004');
      }

      try {
        await pool.reconfigure({queueMax :"10"});
      } catch (err) {
        (err.message).startsWith('NJS-004');
      }

    });

    it('255.5.10 passing invalid queueTimeout to pool.reconfigure', async function() {
      try {
        await pool.reconfigure ({queueTimeout: null});
      } catch (err) {
        (err.message).startsWith('NJS-004');
      }

      try {
        await pool.reconfigure({queueTimeout: -100});
      } catch (err) {
        (err.message).startsWith('NJS-004');
      }

      try {
        await pool.reconfigure({queueTimeout: NaN});
      } catch (err) {
        (err.message).startsWith('NJS-004');
      }

      try {
        await pool.reconfigure ({queueTimeout:"10"});
      } catch (err) {
        (err.message).startsWith('NJS-004');
      }

    });

    it('255.5.11 passing invalid stmtCacheSize to pool.reconfigure', async function() {
      await assert.rejects(
        async function() {
          await pool.reconfigure({stmtCacheSize: null});
        },
        /NJS-007/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({stmtCacheSize: -100});
        },
        /NJS-007/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({stmtCacheSize: NaN});
        },
        /NJS-007/
      );

      await assert.rejects(
        async function() {
          await pool.reconfigure({stmtCacheSize: "10"});
        },
        /NJS-007/
      );
    });

    it('255.5.12 calling pool.reconfigure multiple times with empty config', async function() {
      let config = {};
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      checkOriginalPoolConfig(pool);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      checkOriginalPoolConfig(pool);
    });

    it('255.5.13 calling pool.reconfigure multiple times', async function() {
      if (oracledb.oracleClientVersion < 2103000000) {
        if (oracledb.oracleClientVersion < 1911000000 ||
            oracledb.oracleClientVersion >= 2000000000) {
          this.skip();
          return;
        }
      }
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      should.strictEqual(pool.poolMin, poolMin);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolIncrement, poolIncrement);
      should.strictEqual(pool.poolPingInterval, poolPingInterval);
      should.strictEqual(pool.poolTimeout, poolTimeout);
      should.strictEqual(pool.poolMaxPerShard, poolMaxPerShard);
      should.strictEqual(pool.queueMax, queueMax);
      should.strictEqual(pool.queueTimeout, queueTimeout);
      should.strictEqual(pool.stmtCacheSize, stmtCacheSize);

      poolMin = 5;
      poolMax = 10;
      poolIncrement = 1;
      enableStatistics = false;
      poolPingInterval = 10;
      poolTimeout = 2;
      poolMaxPerShard = 4;
      queueMax = 1;
      queueTimeout = 9;
      stmtCacheSize = 2;
      sodaMetaDataCache = false;
      resetStatistics = false;

      config =  {
        poolMin           : poolMin,
        poolMax           : poolMax,
        poolIncrement     : poolIncrement,
        enableStatistics  : enableStatistics,
        poolPingInterval  : poolPingInterval,
        poolTimeout       : poolTimeout,
        poolMaxPerShard   : poolMaxPerShard,
        queueMax          : queueMax,
        queueTimeout      : queueTimeout,
        stmtCacheSize     : stmtCacheSize,
        sodaMetaDataCache : sodaMetaDataCache,
        resetStatistics   : resetStatistics
      };

      await pool.reconfigure(config);
      await pool.reconfigure(config);
      await pool.reconfigure(config);
      should.strictEqual(pool.poolMin, poolMin);
      should.strictEqual(pool.poolMax, poolMax);
      should.strictEqual(pool.poolIncrement, poolIncrement);
      should.strictEqual(pool.poolPingInterval, poolPingInterval);
      should.strictEqual(pool.poolTimeout, poolTimeout);
      should.strictEqual(pool.poolMaxPerShard, poolMaxPerShard);
      should.strictEqual(pool.queueMax, queueMax);
      should.strictEqual(pool.queueTimeout, queueTimeout);
      should.strictEqual(pool.stmtCacheSize, stmtCacheSize);
    });

    it('255.5.14 reconfigure closed pool', async function() {
      await pool.close(0);
      let config =  {
        poolMin           : poolMin,
        poolMax           : poolMax,
        poolIncrement     : poolIncrement,
        enableStatistics  : enableStatistics,
        poolPingInterval  : poolPingInterval,
        poolTimeout       : poolTimeout,
        poolMaxPerShard   : poolMaxPerShard,
        queueMax          : queueMax,
        queueTimeout      : queueTimeout,
        stmtCacheSize     : stmtCacheSize,
        sodaMetaDataCache : sodaMetaDataCache,
        resetStatistics   : resetStatistics
      };

      await assert.rejects(
        async function() {
          await pool.reconfigure(config);
        },
        /NJS-065/
        // NJS-065: connection pool was closed
      );
      await assert.rejects(
        async function() {
          await pool.reconfigure(config);
        },
        /NJS-065/
        // NJS-065: connection pool was closed
      );
      pool = await oracledb.createPool(poolConfig);

    });

    it('255.5.15 get statistics of a closed pool', async function() {
      let config = {
        resetStatistics : true,
        enableStatistics : true
      };
      await pool.reconfigure(config);
      await pool.close(0);

      await assert.rejects(
        async function() {
          await pool.getStatistics();
        },
        /NJS-065/
        // NJS-065: connection pool was closed
      );

      pool = await oracledb.createPool(poolConfig);

    });

  });

  describe('255.6 Pool statistics', function() {
    it('255.6.1 get pool statistics by setting _enableStats', async function() {
      let poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolAlias        : "255.6.1.1",
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        _enableStats     : false
      };
      let pool = await oracledb.createPool(poolConfig);
      should.strictEqual(pool.poolAlias, "255.6.1.1");

      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      let poolStatistics = await pool.getStatistics();
      should.strictEqual(poolStatistics, null);
      let timeOfLastResetOriginalVal = pool._timeOfReset;

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }

      // Close the existing pool
      await pool.close(0);

      poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolAlias        : "255.6.1.2",
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        _enableStats     : true
      };

      pool = await oracledb.createPool(poolConfig);

      conns = new Array();
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      poolStatistics = await pool.getStatistics();

      (poolStatistics.upTime).should.above(0);
      (poolStatistics.upTimeSinceReset).should.above(0);
      (pool._timeOfReset).should.above(timeOfLastResetOriginalVal);
      should.strictEqual(poolStatistics.connectionRequests, poolMaxOriginalVal + 1);
      should.strictEqual(poolStatistics.requestsEnqueued, 1);
      should.strictEqual(poolStatistics.requestsDequeued, 0);
      should.strictEqual(poolStatistics.failedRequests, 0);
      should.strictEqual(poolStatistics.rejectedRequests, 0);
      should.strictEqual(poolStatistics.requestTimeouts, 1);
      should.strictEqual(poolStatistics.currentQueueLength, 0);
      should.strictEqual(poolStatistics.maximumQueueLength, 1);
      (poolStatistics.minimumTimeInQueue).should.above(0);
      (poolStatistics.maximumTimeInQueue).should.above(0);
      (poolStatistics.timeInQueue).should.aboveOrEqual(4);  // can be just less than 5
      (poolStatistics.averageTimeInQueue).should.aboveOrEqual(4);  // can be just less than 5
      should.strictEqual(poolStatistics.connectionsInUse, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.connectionsOpen, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolAlias, "255.6.1.2");
      should.strictEqual(poolStatistics.queueMax, 500);
      should.strictEqual(poolStatistics.queueTimeout, 5);
      should.strictEqual(poolStatistics.poolMin, poolMinOriginalVal);
      should.strictEqual(poolStatistics.poolMax, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(poolStatistics.poolPingInterval, 60);
      should.strictEqual(poolStatistics.poolTimeout, 60);
      should.strictEqual(poolStatistics.poolMaxPerShard, 0);
      should.strictEqual(poolStatistics.sessionCallback, undefined);
      should.strictEqual(poolStatistics.stmtCacheSize, 30);
      should.strictEqual(poolStatistics.sodaMetaDataCache, false);
      should.strictEqual(poolStatistics.threadPoolSize, undefined);

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }
      await pool.close(0);
    });

    it('255.6.2 get pool statistics by setting _enableStats', async function() {
      let poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolAlias        : "255.6.2.1",
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        _enableStats     : false
      };
      let pool1 = await oracledb.createPool(poolConfig);
      should.strictEqual(pool1.poolAlias, "255.6.2.1");

      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool1);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool1);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      let poolStatistics = await pool1.getStatistics();
      should.strictEqual(poolStatistics, null);
      let timeOfLastResetOriginalVal = pool1._timeOfReset;

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }
      // NOT close the existing pool

      poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolAlias        : "255.6.2.2",
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        _enableStats     : true
      };

      let pool2 = await oracledb.createPool(poolConfig);

      conns = new Array();
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool2);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool2);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      poolStatistics = await pool2.getStatistics();

      (poolStatistics.gatheredDate).should.above(0);
      (poolStatistics.upTime).should.above(0);
      (poolStatistics.upTimeSinceReset).should.above(0);
      (pool2._timeOfReset).should.above(timeOfLastResetOriginalVal);
      should.strictEqual(poolStatistics.connectionRequests, poolMaxOriginalVal + 1);
      should.strictEqual(poolStatistics.requestsEnqueued, 1);
      should.strictEqual(poolStatistics.requestsDequeued, 0);
      should.strictEqual(poolStatistics.failedRequests, 0);
      should.strictEqual(poolStatistics.rejectedRequests, 0);
      should.strictEqual(poolStatistics.requestTimeouts, 1);
      should.strictEqual(poolStatistics.currentQueueLength, 0);
      should.strictEqual(poolStatistics.maximumQueueLength, 1);
      (poolStatistics.minimumTimeInQueue).should.above(0);
      (poolStatistics.maximumTimeInQueue).should.above(0);
      (poolStatistics.timeInQueue).should.aboveOrEqual(5);
      (poolStatistics.averageTimeInQueue).should.aboveOrEqual(5);
      should.strictEqual(poolStatistics.connectionsInUse, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.connectionsOpen, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolAlias, '255.6.2.2');
      should.strictEqual(poolStatistics.queueMax, 500);
      should.strictEqual(poolStatistics.queueTimeout, 5);
      should.strictEqual(poolStatistics.poolMin, poolMinOriginalVal);
      should.strictEqual(poolStatistics.poolMax, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(poolStatistics.poolPingInterval, 60);
      should.strictEqual(poolStatistics.poolTimeout, 60);
      should.strictEqual(poolStatistics.poolMaxPerShard, 0);
      should.strictEqual(poolStatistics.sessionCallback, undefined);
      should.strictEqual(poolStatistics.stmtCacheSize, 30);
      should.strictEqual(poolStatistics.sodaMetaDataCache, false);
      should.strictEqual(poolStatistics.threadPoolSize, undefined);

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }
      await pool1.close(0);
      await pool2.close(0);
    });

    it('255.6.3 set enableStatistics to true, _enableStats will be ignored', async function() {
      let poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        _enableStats     : false,
        enableStatistics : true
      };

      let pool1 = await oracledb.createPool(poolConfig);

      let poolStatistics1 = await pool1.getStatistics();
      should.strictEqual(pool1._enableStats, true);
      should.strictEqual(pool1.enableStatistics, true);
      (poolStatistics1.gatheredDate).should.above(0);
      await pool1.close(0);

      let poolConfig2 = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        _enableStats     : true,
        enableStatistics : true
      };

      let pool2 = await oracledb.createPool(poolConfig2);
      let poolStatistics2 = await pool2.getStatistics();
      should.strictEqual(pool2._enableStats, true);
      should.strictEqual(pool2.enableStatistics, true);
      (poolStatistics2.gatheredDate).should.above(0);
      await pool2.close(0);

    });

    it('255.6.4 set enableStatistics to false, _enableStats will be used', async function() {
      let poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        enableStatistics : false,
        _enableStats     : false
      };

      let pool1 = await oracledb.createPool(poolConfig);

      let poolStatistics1 = await pool1.getStatistics();
      should.strictEqual(pool1._enableStats, false);
      should.strictEqual(pool1.enableStatistics, false);
      should.strictEqual(poolStatistics1, null);
      await pool1.close(0);

      let poolConfig2 = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        enableStatistics : false,
        _enableStats     : true
      };

      let pool2 = await oracledb.createPool(poolConfig2);
      let poolStatistics2 = await pool2.getStatistics();
      should.strictEqual(pool2._enableStats, true);
      should.strictEqual(pool2.enableStatistics, true);
      (poolStatistics2.gatheredDate).should.above(0);
      await pool2.close(0);

    });

    it('255.6.5 set multiple enableStatistics', async function() {
      let poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        enableStatistics : false,
        enableStatistics : true //eslint-disable-line
      };

      let pool1 = await oracledb.createPool(poolConfig);

      let poolStatistics1 = await pool1.getStatistics();
      should.strictEqual(pool1._enableStats, true);
      should.strictEqual(pool1.enableStatistics, true);
      (poolStatistics1.gatheredDate).should.above(0);
      await pool1.close(0);

      let poolConfig2 = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        enableStatistics : true,
        enableStatistics : false //eslint-disable-line
      };

      let pool2 = await oracledb.createPool(poolConfig2);
      let poolStatistics2 = await pool2.getStatistics();
      should.strictEqual(pool2._enableStats, false);
      should.strictEqual(pool2.enableStatistics, false);
      should.strictEqual(poolStatistics2, null);
      await pool2.close(0);

      let poolConfig3 = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        enableStatistics : true,
        enableStatistics : false, //eslint-disable-line
        enableStatistics : false //eslint-disable-line
      };

      let pool3 = await oracledb.createPool(poolConfig3);
      let poolStatistics3 = await pool3.getStatistics();
      should.strictEqual(pool3._enableStats, false);
      should.strictEqual(pool3.enableStatistics, false);
      should.strictEqual(poolStatistics3, null);
      await pool3.close(3);

    });

    it('255.6.6 set multiple _enableStats', async function() {
      let poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        _enableStats     : false,
        _enableStats     : true //eslint-disable-line
      };

      let pool1 = await oracledb.createPool(poolConfig);

      let poolStatistics1 = await pool1.getStatistics();
      should.strictEqual(pool1._enableStats, true);
      should.strictEqual(pool1.enableStatistics, true);
      (poolStatistics1.gatheredDate).should.above(0);
      await pool1.close(0);

      let poolConfig2 = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        _enableStats     : true,
        _enableStats     : false //eslint-disable-line
      };

      let pool2 = await oracledb.createPool(poolConfig2);
      let poolStatistics2 = await pool2.getStatistics();
      should.strictEqual(pool2._enableStats, false);
      should.strictEqual(pool2.enableStatistics, false);
      should.strictEqual(poolStatistics2, null);
      await pool2.close(0);

      let poolConfig3 = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        enableStatistics : true,
        enableStatistics : false, //eslint-disable-line
        enableStatistics : false //eslint-disable-line
      };

      let pool3 = await oracledb.createPool(poolConfig3);
      let poolStatistics3 = await pool3.getStatistics();
      should.strictEqual(pool3._enableStats, false);
      should.strictEqual(pool3.enableStatistics, false);
      should.strictEqual(poolStatistics3, null);
      await pool3.close(0);

    });

    it('255.6.7 get pool statistics by setting enableStatistics', async function() {
      let poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolAlias        : "255.6.7.1",
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        enableStatistics : false
      };
      let pool = await oracledb.createPool(poolConfig);
      should.strictEqual(pool.poolAlias, "255.6.7.1");

      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      let poolStatistics = await pool.getStatistics();
      should.strictEqual(poolStatistics, null);
      let timeOfLastResetOriginalVal = pool._timeOfReset;

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }

      // Close the existing pool
      await pool.close(0);

      poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolAlias        : "255.6.7.2",
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        enableStatistics : true
      };

      pool = await oracledb.createPool(poolConfig);

      conns = new Array();
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      poolStatistics = await pool.getStatistics();

      (poolStatistics.upTime).should.above(0);
      (poolStatistics.upTimeSinceReset).should.above(0);
      (pool._timeOfReset).should.above(timeOfLastResetOriginalVal);
      should.strictEqual(poolStatistics.connectionRequests, poolMaxOriginalVal + 1);
      should.strictEqual(poolStatistics.requestsEnqueued, 1);
      should.strictEqual(poolStatistics.requestsDequeued, 0);
      should.strictEqual(poolStatistics.failedRequests, 0);
      should.strictEqual(poolStatistics.rejectedRequests, 0);
      should.strictEqual(poolStatistics.requestTimeouts, 1);
      should.strictEqual(poolStatistics.currentQueueLength, 0);
      should.strictEqual(poolStatistics.maximumQueueLength, 1);
      (poolStatistics.minimumTimeInQueue).should.above(0);
      (poolStatistics.maximumTimeInQueue).should.above(0);
      (poolStatistics.timeInQueue).should.aboveOrEqual(4); // can be just less than 5
      (poolStatistics.averageTimeInQueue).should.aboveOrEqual(4);  // can be just less than 5
      should.strictEqual(poolStatistics.connectionsInUse, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.connectionsOpen, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolAlias, "255.6.7.2");
      should.strictEqual(poolStatistics.queueMax, 500);
      should.strictEqual(poolStatistics.queueTimeout, 5);
      should.strictEqual(poolStatistics.poolMin, poolMinOriginalVal);
      should.strictEqual(poolStatistics.poolMax, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(poolStatistics.poolPingInterval, 60);
      should.strictEqual(poolStatistics.poolTimeout, 60);
      should.strictEqual(poolStatistics.poolMaxPerShard, 0);
      should.strictEqual(poolStatistics.sessionCallback, undefined);
      should.strictEqual(poolStatistics.stmtCacheSize, 30);
      should.strictEqual(poolStatistics.sodaMetaDataCache, false);
      should.strictEqual(poolStatistics.threadPoolSize, undefined);

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }
      await pool.close(0);
    });

    it('255.6.8 get pool statistics by setting enableStatistics', async function() {
      let poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolAlias        : "255.6.8.1",
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        enableStatistics : false
      };
      let pool1 = await oracledb.createPool(poolConfig);
      should.strictEqual(pool1.poolAlias, "255.6.8.1");

      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool1);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool1);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      let poolStatistics = await pool1.getStatistics();
      should.strictEqual(poolStatistics, null);
      let timeOfLastResetOriginalVal = pool1._timeOfReset;

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }
      // NOT close the existing pool

      poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolAlias        : "255.6.8.2",
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        enableStatistics : true
      };

      let pool2 = await oracledb.createPool(poolConfig);

      conns = new Array();
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool2);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool2);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      poolStatistics = await pool2.getStatistics();

      (poolStatistics.gatheredDate).should.above(0);
      (poolStatistics.upTime).should.above(0);
      (poolStatistics.upTimeSinceReset).should.above(0);
      (pool2._timeOfReset).should.above(timeOfLastResetOriginalVal);
      should.strictEqual(poolStatistics.connectionRequests, poolMaxOriginalVal + 1);
      should.strictEqual(poolStatistics.requestsEnqueued, 1);
      should.strictEqual(poolStatistics.requestsDequeued, 0);
      should.strictEqual(poolStatistics.failedRequests, 0);
      should.strictEqual(poolStatistics.rejectedRequests, 0);
      should.strictEqual(poolStatistics.requestTimeouts, 1);
      should.strictEqual(poolStatistics.currentQueueLength, 0);
      should.strictEqual(poolStatistics.maximumQueueLength, 1);
      (poolStatistics.minimumTimeInQueue).should.above(0);
      (poolStatistics.maximumTimeInQueue).should.above(0);
      (poolStatistics.timeInQueue).should.aboveOrEqual(5);
      (poolStatistics.averageTimeInQueue).should.aboveOrEqual(5);
      should.strictEqual(poolStatistics.connectionsInUse, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.connectionsOpen, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolAlias, "255.6.8.2");
      should.strictEqual(poolStatistics.queueMax, 500);
      should.strictEqual(poolStatistics.queueTimeout, 5);
      should.strictEqual(poolStatistics.poolMin, poolMinOriginalVal);
      should.strictEqual(poolStatistics.poolMax, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(poolStatistics.poolPingInterval, 60);
      should.strictEqual(poolStatistics.poolTimeout, 60);
      should.strictEqual(poolStatistics.poolMaxPerShard, 0);
      should.strictEqual(poolStatistics.sessionCallback, undefined);
      should.strictEqual(poolStatistics.stmtCacheSize, 30);
      should.strictEqual(poolStatistics.sodaMetaDataCache, false);
      should.strictEqual(poolStatistics.threadPoolSize, undefined);

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }
      await pool1.close(0);
      await pool2.close(0);
    });

    it('255.6.9 get pool statistics by setting enableStatistics and _enableStats', async function() {
      let poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolAlias        : "255.6.9.1",
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        enableStatistics : false
      };
      let pool1 = await oracledb.createPool(poolConfig);
      should.exist(pool1);

      let conns = new Array();
      let conIndex;
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool1);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool1);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      let poolStatistics = await pool1.getStatistics();
      should.strictEqual(poolStatistics, null);
      let timeOfLastResetOriginalVal = pool1._timeOfReset;

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }
      // NOT close the existing pool

      poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
        poolAlias        : "255.6.9.2",
        poolMin          : poolMinOriginalVal,
        poolMax          : poolMaxOriginalVal,
        poolIncrement    : poolIncrementOriginalVal,
        queueTimeout     : 5,
        _enableStats     : true
      };

      let pool2 = await oracledb.createPool(poolConfig);

      conns = new Array();
      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = await testsUtil.getPoolConnection(pool2);
        conns.push(conn);
      }
      await assert.rejects(
        async function() {
          await testsUtil.getPoolConnection(pool2);
        },
        /NJS-040/ // NJS-040: connection request timeout. Request exceeded queueTimeout of 5
      );

      poolStatistics = await pool2.getStatistics();

      (poolStatistics.gatheredDate).should.above(0);
      (poolStatistics.upTime).should.above(0);
      (poolStatistics.upTimeSinceReset).should.above(0);
      (pool2._timeOfReset).should.above(timeOfLastResetOriginalVal);
      should.strictEqual(poolStatistics.connectionRequests, poolMaxOriginalVal + 1);
      should.strictEqual(poolStatistics.requestsEnqueued, 1);
      should.strictEqual(poolStatistics.requestsDequeued, 0);
      should.strictEqual(poolStatistics.failedRequests, 0);
      should.strictEqual(poolStatistics.rejectedRequests, 0);
      should.strictEqual(poolStatistics.requestTimeouts, 1);
      should.strictEqual(poolStatistics.currentQueueLength, 0);
      should.strictEqual(poolStatistics.maximumQueueLength, 1);
      (poolStatistics.minimumTimeInQueue).should.above(0);
      (poolStatistics.maximumTimeInQueue).should.above(0);
      (poolStatistics.timeInQueue).should.aboveOrEqual(5);
      (poolStatistics.averageTimeInQueue).should.aboveOrEqual(5);
      should.strictEqual(poolStatistics.connectionsInUse, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.connectionsOpen, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolAlias, "255.6.9.2");
      should.strictEqual(poolStatistics.queueMax, 500);
      should.strictEqual(poolStatistics.queueTimeout, 5);
      should.strictEqual(poolStatistics.poolMin, poolMinOriginalVal);
      should.strictEqual(poolStatistics.poolMax, poolMaxOriginalVal);
      should.strictEqual(poolStatistics.poolIncrement, poolIncrementOriginalVal);
      should.strictEqual(poolStatistics.poolPingInterval, 60);
      should.strictEqual(poolStatistics.poolTimeout, 60);
      should.strictEqual(poolStatistics.poolMaxPerShard, 0);
      should.strictEqual(poolStatistics.sessionCallback, undefined);
      should.strictEqual(poolStatistics.stmtCacheSize, 30);
      should.strictEqual(poolStatistics.sodaMetaDataCache, false);
      should.strictEqual(poolStatistics.threadPoolSize, undefined);

      for (conIndex = 0; conIndex < poolMaxOriginalVal; conIndex++) {
        let conn = conns[conIndex];
        await conn.close();
      }
      await pool1.close(0);
      await pool2.close(0);
    });

    it('255.6.10 logStatistics without enableStatistics', async function() {
      let poolConfig = {
        user             : dbConfig.user,
        password         : dbConfig.password,
        connectionString : dbConfig.connectString,
      };
      const pool = await oracledb.createPool(poolConfig);
      should.exist(pool);

      let sawErr = false;
      try {
        pool.logStatistics();
      } catch (err) {
        sawErr = true;
        (err.message).should.startWith('NJS-083:');
      }
      should.strictEqual(sawErr, true);

      await pool.close(0);
    });

  });

});
