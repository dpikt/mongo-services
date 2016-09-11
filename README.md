# mongo-services
*Creates services using a provided model and mongoose connection, and exposes them via RESTful API. Built on top of Express.*

A tool for rapidly prototyping APIs. Inspired by the [Feathers](https://github.com/feathersjs/feathers) service design.


## How to use
***

####Start by establishing a mongoose connection
```
var app = require('express')();
app.db = require('mongoose').connect('mongodb://localhost/test');
var services = require('mongo-services')(app);
```

#### Initialize services by providing a model

```
services.add('messages', new Schema({
  text: String
}));
````

####Then access them from anywhere in your app using app.service():
 
```
app.service('messages').find({}, function(err, messages) {
  if (!err) console.log(messages);
});
```

####The following service methods are available:
- create
- get
- find
- update
- delete
- save

####Automatically set up a RESTful API:
```
services.configureREST();
```
Which adds the following routes:

- `POST /messages` (create)
- `GET /messages/id` (get)
- `GET /messages/` (find)
- `PUT /messages/id` (update)
- `DELETE /messages/id` (delete)

## Full example
***

```
var express = require('express'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var app = express();

// Set mongoose connection to app.db
app.db = mongoose.connect('mongodb://localhost/test');

// Initialize services
var services = require('mongo-services')(app);

var messageSchema = new Schema({
  text: {type: String, required: true}
});

// Add service with name and schema
services.add('messages', messageSchema);

// Consider keeping schemas in a separate folder for organization
services.add('users', require('./models/user.model.js'));

// Access services for anywhere using app.service()
app.service('messages').create({text: "hi"}, function(err, message) {
  if (!err) console.log(message);
});

// If you want, set up REST endpoints for services
services.configureREST();

// Start!
app.listen(5000);

console.log('Howdy! There\'s a server running at http://localhost:5000');
```

## Notes
***
mongo-services does not (yet) support:

- Before/after hooks
- Pagination
- User authentication/authorization

