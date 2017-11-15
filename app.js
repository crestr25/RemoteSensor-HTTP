var SerialPort = require('serialport');
var port = new SerialPort('/dev/tty.usbmodemFA131',{
  baudRate : 115200,
  parser: SerialPort.parsers.readline('\n')
});
var request = require('request');

// ::: url variables :::
var url_variables = [
  "http://localhost:8080/api/user/crestr25/sensor/DHT/humedad",
  "http://localhost:8080/api/user/crestr25/sensor/DHT/temperatura"
]


port.on('open', function(){
  console.log("SerialPort open!")
});

port.on('data', function (data) {
  payload = JSON.parse(data)
  console.log(payload.status)
  request({
    url : "http://localhost:8080/api/example",
    method: "POST",
    json : payload

  }, function(err, response, body) {
    console.log("body: ", body)
  })
});



// setInterval(function(){
//   url_variables.forEach(function(url_variables){
//     request({
//       url : url_variables,
//       method: "GET",
//       //json : payload
//     }, function(err, response, body) {
//       console.log("body: ", body)
//     })
//     var hardware_requests = {
//       function:"set"
//     }
//   })
// },10000)

function timer()
{
    var timer = {
        running: false,
        iv: 5000,
        timeout: false,
        cb : function(){},
        start : function(cb,iv,sd){
            var elm = this;
            clearInterval(this.timeout);
            this.running = true;
            if(cb) this.cb = cb;
            if(iv) this.iv = iv;
            if(sd) elm.execute(elm);
            this.timeout = setTimeout(function(){elm.execute(elm)}, this.iv);
        },
        execute : function(e){
            if(!e.running) return false;
            e.cb();
            e.start();
        },
        stop : function(){
            this.running = false;
        },
        set_interval : function(iv){
            clearInterval(this.timeout);
            this.start(false, iv);
        }
    };
    return timer;
}

// ::: Timer number 1 :::

var timer_1 = new timer();
timer_1.start(function(){
  request({
    url : url_variables[0],
    method: "GET",
    //json : payload
  }, function(err, response, body) {
    var info = JSON.parse(body);
    console.log("Hum: High - " + info.trigger[1] + " Low - " + info.trigger[0])
    var hardware_requests = {
      function:"set",
      humidity: [info.trigger[0], info.trigger[1]]
    }
    port.write(JSON.stringify(hardware_requests))
  })

}, 15000, false);

// ::: Timer number 2 :::


var timer_2 = new timer();

timer_2.start(function(){
  request({
    url : url_variables[1],
    method: "GET",
    //json : payload
  }, function(err, response, body) {
    var info = JSON.parse(body);
    console.log("Temp: High - " + info.trigger[1] + " Low - " + info.trigger[0])
    var hardware_requests = {
      function:"set",
      humidity: [info.trigger[0], info.trigger[1]]
    }
    port.write(JSON.stringify(hardware_requests))
  })

}, 10000, false);

// setInterval(function(){
  // var hardware_requests = {
  //   function:"read"
  // }
//   port.write(JSON.stringify(hardware_requests))
// }, 20000);
