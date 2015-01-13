var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName : 'users',
  hasTimestamps: true,
  initialize : function(){
    this.on('creating', function(model, attrs, options){
      console.log('model is ', model);
      // console.log(model.get('password'));
      // var salt = bcrypt.genSalt(10, function(err, res){
      //   model.set('salt', res);
      // });
      // var hash = bcrypt.hash(model.get('password'), salt, model.progress, function(err, res){
      //   model.set('password', res);
      // });
      //console.log(hash);
      // model.set('password', '1');
      // model.set('salt', '2');
      //console.log("i'm making a new user", model.get('salt'));
    });


  },
  progress: function(){
    console.log("this is still working on it");
  }
});

module.exports = User;
