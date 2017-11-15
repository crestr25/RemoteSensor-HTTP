#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <EEPROMVar.h>
#include <EEPROMex.h>

#define DHTPIN 7

DHT dht;
EEPROMClassEx nonV = EEPROMClassEx();

float t_low = nonV.readFloat(0);
float t_high = nonV.readFloat(4);
float h_low = nonV.readFloat(8);
float h_high = nonV.readFloat(12);


long alarm_wd = 0;

void sensorJsonOutput(JsonObject& json, float T, float H){
  json["temperature"] = T;
  json["humidity"] = H;
}

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  dht.setup(DHTPIN);
}

void loop() {
  float temperature = dht.getTemperature();
  float humidity = dht.getHumidity();

  // ::: Requests :::

  if(Serial.available() > 0){
    StaticJsonBuffer<200> jsonBuffer;
    String inp = Serial.readStringUntil('\n');
    JsonObject& req = jsonBuffer.parseObject(inp);
    JsonObject& res = jsonBuffer.createObject();
    if(req.success()){
      char* function;
      function = req["function"];
      res["function"] = String(function);
      if(String(function) == "read"){
        sensorJsonOutput(res ,temperature, humidity);
        res["status"] = "Ok";
      }
      else if(String(function) == "set"){
        if(req.containsKey("humidity")){
          JsonArray& humidity_limits = jsonBuffer.parseArray(req.get<String>("humidity"));
          if (humidity_limits[0] != h_low){
            h_low = humidity_limits[0];
            nonV.writeFloat(0, t_low);
            res["status"] = "h_low C";
          }
          else if(humidity_limits[1] != h_high){
            h_high = humidity_limits[1];
            nonV.writeFloat(4, t_high);
            res["status"] = "h_high C";
          }
          else{
            res["status"] = "Same";
          }
        }
        else if(req.containsKey("temperature")){
          JsonArray& temperature_limits = jsonBuffer.parseArray(req.get<String>("temperature"));
          if(temperature_limits[0] != t_low){
            t_low = temperature_limits[0];
            nonV.writeFloat(8, t_low);
            res["status"] = "t_low C";
          }
          else if(temperature_limits[1] != t_high){
            t_high = temperature_limits[1];
            nonV.writeFloat(12, t_high);
            res["status"] = "t_high C";

        }

      }
    }

      else if(String(function) == "status"){
        JsonArray& humidity_limits = jsonBuffer.createArray();
        JsonArray& temperature_limits = jsonBuffer.createArray();
        humidity_limits.add(h_low);
        humidity_limits.add(h_high);
        temperature_limits.add(t_low);
        temperature_limits.add(t_high);
        res["humidity"] = humidity_limits;
        res["temperature"] = temperature_limits;
      }
      else{
        res["status"] = "No implemented";
      }
      String resString;
      res.printTo(resString);
      Serial.println(resString);
    }
  }

  // ::: Trigger :::

  else{
    StaticJsonBuffer<200> jsonBuffer;
    JsonObject& res = jsonBuffer.createObject();
    JsonArray& alarm = jsonBuffer.createArray();
    bool send = false;
    if(temperature >= t_high){
      alarm.add("TH");
      send = true;
    }
    else if(temperature < t_low){
      alarm.add("TL");
      send = true;
    }

    if(humidity >= h_high){
      alarm.add("HH");
      send = true;
    }
    else if(humidity < h_low){
      alarm.add("HL");
      send = true;
    }

    if(send && millis() - alarm_wd > 10000){
      res["alarm"] = alarm;
      sensorJsonOutput(res ,temperature, humidity);
      res["status"] = "alarm";
      String resString;
      res.printTo(resString);
      Serial.println(resString);
      alarm_wd = millis();
    }
  }
}
