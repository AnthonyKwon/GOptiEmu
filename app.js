var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');

const serviceRouter = require('./routes/service');
const apiRouter = require('./routes/api');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//app.use(serviceRouter);
app.use('/v4/', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(403);
  res.send('403 Forbidden');
});

/*
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
*/

module.exports = app;
