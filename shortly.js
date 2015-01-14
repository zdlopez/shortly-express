var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var passport = require('passport');
var OAuthStrategy = require('passport-oauth').OAuthStrategy;
var GitHubStrategy = require('passport-github').Strategy;

var GITHUB_CLIENT_ID = '6dddcc8d1ef754f86877';
var GITHUB_CLIENT_SECRET = 'c962cfcb72de6d9e3df1a2fc6db26465b79ba712';

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:4568/"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's GitHub profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the GitHub account with a user record in your database,
      // and return that user instead.
      //console.log('user profile', profile);
      var username = profile.username;

      new User({ username: username}).fetch().then(function(found) {
        if (found) {
          console.log('i found you', username);
        } else {
          console.log('you got away this time', username);
        }
      });
      return done(null, profile);
    });
  }
));

var app = express();



app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({secret: 'Ryan and Zach are awesome'}));
app.use(passport.initialize());
app.use(passport.session());

// app.get('/',ensureAuthenticated, function(req, res){
//   res.render('index', { user: req.user });


// function(req, res) {
//   if (util.checkUser(req)) {
//     res.render('index');
//   } else {
//     res.redirect('login');
//   }
// });

app.get('/',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    res.render('index');
  });


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

app.get('/create',ensureAuthenticated, function(req, res){
  res.render('index', { user: req.user });
// function(req, res) {
//   if (util.checkUser(req)) {
//     res.render('index');
//   } else {
//     res.redirect('login');
//   }
});

app.get('/links',ensureAuthenticated, function(req, res){
  Links.reset().fetch().then(function(links) {
  res.send(200, links.models);

  //res.render('index', { user: req.user });
// function(req, res) {
//   if (util.checkUser(req)) {
//     Links.reset().fetch().then(function(links) {
//       res.send(200, links.models);
//     });
//   } else {
//     res.redirect('login');
//   }
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/auth/github',
  passport.authenticate('github'),
  function(req, res) {
    res.render('index');
  });

app.get('/login', function(req, res){
  res.render('loginGithub');
});

app.post('/login',function(req, res){
  res.render('/');
});


app.get('/signup',
function(req, res) {
  res.render('signup');
});

// app.post('/login',
// function(req, res) {
//   var username = req.body.username;
//   var password = req.body.password;

//   new User({ username: username}).fetch().then(function(found) {
//     if (found) {
//       var salt = found.attributes.salt;
//       var dbPassword = found.attributes.password;

//       bcrypt.hash(password, salt, null, function(err, result){
//         if(err){
//           console.log('found error: ', err);
//         } else {
//           if(result === dbPassword){
//             console.log("i found you", username);
//             req.session.regenerate(function(){
//               req.session.user = username;
//               res.redirect('/');
//             });
//           } else {
//             res.redirect('/');
//           }
//         }
//       });
//     } else {
//       // send message invalid username/password
//       res.redirect('/login');
//     }
//   });
// });



app.post('/signup',
function(req, res) {

  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username}).fetch().then(function(found) {
    if (found) {
      // send message user account already exists
      console.log("i found you", username);
      res.redirect('login');
      // res.send(200, found.attributes);
    } else {
      new User({
        username: username,
        password: password
      }).save().then(function(newUser) {
        Users.add(newUser);
        //res.send(200, newUser);
        res.redirect('/');
      }).catch(function(err, success){
        console.log("error in post is ", err);
      });
    }
  });
});

app.get('/logout',
function(req, res) {
    req.logout();
    req.session = null;
    // req.session.destroy(function(){
    //   res.render('loginGithub');
    //   res.end({authenticated: res.authenticated});

    // });
      res.render('loginGithub');

  // req.session.destroy(function() {
  //   // console.log('destroy\'n');
  //   res.redirect('/login');
  // });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
