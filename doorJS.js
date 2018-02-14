load('api_mqtt.js');
load('api_gpio.js');
load('api_sys.js');
load('api_timer.js');

let pin = 0, topic = 'my/topic';
GPIO.set_mode(5, GPIO.MODE_INPUT);
let sensor_state = 0;
 let getMotion = function() {
  return JSON.stringify({
    'DoorOpen' : "YES",
    'TimeOpened' : Timer.now()
  });
};
Timer.set(80000,0,function(){
  Timer.set(2000, 1, function() {
  if(GPIO.read(5)){
    // let msg2 = {total_ram: "Javascript checking in", free_ram: Sys.free_ram()};
    // MQTT.pub(topic, JSON.stringify(msg2), 1);
    print("Door is OPEN");
    if ( sensor_state === 0 ) {
        let message1 = getMotion();
        let ok1 = MQTT.pub(topic, message1, 1);
        print('Published:', ok1, topic, '->', message1);
      sensor_state = 1;
    }
    // let msg = {total_ram: "Javascript checking in", free_ram: Sys.free_ram()};
    // MQTT.pub(topic, JSON.stringify(msg), 1);
  } 
  else {
      print("Door is CLOSED");
      if ( sensor_state === 1 ) {
        sensor_state = 0;
      }
  }
  
}, null );
},null);



GPIO.set_button_handler(0, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
    let msg = {total_ram: "Javascript checking in", free_ram: Sys.free_ram()};
    MQTT.pub(topic, JSON.stringify(msg), 1);
}, null);

MQTT.sub(topic, function(conn, topic, msg) {
  print('Topic:', topic, 'message:', msg);
}, null);


// //JS VERSION OF DOOR SENSOR CODE 
// load('api_config.js');
// load('api_gpio.js');
// load('api_mqtt.js');
// load('api_net.js');
// load('api_sys.js');
// load('api_timer.js');
// load('api_adc.js');
// load('api_http.js');
// load('api_esp32.js');


// //LED Status Lights
// let SENSOR = 13; 
// let topic = 'mos/door1';

// let i = 0;
// let amountSent = 1;

// GPIO.set_mode(RED_LED, GPIO.MODE_OUTPUT);
// GPIO.set_mode(GRN_LED, GPIO.MODE_OUTPUT);
// GPIO.set_pull(SENSOR, GPIO.PULL_UP);
// GPIO.set_mode(SENSOR, GPIO.MODE_INPUT); // Pin5 has a fixed pullup resistor


// // let getMotion = function() {
// //   //getTimestamp();
// //   return JSON.stringify({
// //     'DoorOpen' : "YES",
// //     'TimeOpened' : Timer.now()
// //   });
// // };


// let getMotion5 = function() {
//   //getTimestamp();
//   return JSON.stringify(doorSensed);
// };

 
// let doorSensed = {
// 	'DoorOpen' : "YES",
//   'TimeOpened' : ['0','0','0','0','0','0','0','0','0','0']
// };


// GPIO.set_button_handler(SENSOR, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
//   let message1 = getMotion5();
//         let ok = MQTT.pub(topic, message1, 1);
//         print('Published:', ok, topic, '->', message1);
// }, null);


// // Store door state so we can detect change
// let sensor_state = 0;
// // Primary loop run every 1 second looking for a door state change
// Timer.set(2000, 1, function() {
//   let value = GPIO.read(SENSOR); 

//   if (value) { 
//     print("Door is OPEN");
//     let message1 = getMotion5();
//         let ok = MQTT.pub(topic, message1, 1);
//         print('Published:', ok, topic, '->', message1);
//     // GPIO.write(RED_LED, 0);
//     // GPIO.write(GRN_LED, 1);
//     if ( sensor_state === 0 ) {
//       doorSensed.TimeOpened[i] = Timer.now();
//       print(getMotion5());
//       i++;
//       sensor_state = 1;
//       if(i>(amountSent-1)){
//         let message1 = getMotion5();
//         let ok = MQTT.pub(topic, message1, 1);
//         print('Published:', ok, topic, '->', message1);
//         i = 0;
//       }
//     }
//   } else {
//     print("Door is CLOSED");
//     // GPIO.write(RED_LED, 1);
//     // GPIO.write(GRN_LED, 0);
//     if ( sensor_state === 1 ) {
//       sensor_state = 0;
//     }
//   }
// }, null);