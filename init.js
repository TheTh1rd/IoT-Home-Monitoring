load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_adc.js');
load('api_i2c.js'); 
load('api_http.js');
load('api_esp32.js');

let led = Cfg.get('pins.led');
let button = Cfg.get('pins.button');
let topic = 'mos/topic1';
let topicFire = 'mos/topic2';
let timeSent = 0;
let motionDetected = 0;




print('LED GPIO:', led, 'button GPIO:', button);

GPIO.set_mode(27, GPIO.MODE_INPUT);
GPIO.set_mode(16, GPIO.MODE_INPUT);
GPIO.set_mode(12, GPIO.MODE_INPUT);
GPIO.set_mode(14, GPIO.MODE_INPUT);
GPIO.set_mode(21, GPIO.MODE_OUTPUT);
GPIO.set_mode(22, GPIO.MODE_OUTPUT);
print("adc enabled? ",ADC.enable(34));


// // Get timestamp via HTTP request
// let theTime = "";
// let getTimestamp = function() {
//   let timestamp = HTTP.query({
//   url: 'https://google.com/',
//   success: function(body, full_http_msg) {
//     // Extract time and date from HTTP response
//     let timestamp = '';
//     timestamp += full.slice(118,138);
//     //set global var
//     theTime = timestamp;
//     },
//     error: function(err) { return err; }  // Optional
//   });
// };


let getMotion = function() {
  motionDetected = motionDetected + 1;
  //getTimestamp();
  return JSON.stringify({
    'ADCValue': ADC.read(34),
    //'TimeSensed': theTime,
    'Tempterature': ESP32.temp(),
    'TotalDetections' : motionDetected,
    'TimeSensed' : Timer.now()
  });
};

let alertFire = function() {
  //getTimestamp();
  let fireAlert = JSON.stringify({
    'ADCValue': ADC.read(34),
    //'TimeSensed': theTime,
    'TimeSensed': Timer.now(),
    'Tempterature': ESP32.temp(),
    'FireAlert' : "True"
  });
  let ok = MQTT.pub(topicFire, fireAlert, 1);
  print('Published:', ok, topicFire, '->',fireAlert);
  return 1;
};


let getInfo = function() {
  return JSON.stringify({
    uptime: Sys.uptime(),
    free_ram: Sys.free_ram()
  });
};


//PIR TRIGGERED
GPIO.set_button_handler(27, GPIO.PULL_DOWN,GPIO.INT_LEVEL_HI, 3000,function(){
  print('Published:','->', timeSent);
  if((Sys.uptime())>timeSent+10){
    timeSent = Sys.uptime();
    let message4 = getMotion();
    let ok = MQTT.pub(topic, message4, 1);
    print('Published:', ok, topic, '->', message4); 
  }
}, null);


///PUSH BUTTON TRIGGERED
GPIO.set_button_handler(16, GPIO.PULL_UP,GPIO.INT_LEVEL_LO, 500, function(){
  print('Published:','->', timeSent);
  if((Sys.uptime())>timeSent+2){
    timeSent = Sys.uptime();
    let message3 = getMotion();
    let ok = MQTT.pub(topic, message3, 1);
    print('Published:','->', timeSent);
    print("++++++++++++CONNECTED+++++++++++++++++++");
    print('Published:', ok, topic, '->', message3); 
  }
}, null);


//TIMER
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
Timer.set(10000 /* 1 sec */, true /* repeat */, function() {
  //let value = GPIO.toggle(led);
  //GPIO.toggle(21);
  //GPIO.toggle(22);
  print("adc value: ",ADC.read(34));
  if(ADC.read(34) > 2000){
    print("fire alerted: ", alertFire());
  }
  print("Temperature: ", ESP32.temp());
  print("Time:", Timer.now());
}, null);

// Publish to MQTT topic on a button press. Button is wired to GPIO pin 0
GPIO.set_button_handler(button, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
  let message2 = getInfo();
  let ok = MQTT.pub(topic, message2, 1, true);
  print('Published:', ok, topic, '->', message2);
}, null);

// Monitor network connectivity.
Net.setStatusEventHandler(function(ev, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);
