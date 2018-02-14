load('api_mqtt.js');
load('api_gpio.js');
load('api_sys.js');
load('api_timer.js');

let pin = 0, topic = 'mos/derp1';
GPIO.set_mode(5, GPIO.MODE_INPUT);
let sensor_state = 0;
 let getMotion = function() {
  return JSON.stringify({
    'DoorOpen' : "YES",
    'TimeOpened' : Timer.now()
  });
};
Timer.set(8000,0,function(){
  Timer.set(2000, 1, function() {
  if(GPIO.read(5)){
    print("Door is OPEN");
    if ( sensor_state === 0 ) {
        let message1 = getMotion();
        let ok1 = MQTT.pub(topic, message1, 1);
        print('Published:', ok1, topic, '->', message1);
      sensor_state = 1;
    }
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
