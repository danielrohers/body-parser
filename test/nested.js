
// var assert = require('assert')
var http = require('http')
var request = require('supertest')

var bodyParser = require('..')

describe('bodyParser.nested()', function () {
  it('should parse x-www-form-urlencoded', function (done) {
    request(createServer(bodyParser.urlencoded()))
    .post('/')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send('user.name=tobi')
    .expect(200, '{"user":{"name":"tobi"}}', done)
  })

  it('should parse JSON', function (done) {
    request(createServer(bodyParser.json()))
    .post('/')
    .set('Content-Type', 'application/json')
    .send('{"user.name":"tobi"}')
    .expect(200, '{"user":{"name":"tobi"}}', done)
  })

  it('should parse application/octet-stream', function (done) {
    var server = createServer(bodyParser.raw(), function (req, res, end) {
      if (Buffer.isBuffer(req.body)) {
        res.end('buf:' + req.body.toString('hex'))
        return
      }
      res.end(JSON.stringify(req.body))
    })
    request(server)
    .post('/')
    .set('Content-Type', 'application/octet-stream')
    .send('the user is tobi')
    .expect(200, 'buf:746865207573657220697320746f6269', done)
  })

  it('should parse text/plain', function (done) {
    request(createServer(bodyParser.text()))
    .post('/')
    .set('Content-Type', 'text/plain')
    .send('user is tobi')
    .expect(200, '"user is tobi"', done)
  })
})

function createServer (opts, cb) {
  var _bodyParser = typeof opts !== 'function' ? bodyParser.json(opts) : opts
  var _nested = bodyParser.nested()

  return http.createServer(function (req, res) {
    _bodyParser(req, res, function (err) {
      res.statusCode = err ? (err.status || 500) : 200
      if (err) return res.end(err.message)
      _nested(req, res, function (err) {
        res.statusCode = err ? (err.status || 500) : 200
        if (cb) return cb(req, res)
        res.end(err ? err.message : JSON.stringify(req.body))
      })
    })
  })
}
