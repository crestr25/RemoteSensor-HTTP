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
  console.log(payload.status)
  if(payload.status == "alarm"){
    console.log("alarma");
  }else{
    request({
      url : "http://localhost:8080/api/user/crestr25/sensor/DHT/" + payload.name,
      method: "POST",
      json : payload

    }, function(err, response, body) {
      console.log("body: ", body)
    })
  }
});

function timer(variable, sensor = null, user = null, dp_timer = null){
  var timer = {
    user : user,
    sensor : sensor,
    variable : variable,
    dp_timer : dp_timer,
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
      if(user){
        e.cb(this.user, this.sensor, this.variable, this.dp_timer);
      }
      else {
        e.cb(this.variable);
      }
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

function requestServerInfo(user, sensor, variable, timer){
  url = "http://localhost:8080/api/user/" + user + "/sensor/" + sensor + "/" + variable
  request({
    url : url,
    method: "GET"
  }, function(err, response, body) {
    if(err){}
    else {
      if(response.statusCode == 200){
        var var_response = JSON.parse(body);
        console.log(variable + ": High - " + var_response.trigger[1] + " Low - " + var_response.trigger[0])
        var hardware_requests = {
          function:"set"
        }
        hardware_requests[variable] = [var_response.trigger[0], var_response.trigger[1]]
        console.log(timer.iv)
        timer.set_interval(var_response.poll)
        port.write(JSON.stringify(hardware_requests))
      }
    }
  })
}

function requestHardwareRead(variable){
  console.log("here!");
    var hardware_requests = {
      function : "read",
      variable : variable
    }
    port.write(JSON.stringify(hardware_requests))
}

var humidity_hardware_pool = new timer('humidity')
humidity_hardware_pool.start(requestHardwareRead, 5000, false)

var humidity_server_pool = new timer('humidity', 'DHT', 'crestr25', humidity_hardware_pool)
humidity_server_pool.start(requestServerInfo, 15000, false)

var temperature_hardware_pool = new timer('temperature')
temperature_hardware_pool.start(requestHardwareRead, 5000, false)

var temperature_server_pool = new timer('temperature', 'DHT', 'crestr25', temperature_hardware_pool)
temperature_server_pool.start(requestServerInfo, 15000, false)
