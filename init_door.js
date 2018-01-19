load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_adc.js');
load('api_http.js');
load('api_esp32.js');


//LED Status Lights
let RED_LED = 16;  
let GRN_LED = 17;
let SENSOR = 5; 

let topic = 'mos/door1';

GPIO.set_mode(RED_LED, GPIO.MODE_OUTPUT);
GPIO.set_mode(GRN_LED, GPIO.MODE_OUTPUT);

GPIO.set_mode(SENSOR, GPIO.MODE_INPUT); // Pin5 has a fixed pullup resistor


let getMotion = function() {
  //getTimestamp();
  return JSON.stringify({
    'DoorOpen' : "YES",
    'TimeOpened' : Timer.now()
  });
};


// Store door state so we can detect change
let sensor_state = 0;
// Primary loop run every 1 second looking for a door state change
Timer.set(1000, 1, function() {
  let value = GPIO.read(SENSOR); 

  if (value) { 
    print("Door is OPEN");
    GPIO.write(RED_LED, 0);
    GPIO.write(GRN_LED, 1);
    if ( sensor_state === 0 ) {
      let message1 = getMotion();
      let ok = MQTT.pub(topic, message1, 1);
      print('Published:', ok, topic, '->', message1);
      sensor_state = 1;
    }
  } else {
    print("Door is CLOSED");
    GPIO.write(RED_LED, 1);
    GPIO.write(GRN_LED, 0);
    if ( sensor_state === 1 ) {
      //MQTT.pub('mos/door', '{"message": "The door is closed.", "default": "", "state": "closed"}');
      sensor_state = 0;
    }
  }
}, null);