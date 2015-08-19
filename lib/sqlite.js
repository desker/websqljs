;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.sqlitejs = factory();
  }
}(this, function() {
function isString(val) {
  return typeof(val)==='string';
}

function isNumber(val) {
  return typeof(val)==='number';
}

function isFunction(val) {
  return typeof(val)==='function';
}

function isArray(val) {
  return Array.isArray(val);
}

function isObject(val) {
  return typeof(val)==='object';
}

function tryJSON(val) {
  var json;

  try {
    json = JSON.parse(val);
  } catch(e) {
    json = val;
  }
  return json;
}

function tryDate(val) {
  var date;
  date = new Date(val);

  if (date.getYear()===70 && date.getMonth()===0 && date.getDate()===1) {
    date = val;
  }

  return date;
}

var Websql = function(config) {
  this._db = openDatabase(config.name, config.version, config.displayname, config.size);
};

Websql.prototype = {

  query: function(sql, callback) {
    this._db.transaction(function(tx) {
      tx.executeSql(sql, [], function(tx, result) {
        if (isFunction(callback)) callback(tx, result);
      }, function(tx, error) {
        if (isFunction(callback)) callback(tx, null, error);
      });
    });
  },

  createTable: function(struct) {
    var self = this,
        query = 'CREATE TABLE '+struct.name+' (',
        fields = ['id INTEGER PRIMARY KEY AUTOINCREMENT', 'created_at REAL', 'updated_at REAL'];

    for (var field in struct.fields) {
      if (struct.fields.hasOwnProperty(field)) {
        var type = struct.fields[field];
        if (type==='json') type = 'text';
        else if (type==='date') type = 'real';
        fields.push(field+' '+type.toUpperCase());
      }
    }

    query += (fields.join(', ')) + ')';

    this.query(query, function(tx, result) {
      struct.index.map(function(index) {
        var keys = Object.keys(index),
            indexes = [],
            q = index.fields.join('')+' ON '+struct.name+' ('+index.fields.join(', ')+')';
        keys.map(function(key) {
          if (key!=='fields')
            indexes.push(key);
        });
        q = 'CREATE '+indexes.join(' ').toUpperCase()+' INDEX '+q;
        self.query(q);
      });
    });

  },

  all: function(table, callback) {
    this.query('SELECT * FROM '+table, function(tx, result) {
      var rows = [];
      for(var i = 0; i < result.rows.length; i++) {
        var item = result.rows.item(i);

        for (var key in item) {
          if (item.hasOwnProperty(key)) {
            if (isString(item[key])) {
              item[key] = tryJSON(item[key]);
            } else if (isNumber(item[key])) {
              item[key] = tryDate(item[key]);
            }
          }
        }

        rows.push(item);
      }

      if (isFunction(callback)) callback(rows);
    });
  },

  insert: function(table, data, callback) {
    //if (!isArray(data)) data = [data];
    var created = new Date().getTime(),
        keys = ['created_at', 'updated_at'].concat(Object.keys(data)),
        vals = [ created, created ];

    keys.map(function(key) {
      var val = data[key];
      if (!val) return;
      if (isObject(val)) {
        if (val instanceof(Date)) {
          val = val.getTime();
        } else {
          val = JSON.stringify(val);
        }
      }

      if (isString(val)) val = "'"+val+"'";
      vals.push(val);
    });

    var query = 'INSERT INTO '+table+' ('+keys.join(', ')+') VALUES ('+vals.join(', ')+')';
    this.query(query, function(tx, res, error) {
      var id = res ? res.insertId : null;
      if (isFunction(callback)) callback(id, error);
    });
  }

};

var sqlitejs = {

  _cache: {},

  openDatabase: function(config) {
    if (!this._cache[config.name]) {
      this._cache[config.name] = new Websql(config);
    }

    return this._cache[config.name];
  }
};
return sqlitejs;
}));