var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const { devNull } = require('os');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);



let db;

// connect to database
(async () => {
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });
    console.log('Connected to DogWalkService database.');
  } catch (err) {
    console.error('Error connecting to DogWalkService database.', err);
  }
})();

// api/dogs route
app.get('/api/dogs', async (req, res) => {
  try {
    const [dogs] = await db.execute(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d JOIN Users u ON d.owner_id = u.user_id
      `);
      res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve dogs' });
  }
});

// api/walkrequests/open route
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [requests] = await db.execute(`
      SELECT wr.request_id, d.name AS dog_name, wr.requested_time,
              wr.duration_minutes, wr.location, u.username AS owner_username
      FROM WalkRequests wr JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
      `);
      res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to display open walk requests' });
  }
});

// api/walkers/summary route
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [ratings] = await db.execute(`
      SELECT u.username AS walker_username,
        COUNT(r.rating_id) AS total_ratings,
        AVG(r.rating) AS average_rating,
        COUNT(wr.request_id) AS completed_walks
      FROM Users u LEFT JOIN WalkApplications wa ON wa.walker_id = u.user_id
      LEFT JOIN WalkRequests wr ON wa.request_id = wr.request_id AND wr.status = 'completed'
      LEFT JOIN WalkRatings r ON r.walker_id = u.user_id
      WHERE u.role = 'walker'
      GROUP BY u.user_id
      `);
      res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to display walker summaries' });
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
