var express = require('express'),
    // session = require('express-session'),
    // flash = require('connect-flash'),
    // cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    winston = require('winston'),
    // Services:
    UserStore = require('./fakes/userStore'),
    TokenStore = require('./fakes/tokenStore'),
    emailService = require('./fakes/emailService'),
    // Main lib:
    localAuthFactory = require('express-local-auth');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: 'debug' })
    ]
});

var app = express(),
    port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));
// app.set('views', __dirname + '/views');
// app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser());
// TODO: Use proper security settings with HTTPS
// app.use(session({ secret: 'keyboard cat' }));
// app.use(flash());

var services = {
    emailService: emailService,
    userStore: new UserStore(),
    passwordResetTokenStore: new TokenStore(),
    verifyEmailTokenStore: new TokenStore(),
    logger: logger
};

var localAuth = localAuthFactory(app, services, {
    failedLoginsBeforeLockout: 3,
    accountLockedMs: 1000 * 20, // 20 seconds for sample app
    verifyEmail: true,
    useSessions: false,
    autoSendErrors: true
});

// app.use(function(req, res, next) {
//     // Transfer flash state, if present, to locals so views can access:
//     res.locals.errors = (res.locals.errors || []).concat(req.flash('errors'));
//     res.locals.validationErrors = (res.locals.validationErrors || []).concat(req.flash('validationErrors'));
//     res.locals.successMsgs = (res.locals.successMsgs || []).concat(req.flash('successMsgs'));
//     next();
// });

// ------------------------------------------------------------

app.post('/login', localAuth.login(), function(req, res) {
  res.status(200).send({ loggedIn: true });
});

app.post('/logout', localAuth.logout(), function(req, res) {
  res.status(200).send({ logout: 'attempted' });
});

app.post('/register', localAuth.register(), function(req, res) {
  // only reachable if there were no issues registering
  res.status(200).send({ registered: true });
});
app.get('/verifyemail', localAuth.verifyEmailView(), function(req, res) {
  res.status(200).send({ emailVerified: true });
});
app.post('/unregister', localAuth.unregister(), function(req, res) {
  res.status(200).send({ unregistered: true });
});

app.get('/forgotpassword', function(req, res) {
    res.render('forgot_password');
});
app.post('/forgotpassword', localAuth.forgotPassword(), function(req, res) {
    res.render('password_reset_requested', { email: res.locals.email });
});
app.get('/resetpassword', localAuth.resetPasswordView(), function(req, res) {
    res.render('reset_password');
});
app.post('/resetpassword', localAuth.resetPassword(), function(req, res) {
    res.redirect('/login');
});

app.get('/changepassword', function(req, res) {
    res.render('change_password');
});
app.post('/changepassword', localAuth.changePassword(), function(req, res) {
    res.redirect('/home');
});

// ------------------------------------------------------------
// App Specific Routes:

app.get('/', function(req, res) {
    res.redirect('/home');
});

// app.get('/home', localAuth.ensureAuthenticated(), function(req, res) {
//     res.render('home', { user: req.user, newUser: req.param('newUser') });
// });

// ------------------------------------------------------------

app.use(function(err, req, res, next) {
    logger.error(err);
    res.status(500).render('error');
});

app.listen(port);
console.info('Running on port', port);
