var bodyParser = require('body-parser');

var NotFoundError = function () {
  this.name = "NotFoundError",
  this.toString = function () {
    return "Not found.";
  };
}

var handleError = function(err, req, res, next) {
  switch(err.name) {
    case "ValidationError":
      res.status(400);
      break;
    case "NotFoundError":
      res.status(404);
      break;
    default:
      res.status(500);
  }
  res.send(err.toString());
};

function Service(app, name, schema) {
  var self = this;
  self.name = name;
  self.route = "/" + self.name;
  self.schema = schema;
  self.model = app.db.model(self.name, self.schema, self.name);
  self.hooks = [];

  // METHODS
  self.create = function(body, callback) {
    self.model.create(body, function (err, created) {
      callback(err, created);
    });
  };
  self.get = function(body, callback) {
    self.model.findOne(body, function (err, gotten) {
      callback(err, gotten);
    });
  };
  self.find = function(body, callback) {
    self.model.find(body, function (err, found) {
      callback(err, found);
    });
  };
  self.update = function(body, callback) {
    self.model.update(body, function (err, updated) {
      callback(err, updated);
    });
  };
  self.delete = function(body, callback) {
    self.model.remove(body, function (err) {
      callback(err);
    });
  };
  self.save = function(object, callback) {
    object.save(function (err, saved) {
      callback(err, saved);
    });
  };
}

function Services(app) {
  if (!app.db || !app.db.Mongoose) throw Error("Must set app.db to be a Mongoose connection");
  var self = this;
  self.app = app;
  self.serviceDict = {};
  self.app.service = function(name) {
    var service = self.serviceDict[name];
    if (!service) throw Error("No service by the name of " + name);
    return service;
  };
  self.add = function (name, schema) {
    if (!name || typeof(name) != "string") throw Error("Must include name of service (string)");
    if (!schema || typeof(schema) != "object") throw Error("Must include schema for service (Mongoose Schema)");
    self.serviceDict[name] = new Service(app, name, schema);
  };
  self.configureREST = function () {
    self.app.use(bodyParser.urlencoded({ extended: true }));
    self.app.use(bodyParser.json());
    // Set up each service
    var services = Object.keys(self.serviceDict);
    for (var i = 0; i < services.length; i++) {
      var service = self.serviceDict[services[i]];
      self.configureRESTForService(service);
    }
  };
  self.configureRESTForService = function (service) {
    // GET
    self.app.route(service.route+"/:id")
      .get(function (req, res, next) {
        service.get({_id: req.params.id}, function (err, gotten) {
          if (err) return next(err);
          if (!gotten) return next(new NotFoundError());
          res.json(gotten);
        });
      })
    // UPDATE
      .put(function (req, res, next) {
        // Get
        service.get({_id: req.params.id}, function (err, gotten) {
          if (err) return next(err);
          if (!gotten) return next(new NotFoundError());
          // Update
          var attribs = Object.keys(req.body || {});
          for (var i = 0; i < attribs.length; i++) {
            gotten[attribs[i]] = req.body[attribs[i]];
          };
          //Save
          service.save(gotten, function (err, saved) {
            if (err) return next(err);
            res.json(saved);
          });
        });
      })
    // DELETE
      .delete(function (req, res, next) {
          // Get
          service.get({_id: req.params.id}, function (err, gotten) {
            if (err) return next(err);
            if (!gotten) return next(new NotFoundError());
            // Delete
            service.delete({_id: req.params.id}, function (err) {
              if (err) return next(err);
              res.send("Deleted.");
            });
          });
        })
        .all(handleError);
    // CREATE
    self.app.route(service.route)
      .post(function (req, res, next) {
        service.create(req.body, function (err, created) {
          if (err) return next(err);
          res.send(created);
        });
      })
    // FIND
      .get(function (req, res, next) {
        service.find(req.query, function (err, found) {
          if (err) return next(err);
          res.json(found);
        });
      })
      .all(handleError);
  };
}

module.exports = function (app) {
  return new Services(app);
};
