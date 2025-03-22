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
 *   43. plsqlBindIndexedTable1.js
 *
 * DESCRIPTION
 *   Testing PL/SQL indexed tables (associative arrays).
 *
 *****************************************************************************/
'use strict';

var oracledb = require('oracledb');
var should   = require('should');
var async    = require('async');
var dbConfig = require('./dbconfig.js');

describe('43. plsqlBindIndexedTable1.js', function() {

  var credentials = {
    user:          dbConfig.user,
    password:      dbConfig.password,
    connectString: dbConfig.connectString
  };

  describe('43.1 binding PL/SQL indexed table', function() {
    var connection = null;

    before(function(done) {
      oracledb.getConnection(credentials, function(err, conn) {
        if (err) {
          console.error(err.message); return;
        }
        connection = conn;
        done();
      });
    });

    after(function(done) {
      connection.release(function(err) {
        if (err) {
          console.error(err.message); return;
        }
        done();
      });
    });

    it('43.1.1 binding PL/SQL indexed table IN by name', function(done) {
      async.series([
        function(callback) {
          var proc = "CREATE OR REPLACE PACKAGE\n" +
                      "nodb_plsqlbindpack1\n" +
                      "IS\n" +
                      "  TYPE stringsType IS TABLE OF VARCHAR2(30) INDEX BY BINARY_INTEGER;\n" +
                      "  TYPE numbersType IS TABLE OF NUMBER INDEX BY BINARY_INTEGER;\n" +
                      "  FUNCTION test(strings IN stringsType, numbers IN numbersType) RETURN VARCHAR2;\n" +
                      "END;";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var proc = "CREATE OR REPLACE PACKAGE BODY\n" +
                     "nodb_plsqlbindpack1\n" +
                     "IS\n" +
                     "  FUNCTION test(strings IN stringsType, numbers IN numbersType) RETURN VARCHAR2\n" +
                     "  IS\n" +
                     "    s VARCHAR2(2000) := '';\n" +
                     "  BEGIN\n" +
                     "    FOR i IN 1 .. strings.COUNT LOOP\n" +
                     "      s := s || strings(i);\n" +
                     "    END LOOP;\n" +
                     "    FOR i IN 1 .. numbers.COUNT LOOP\n" +
                     "       s := s || numbers(i);\n" +
                     "    END LOOP;\n" +
                     "    RETURN s;\n" +
                     "  END;\n" +
                     "END;";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var bindvars = {
            result: {type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 2000},
            strings:  {type: oracledb.STRING, dir: oracledb.BIND_IN, val: ['John', 'Doe']},
            numbers: {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: [0, 8, 11]}
          };
          connection.execute(
            "BEGIN :result := nodb_plsqlbindpack1.test(:strings, :numbers); END;",
            bindvars,
            function(err, result) {
              should.not.exist(err);
              // console.log(result);
              result.outBinds.result.should.be.exactly('JohnDoe0811');
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            "DROP PACKAGE nodb_plsqlbindpack1",
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        }
      ], done);
    });

    it('43.1.2 binding PL/SQL indexed table IN by position', function(done) {
      async.series([
        function(callback) {
          var proc = "CREATE OR REPLACE PACKAGE\n" +
                      "nodb_plsqlbindpack2\n" +
                      "IS\n" +
                      "  TYPE stringsType IS TABLE OF VARCHAR2(30) INDEX BY BINARY_INTEGER;\n" +
                      "  TYPE numbersType IS TABLE OF NUMBER INDEX BY BINARY_INTEGER;\n" +
                      "  PROCEDURE test(s IN stringsType, n IN numbersType);\n" +
                      "END;";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var proc = "CREATE OR REPLACE PACKAGE BODY\n" +
                     "nodb_plsqlbindpack2\n" +
                     "IS\n" +
                     "  PROCEDURE test(s IN stringsType, n IN numbersType)\n" +
                     "  IS\n" +
                     "  BEGIN\n" +
                     "    IF (s(1) IS NULL OR s(1) <> 'John') THEN\n" +
                     "      raise_application_error(-20000, 'Invalid s(1): \"' || s(1) || '\"');\n" +
                     "    END IF;\n" +
                     "    IF (s(2) IS NULL OR s(2) <> 'Doe') THEN\n" +
                     "      raise_application_error(-20000, 'Invalid s(2): \"' || s(2) || '\"');\n" +
                     "    END IF;\n" +
                     "  END;\n" +
                     "END;";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var bindvars = [
            {type: oracledb.STRING, dir: oracledb.BIND_IN, val: ['John', 'Doe']},
            {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: [8, 11]}
          ];
          connection.execute(
            "BEGIN nodb_plsqlbindpack2.test(:1, :2); END;",
            bindvars,
            function(err) {
              should.not.exist(err);
              // console.log(result);
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            "DROP PACKAGE nodb_plsqlbindpack2",
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        }
      ], done);
    });

    it('43.1.3 binding PL/SQL indexed table IN OUT', function(done) {
      async.series([
        function(callback) {
          var proc = "CREATE OR REPLACE PACKAGE\n" +
                      "nodb_plsqlbindpack3\n" +
                      "IS\n" +
                      "  TYPE stringsType IS TABLE OF VARCHAR2(30) INDEX BY BINARY_INTEGER;\n" +
                      "  TYPE numbersType IS TABLE OF NUMBER INDEX BY BINARY_INTEGER;\n" +
                      "  PROCEDURE test(strings IN OUT NOCOPY stringsType, numbers IN OUT NOCOPY numbersType);\n" +
                      "END;";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var proc = "CREATE OR REPLACE PACKAGE BODY\n" +
                     "nodb_plsqlbindpack3\n" +
                     "IS\n" +
                     "  PROCEDURE test(strings IN OUT NOCOPY stringsType, numbers IN OUT NOCOPY numbersType)\n" +
                     "  IS\n" +
                     "  BEGIN\n" +
                     "    FOR i IN 1 .. strings.COUNT LOOP\n" +
                     "      strings(i) := '(' || strings(i) || ')';\n" +
                     "    END LOOP;\n" +
                     "    FOR i IN 1 .. numbers.COUNT LOOP\n" +
                     "      numbers(i) := numbers(i) * 10;\n" +
                     "    END LOOP;\n" +
                     "    numbers(numbers.COUNT + 1) := 4711;\n" +
                     "  END;\n" +
                     "END;";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var bindvars = {
            strings:  {type: oracledb.STRING, dir: oracledb.BIND_INOUT, val: ['John', 'Doe'], maxArraySize: 2},
            numbers:  {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: [1, 2, 3], maxArraySize: 4}
          };
          connection.execute(
            "BEGIN nodb_plsqlbindpack3.test(:strings, :numbers); END;",
            bindvars,
            function(err, result) {
              should.not.exist(err);
              //console.log(result);
              should.deepEqual(result.outBinds.strings, ['(John)', '(Doe)']);
              should.deepEqual(result.outBinds.numbers, [10, 20, 30, 4711]);
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            "DROP PACKAGE nodb_plsqlbindpack3",
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        }
      ], done);
    });

    it('43.1.4 binding PL/SQL indexed table OUT', function(done) {
      async.series([
        function(callback) {
          var proc = "CREATE OR REPLACE PACKAGE\n" +
                     "nodb_plsqlbindpack4\n" +
                     "IS\n" +
                     "  TYPE stringsType IS TABLE OF VARCHAR2(30) INDEX BY BINARY_INTEGER;\n" +
                     "  TYPE numbersType IS TABLE OF NUMBER INDEX BY BINARY_INTEGER;\n" +
                     "  PROCEDURE test(items IN NUMBER, strings OUT NOCOPY stringsType, numbers OUT NOCOPY numbersType);\n" +
                     "END;";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var proc = "CREATE OR REPLACE PACKAGE BODY\n" +
                     "nodb_plsqlbindpack4\n" +
                     "IS\n" +
                     "  PROCEDURE test(items IN NUMBER, strings OUT NOCOPY stringsType, numbers OUT NOCOPY numbersType)\n" +
                     "  IS\n" +
                     "  BEGIN\n" +
                     "    FOR i IN 1 .. items LOOP\n" +
                     "      strings(i) := i;\n" +
                     "    END LOOP;\n" +
                     "    FOR i IN 1 .. items LOOP\n" +
                     "      numbers(i) := i;\n" +
                     "    END LOOP;\n" +
                     "  END;\n" +
                     "END;";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var bindvars = {
            items: {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: 3},
            strings:  {type: oracledb.STRING, dir: oracledb.BIND_OUT, maxArraySize: 3},
            numbers:  {type: oracledb.NUMBER, dir: oracledb.BIND_OUT, maxArraySize: 3}
          };
          connection.execute(
            "BEGIN nodb_plsqlbindpack4.test(:items, :strings, :numbers); END;",
            bindvars,
            function(err, result) {
              should.not.exist(err);
              //console.log(result);
              should.deepEqual(result.outBinds.strings, ['1', '2', '3']);
              should.deepEqual(result.outBinds.numbers, [1, 2, 3]);
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            "DROP PACKAGE nodb_plsqlbindpack4",
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        }
      ], done);
    });

  });

  describe('43.2 test exceptions when using PL/SQL indexed table bindings', function() {
    var connection = null;

    before(function(done) {
      async.series([
        function(callback) {
          oracledb.getConnection(credentials, function(err, conn) {
            should.not.exist(err);
            connection = conn;
            callback();
          });
        },
        function(callback) {
          var proc = "CREATE OR REPLACE PACKAGE\n" +
                      "nodb_plsqlbindpack21\n" +
                      "IS\n" +
                      "  TYPE datesType IS TABLE OF DATE INDEX BY BINARY_INTEGER;\n" +
                      "  TYPE numbersType IS TABLE OF NUMBER INDEX BY BINARY_INTEGER;\n" +
                      "  TYPE stringsType IS TABLE OF VARCHAR2(2000) INDEX BY BINARY_INTEGER;\n" +
                      "  PROCEDURE test1(p IN numbersType);\n" +
                      "  PROCEDURE test2(p IN OUT NOCOPY numbersType);\n" +
                      "  PROCEDURE test3(p IN datesType);\n" +
                      "  PROCEDURE test4(id IN numbersType, p IN datesType);\n" +
                      "  PROCEDURE test5(p OUT stringsType);\n" +
                      "END;";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var proc = "CREATE OR REPLACE PACKAGE BODY\n" +
                     "nodb_plsqlbindpack21\n" +
                     "IS\n" +
                     "  PROCEDURE test1(p IN numbersType) IS BEGIN NULL; END;\n" +
                     "  PROCEDURE test2(p IN OUT NOCOPY numbersType) IS BEGIN NULL; END;\n" +
                     "  PROCEDURE test3(p IN datesType) IS BEGIN NULL; END;\n" +
                     "  PROCEDURE test4(id IN numbersType, p IN datesType) IS BEGIN NULL; END;\n" +
                     "  PROCEDURE test5(p OUT stringsType) IS BEGIN NULL; END;\n" +
                     "END;";
          connection.should.be.ok();
          connection.execute(
            proc,
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
            "DROP PACKAGE nodb_plsqlbindpack21",
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

    it('43.2.1 maxArraySize is ignored when specifying BIND_IN', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: [1, 2, 3], maxArraySize: 2}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack21.test1(:p); END;",
        bindvars,
        function(err, result) {
          should.not.exist(err);
          should.exist(result);
          done();
        }
      );
    });

    it('43.2.2 maxArraySize is mandatory for BIND_INOUT ', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: [1, 2, 3]}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack21.test2(:p); END;",
        bindvars,
        function(err, result) {
          should.exist(err);
          (err.message).should.startWith('NJS-035:');
          // NJS-035: maxArraySize is required for IN OUT array bind
          should.not.exist(result);
          done();
        }
      );
    });

    it('43.2.3 maxArraySize cannot smaller than the number of array elements', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: [1, 2, 3], maxArraySize: 2}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack21.test3(:p); END;",
        bindvars,
        function(err, result) {
          should.exist(err);
          (err.message).should.startWith('NJS-036:');
          // NJS-036: Given Array is of size greater than maxArraySize property.
          should.not.exist(result);
          done();
        }
      );
    });

    it('43.2.5 negative case: incorrect type of array element - bind by name 1', function(done) {
      var bindvars = {
        id: {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: ["1", 1]},
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: "hi"}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack21.test4(:id, :p); END;",
        bindvars,
        function(err, result) {
          should.exist(err);
          (err.message).should.startWith('NJS-037:');
          (err.message).should.match(/^NJS-037:.*\sindex\s0\s.*\sbind\s":id"$/);
          // NJS-037: invalid data type at array index 0 for bind ":id"
          should.not.exist(result);
          done();
        }
      );
    });

    it('43.2.6 negative case: incorrect type of array element - bind by name 2', function(done) {
      var bindvars = {
        id: {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: [1, 2, "hi"]},
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: [1, 'hello']}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack21.test4(:id, :p); END;",
        bindvars,
        function(err, result) {
          should.exist(err);
          (err.message).should.startWith('NJS-037:');
          (err.message).should.match(/^NJS-037:.*\sindex\s2\s.*\sbind\s":id"$/);
          // NJS-037: invalid data type at array index 2 for bind ":id"
          should.not.exist(result);
          done();
        }
      );
    });

    it('43.2.7 negative case: incorrect type of array element - bind by name 3', function(done) {
      var bindvars = {
        id: {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: [1, 2]},
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: ['hello', 1]}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack21.test4(:id, :p); END;",
        bindvars,
        function(err, result) {
          should.exist(err);
          (err.message).should.startWith('NJS-037:');
          (err.message).should.match(/^NJS-037:.*\sindex\s0\s.*\sbind\s":p"$/);
          // NJS-037: invalid data type at array index 0 for bind ":p"
          should.not.exist(result);
          done();
        }
      );
    });

    it('43.2.8 negative case: incorrect type of array element - bind by name 4', function(done) {
      var bindvars = {
        id: {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: [1, 2, 3]},
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: [1, 2, 'hello']}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack21.test4(:id, :p); END;",
        bindvars,
        function(err, result) {
          should.exist(err);
          (err.message).should.startWith('NJS-037:');
          (err.message).should.match(/^NJS-037:.*\sindex\s2\s.*\sbind\s":p"$/);
          // NJS-037: invalid data type at array index 2 for bind ":p"
          should.not.exist(result);
          done();
        }
      );
    });

    it('43.2.9 supports binding by position', function(done) {
      var bindvars = [
        {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: [1, 2]}
      ];
      connection.execute(
        "BEGIN nodb_plsqlbindpack21.test1(:1); END;",
        bindvars,
        function(err, result) {
          should.not.exist(err);
          should.exist(result);
          done();
        }
      );
    });

    it('43.2.10 negative case: incorrect type of array elements - bind by pos 1',
      function(done) {
        var bindvars = [
          { type : oracledb.NUMBER, dir: oracledb.BIND_IN, val : ['hello', 1] },
          { type : oracledb.NUMBER, dir: oracledb.BIND_IN, val : "hi" }
        ];
        connection.execute (
          "BEGIN nodb_plsqlbindpack21.test4 (:1, :2); END;",
          bindvars,
          function(err, result) {
            should.exist (err) ;
            (err.message).should.startWith ('NJS-052:');
            (err.message).should.match(/^NJS-052:.*\sindex\s0\s.*\sposition\s1$/);
            // NJS-052: invalid data type at array index 0 for bind position 1
            should.not.exist (result);
            done ();
          }
        );
      }
    );

    it('43.2.11 negative case: incorrect type of array elements - bind by pos 2',
      function(done) {
        var bindvars = [
          { type : oracledb.NUMBER, dir: oracledb.BIND_IN, val : [1, 2, "hi"] },
          { type : oracledb.NUMBER, dir: oracledb.BIND_IN, val : "hi" }
        ];
        connection.execute (
          "BEGIN nodb_plsqlbindpack21.test4 (:1, :2); END;",
          bindvars,
          function(err, result) {
            should.exist (err) ;
            (err.message).should.startWith ('NJS-052:');
            (err.message).should.match(/^NJS-052:.*\sindex\s2\s.*\sposition\s1$/);
            // NJS-052: invalid data type at array index 2 for bind position 1
            should.not.exist (result);
            done ();
          }
        );
      }
    );

    it('43.2.12 negative case: incorrect type of array elements - bind by pos 3',
      function(done) {
        var bindvars = [
          { type : oracledb.NUMBER, dir: oracledb.BIND_IN, val : [1, 2] },
          { type : oracledb.NUMBER, dir: oracledb.BIND_IN, val : ["hi", 1] }
        ];
        connection.execute (
          "BEGIN nodb_plsqlbindpack21.test4 (:1, :2); END;",
          bindvars,
          function(err, result) {
            should.exist (err) ;
            (err.message).should.startWith ('NJS-052:');
            (err.message).should.match(/^NJS-052:.*\sindex\s0\s.*\sposition\s2$/);
            // NJS-052: invalid data type at array index 0 for bind position 2
            should.not.exist (result);
            done ();
          }
        );
      }
    );

    it('43.2.13 negative case: incorrect type of array elements - bind by pos 4',
      function(done) {
        var bindvars = [
          { type : oracledb.NUMBER, dir: oracledb.BIND_IN, val : [1, 2, 3] },
          { type : oracledb.NUMBER, dir: oracledb.BIND_IN, val : [1, 2, "hi"] }
        ];
        connection.execute (
          "BEGIN nodb_plsqlbindpack21.test4 (:1, :2); END;",
          bindvars,
          function(err, result) {
            should.exist (err) ;
            (err.message).should.startWith ('NJS-052:');
            (err.message).should.match(/^NJS-052:.*\sindex\s2\s.*\sposition\s2$/);
            // NJS-052: invalid data type at array index 2 for bind position 2
            should.not.exist (result);
            done ();
          }
        );
      }
    );
  }); // 43.2

  describe('43.3 binding PL/SQL scalar', function() {
    var connection = null;

    before(function(done) {
      oracledb.getConnection(credentials, function(err, conn) {
        if (err) {
          console.error(err.message); return;
        }
        connection = conn;
        done();
      });
    });

    after(function(done) {
      connection.release(function(err) {
        if (err) {
          console.error(err.message); return;
        }
        done();
      });
    });

    it('43.3.1 binding PL/SQL scalar IN', function(done) {
      async.series([
        function(callback) {
          var proc = "CREATE OR REPLACE\n" +
                     "FUNCTION nodb_plsqlbindfunc31(stringValue IN VARCHAR2, numberValue IN NUMBER, dateValue IN DATE) RETURN VARCHAR2\n" +
                     "IS\n" +
                     "BEGIN\n" +
                     "  RETURN stringValue || ' ' || numberValue || ' released in ' || TO_CHAR(dateValue, 'MON YYYY');\n" +
                     "END nodb_plsqlbindfunc31;";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var bindvars = {
            result:      {type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 2000},
            stringValue: {type: oracledb.STRING, dir: oracledb.BIND_IN, val: 'Space odyssey'},
            numberValue: {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: 2001 },
            dateValue:   {type: oracledb.DATE, dir: oracledb.BIND_IN, val: new Date(1968, 3, 2) }
          };
          connection.execute(
            "BEGIN :result := nodb_plsqlbindfunc31(:stringValue, :numberValue, :dateValue); END;",
            bindvars,
            function(err, result) {
              should.not.exist(err);
              //console.log(result);
              result.outBinds.result.should.be.exactly('Space odyssey 2001 released in APR 1968');
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            "DROP FUNCTION nodb_plsqlbindfunc31",
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        }
      ], done);
    });

    it('43.3.2 binding PL/SQL scalar IN/OUT', function(done) {
      async.series([
        function(callback) {
          var proc = "CREATE OR REPLACE\n" +
                     "PROCEDURE nodb_plsqlbindproc32(stringValue IN OUT NOCOPY VARCHAR2, numberValue IN OUT NOCOPY NUMBER, dateValue IN OUT NOCOPY DATE)\n" +
                     "IS\n" +
                     "BEGIN\n" +
                     "  stringValue := '(' || stringValue || ')';\n" +
                     "  numberValue := NumberValue + 100;\n" +
                     //"  dateValue   := "
                     "END nodb_plsqlbindproc32;\n";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var releaseDate = new Date(1968, 3, 2);
          var bindvars = {
            stringValue: {type: oracledb.STRING, dir: oracledb.BIND_INOUT, val: 'Space odyssey'},
            numberValue: {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: 2001},
            dateValue:   {type: oracledb.DATE, dir: oracledb.BIND_INOUT, val: releaseDate}
          };
          connection.execute(
            "BEGIN nodb_plsqlbindproc32(:stringValue, :numberValue, :dateValue); END;",
            bindvars,
            function(err, result) {
              should.not.exist(err);
              // console.log(result);
              result.outBinds.stringValue.should.be.exactly('(Space odyssey)');
              result.outBinds.numberValue.should.be.exactly(2101);
              //result.outBinds.dateValue.should.eql(releaseDate)
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            "DROP PROCEDURE nodb_plsqlbindproc32",
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        }
      ], done);
    });

    it('43.3.3 binding PL/SQL scalar OUT by name', function(done) {
      async.series([
        function(callback) {
          var proc = "CREATE OR REPLACE\n" +
                     "PROCEDURE nodb_plsqlbindproc33(stringValue OUT VARCHAR2, numberValue OUT NUMBER, dateValue OUT DATE)\n" +
                     "IS\n" +
                     "BEGIN\n" +
                     "  stringValue := 'Space odyssey';\n" +
                     "  numberValue := 2001;\n" +
                     "  dateValue   := TO_DATE('04-02-1968', 'MM-DD-YYYY');" +
                     "END nodb_plsqlbindproc33;\n";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var bindvars = {
            stringValue:  {type: oracledb.STRING, dir: oracledb.BIND_OUT},
            numberValue:  {type: oracledb.NUMBER, dir: oracledb.BIND_OUT},
            dateValue:    {type: oracledb.DATE, dir: oracledb.BIND_OUT}
          };
          connection.execute(
            "BEGIN nodb_plsqlbindproc33(:stringValue, :numberValue, :dateValue); END;",
            bindvars,
            function(err, result) {
              should.not.exist(err);
              // console.log(result);
              result.outBinds.stringValue.should.be.exactly('Space odyssey');
              result.outBinds.numberValue.should.be.exactly(2001);
              (Object.prototype.toString.call(result.outBinds.dateValue)).should.eql('[object Date]');
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            "DROP PROCEDURE nodb_plsqlbindproc33",
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        }
      ], done);
    });

    it('43.3.4 binding PL/SQL scalar OUT by position', function(done) {
      async.series([
        function(callback) {
          var proc = "CREATE OR REPLACE\n" +
                     "PROCEDURE nodb_plsqlbindproc34(stringValue OUT VARCHAR2, numberValue OUT NUMBER, dateValue OUT DATE)\n" +
                     "IS\n" +
                     "BEGIN\n" +
                     "  stringValue := 'Space odyssey';\n" +
                     "  numberValue := 2001;\n" +
                     "  dateValue   := TO_DATE('04-02-1968', 'MM-DD-YYYY');" +
                     "END nodb_plsqlbindproc34;\n";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          var bindvars = [
            {type: oracledb.STRING, dir: oracledb.BIND_OUT},
            {type: oracledb.NUMBER, dir: oracledb.BIND_OUT},
            {type: oracledb.DATE, dir: oracledb.BIND_OUT}
          ];
          connection.execute(
            "BEGIN nodb_plsqlbindproc34(:1, :2, :3); END;",
            bindvars,
            function(err, result) {
              should.not.exist(err);
              // console.log(result);
              result.outBinds[0].should.be.exactly('Space odyssey');
              result.outBinds[1].should.be.exactly(2001);
              (Object.prototype.toString.call(result.outBinds[2])).should.eql('[object Date]');
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            "DROP PROCEDURE nodb_plsqlbindproc34",
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        }
      ], done);
    });

  }); // 43.3

  describe('43.4 test attribute - maxArraySize', function() {
    var connection = null;

    before(function(done) {
      async.series([
        function(cb) {
          oracledb.getConnection(credentials, function(err, conn) {
            should.not.exist(err);
            connection = conn;
            cb();
          });
        },
        function(cb) {
          var proc = "CREATE OR REPLACE PACKAGE\n" +
                      "nodb_plsqlbindpack41\n" +
                      "IS\n" +
                      "  TYPE datesType IS TABLE OF DATE INDEX BY BINARY_INTEGER;\n" +
                      "  TYPE numbersType IS TABLE OF NUMBER INDEX BY BINARY_INTEGER;\n" +
                      "  TYPE stringsType IS TABLE OF VARCHAR2(2000) INDEX BY BINARY_INTEGER;\n" +
                      "  PROCEDURE test1(p IN numbersType);\n" +
                      "  PROCEDURE test2(p IN OUT NOCOPY numbersType);\n" +
                      "  PROCEDURE test3(p IN datesType);\n" +
                      "  PROCEDURE test4(p IN stringsType);\n" +
                      "  PROCEDURE test5(p IN numbersType);\n" +
                      "END;";
          connection.should.be.ok();
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              cb();
            }
          );
        },
        function(cb) {
          var proc = "CREATE OR REPLACE PACKAGE BODY\n" +
                     "nodb_plsqlbindpack41\n" +
                     "IS\n" +
                     "  PROCEDURE test1(p IN numbersType) IS BEGIN NULL; END;\n" +
                     "  PROCEDURE test2(p IN OUT NOCOPY numbersType) IS BEGIN NULL; END;\n" +
                     "  PROCEDURE test3(p IN datesType) IS BEGIN NULL; END;\n" +
                     "  PROCEDURE test4(p IN stringsType) IS BEGIN NULL; END;\n" +
                     "  PROCEDURE test5(p IN numbersType) IS BEGIN NULL; END;\n" +
                     "END;";
          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              cb();
            }
          );
        }
      ], done);
    }); // before

    after(function(done) {
      async.series([
        function(callback) {
          connection.execute(
            "DROP PACKAGE nodb_plsqlbindpack41",
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

    it('43.4.1 maxArraySize property is ignored for BIND_IN', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_IN, val: [1, 2, 3], maxArraySize: 1}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack41.test1(:p); END;",
        bindvars,
        function(err, result) {
          should.not.exist(err);
          should.exist(result);
          done();
        }
      );
    });

    it('43.4.2 maxArraySize is mandatory for BIND_INOUT', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: [1, 2, 3]}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack41.test2(:p); END;",
        bindvars,
        function(err, result) {
          should.exist(err);
          (err.message).should.startWith('NJS-035:');
          // NJS-035: maxArraySize is required for IN OUT array bind
          should.not.exist(result);
          done();
        }
      );
    });

    it('43.4.3 maxArraySize cannot smaller than the number of array elements', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: [1, 2, 3], maxArraySize: 2}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack41.test2(:p); END;",
        bindvars,
        function(err, result) {
          should.exist(err);
          (err.message).should.startWith('NJS-036:');
          // NJS-036: given Array is of size greater than maxArraySize property.
          should.not.exist(result);
          done();
        }
      );
    });

    it('43.4.4 maxArraySize can be equal to the number of array elements', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: [1, 2, 3], maxArraySize: 3}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack41.test2(:p); END;",
        bindvars,
        function(err) {
          should.not.exist(err);
          done();
        }
      );
    });

    it('43.4.5 negative case: large value', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: [1, 2, 3], maxArraySize: 987654321}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack41.test2(:p); END;",
        bindvars,
        function(err) {
          should.exist(err);
          should.strictEqual(
            err.message,
            "DPI-1015: array size of 987654321 is too large"
          );
          done();
        }
      );
    });

    it('43.4.6 negative case: < 0', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: [1, 2, 3], maxArraySize: -9}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack41.test2(:p); END;",
        bindvars,
        function(err) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');
          // NJS-007: invalid value for "maxArraySize"
          done();
        }
      );
    });

    it('43.4.7 negative case: = 0', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: [1, 2, 3], maxArraySize: 0}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack41.test2(:p); END;",
        bindvars,
        function(err) {
          should.exist(err);
          (err.message).should.startWith('NJS-035:');
          // NJS-035: maxArraySize is required for IN OUT array bind
          done();
        }
      );
    });

    it('43.4.8 negative case: assign a string to it', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: [1, 2, 3], maxArraySize: 'foobar'}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack41.test2(:p); END;",
        bindvars,
        function(err) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');
          // NJS-007: invalid value for "maxArraySize"
          done();
        }
      );
    });

    it('43.4.9 negative case: NaN', function(done) {
      var bindvars = {
        p:  {type: oracledb.NUMBER, dir: oracledb.BIND_INOUT, val: [1, 2, 3], maxArraySize: NaN}
      };
      connection.execute(
        "BEGIN nodb_plsqlbindpack41.test2(:p); END;",
        bindvars,
        function(err) {
          should.exist(err);
          (err.message).should.startWith('NJS-007:');
          // NJS-007: invalid value for "maxArraySize"
          done();
        }
      );
    });

  }); // 43.4
});
