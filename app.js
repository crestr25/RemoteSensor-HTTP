var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyACM0',{
  baudRate : 115200,
  parser: SerialPort.parsers.readline('\n')
});
var request = require('request');

port.on('open', function(){
  console.log("SerialPort open!")
});

port.on('data', function (data) {
  payload = JSON.parse(data)
  request({
    url : "http://localhost:8080/api/example",
    method: "POST",
    json : payload
  }, function(err, response, body) {
    console.log("body: ", body)
  })
});

setInterval(function(){
  var hardware_requests = {
    function:"read"
  }
  port.write(JSON.stringify(hardware_requests))
}, 20000);
