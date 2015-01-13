var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName : 'users',
  hasTimestamps: true,
  initialize : function(){
    this.on('add', function(model, attrs, options){

      var salt = bcrypt.genSalt(10, function(err, res){
        model.set('salt', res).save();
      });
      var hash = bcrypt.hash(model.get('password'), salt, model.progress, function(err, res){
        model.set('password', res).save();
      });

    });


  },
  progress: function(){
    // console.log("this is still working on it");
  }
});

module.exports = User;
