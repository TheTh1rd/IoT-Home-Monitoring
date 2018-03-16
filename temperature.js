load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_adc.js');
let derp = ADC.enable(34);
let led = Cfg.get('pins.led');
let button = Cfg.get('pins.button');
let topic = 'mos/temperature';

print('LED GPIO:', led, 'button GPIO:', button);

let getInfo = function() {
  return JSON.stringify({
    "Humidity" : (((ADC.read(35))/1000)/60 +0.5)*100,
   "Temperature" : (ADC.read(34)-35)/10,
    "Name" : "Joel",
   "Timestamp" : Timer.now(),
   "userId" : "us-east-2:ca528a9f-f436-47e7-b950-68eced6e1863"
  });
};

// Blink built-in LED every second
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
Timer.set(900000 /* 1 sec */, Timer.REPEAT, function() {
  let temp1 = ADC.read(34);
  let temp = temp1 - 35;
  let realTemp = temp/10;
  print("Temperature: ", realTemp);
  // let value = GPIO.toggle(led);
  // print(value ? 'Tick' : 'Tock', 'uptime:', Sys.uptime(), getInfo());
  let message1 = getInfo();
  let ok = MQTT.pub(topic, message1, 1);
  print('Published:', ok, topic, '->', message1);
}, null);

// Publish to MQTT topic on a button press. Button is wired to GPIO pin 0
GPIO.set_button_handler(button, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
  let message = getInfo();
  let ok = MQTT.pub(topic, message, 1);
  print('Published:', ok, topic, '->', message);
}, null);

// Monitor network connectivity.
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, arg) {
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
