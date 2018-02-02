load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_http.js');
load('api_adc.js');
load('api_esp32.js');


let led = Cfg.get('pins.led');       					// Dev board LED 
let button = Cfg.get('pins.button'); 					// Dev board button (0)
let topic = 'mosTesting';            					// Subscription topic in AWS IoT

let topicFire = 'mos/topic2';

let STEP_YELLOW = 12;    								// To stepper motor yellow
let STEP_ORANGE = 14;    								// To stepper motor orange
let STEP_RED = 27;       								// To stepper motor red
let STEP_BROWN = 26;     								// To stepper motor brown
let BEAM_SENSOR = 16;    								// beam break sensor input
let PILL_BUTTON = 17;    								// Pill dispenser button input
let RESET_BUTTON = 5;    								// Reset button input
let ADC_PIN = 34;
print("adc enabled? ",ADC.enable(ADC_PIN));

let RESET_DELAY = 17;									//Reset button debounce delay
let PILL_DELAY  = 19;									//Pill dispense button debounce delay
let resetTime = 0;										//Initialize reset time for debounce
let dispenseTime = 0;									//Initialize reset time for debounce
let daysLeft = 20;                     //Initialize how many days are left
let delay = 0;                        //trial for reset function

GPIO.set_mode(led, GPIO.MODE_OUTPUT);  					// Dev board LED 
GPIO.set_mode(STEP_YELLOW,GPIO.MODE_OUTPUT);    		// To stepper motor yellow
GPIO.set_mode(STEP_ORANGE, GPIO.MODE_OUTPUT);    		// To stepper motor orange
GPIO.set_mode(STEP_RED, GPIO.MODE_OUTPUT);       		// To stepper motor red
GPIO.set_mode(STEP_BROWN, GPIO.MODE_OUTPUT);     		// To stepper motor brown
GPIO.set_mode(BEAM_SENSOR,GPIO.MODE_INPUT);      		// beam break sensor input
GPIO.set_mode(PILL_BUTTON,GPIO.MODE_INPUT);      		// Pill dispenser button input
GPIO.set_mode(RESET_BUTTON,GPIO.MODE_INPUT);     		// Reset button input

// Build the JSON body that is sent to AWS for a pill dispensed
let getJSONPILL = function() {
  return JSON.stringify({
    'Time Dispensed':  Timer.now(),
    'Pill Dispensed?': 'Yes',
    'Days Left of Medicaton: ': daysLeft
  });
};

// Called by a press of the pill dispenser button 
GPIO.set_button_handler(PILL_BUTTON, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
	if(Timer.now() > dispenseTime + PILL_DELAY){        //Debounce button
		dispenseTime = Timer.now();						//Set debounce time
		daysLeft = daysLeft - 1;
		let message = getJSONPILL();						//Fetch json table to send
		let ok = MQTT.pub(topic, message, 1);			//Publish to AWS
		print('Published:', ok, topic, '->', message); 	//Print confirmation

	  // Rotate pill dispenser one slot (eject 1 pill)
	  let currentStep = 0;
	  let stepTotal = 765;
	  print('---BUTTON PRESSED---');
		for(let i=0; i<stepTotal; i++){
		  if (currentStep === 0){
			GPIO.write(STEP_YELLOW,1);
			GPIO.write(STEP_ORANGE,0);
			GPIO.write(STEP_RED,0);
			GPIO.write(STEP_BROWN,1);
		  } else if (currentStep === 1) {
			GPIO.write(STEP_YELLOW,0);
			GPIO.write(STEP_ORANGE,0);
			GPIO.write(STEP_RED,1);
			GPIO.write(STEP_BROWN,1);
		  } else if (currentStep === 2) {
			GPIO.write(STEP_YELLOW,0);
			GPIO.write(STEP_ORANGE,1);
			GPIO.write(STEP_RED,1);
			GPIO.write(STEP_BROWN,0);
		  } else {
			GPIO.write(STEP_YELLOW,1);
			GPIO.write(STEP_ORANGE,1);
			GPIO.write(STEP_RED,0);
			GPIO.write(STEP_BROWN,0);
		  }
		  currentStep = (++currentStep)%4;
		  
		  let time_start = Sys.uptime();
		  while( (Sys.uptime() - time_start) < 0.002); 	//wait for 2 milliseconds 
		}

		GPIO.write(STEP_YELLOW,0);
		GPIO.write(STEP_ORANGE,0);
		GPIO.write(STEP_RED,0);
		GPIO.write(STEP_BROWN,0);
		
		print("Medication has been dispensed.");
    }
	else{
		print("Bounced");
	}
}, null);

// Build the JSON body that is sent to AWS for a pill dispensed
let getJSONRESET = function() {
  return JSON.stringify({
    'Time Reset':  Timer.now(),
    'Days Left of Medicaton: ': daysLeft
  });
};


// Called by a press of the reset button 
GPIO.set_button_handler(RESET_BUTTON, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
	if(Timer.now() > resetTime + RESET_DELAY){			//Debounce button
	  resetTime = Timer.now();						//Set debounce time	
	  delay = Timer.now();
	  daysLeft = 20;
	  let message = getJSONRESET();						//Fetch json table to send
		let ok = MQTT.pub(topic, message, 1);			//Publish to AWS
		print('Published:', ok, topic, '->', message); 	//Print confirmation
		let currentStepR = 0;							//Initialize motor steps
	  
	    // Rotate pill dispenser back to starting place
	  print('---RESET BUTTON PRESSED---');
		while(GPIO.read(BEAM_SENSOR) === 0 && Timer.now() - delay < 28.0){
		  if (currentStepR === 0){
			GPIO.write(STEP_YELLOW,1);
			GPIO.write(STEP_ORANGE,0);
			GPIO.write(STEP_RED,0);
			GPIO.write(STEP_BROWN,1);
		  } else if (currentStepR === 1) {
			GPIO.write(STEP_YELLOW,1);
			GPIO.write(STEP_ORANGE,1);
			GPIO.write(STEP_RED,0);
			GPIO.write(STEP_BROWN,0);
		  } else if (currentStepR === 2) {
			GPIO.write(STEP_YELLOW,0);
			GPIO.write(STEP_ORANGE,1);
			GPIO.write(STEP_RED,1);
			GPIO.write(STEP_BROWN,0);
		  } else {
			GPIO.write(STEP_YELLOW,0);
			GPIO.write(STEP_ORANGE,0);
			GPIO.write(STEP_RED,1);
			GPIO.write(STEP_BROWN,1);
		  }
		  currentStepR = (++currentStepR)%4;
		  
		  let time_start = Sys.uptime();
		  while( (Sys.uptime() - time_start) < 0.002); // wait for 2 milliseconds 
		}

		GPIO.write(STEP_YELLOW,0);
		GPIO.write(STEP_ORANGE,0);
		GPIO.write(STEP_RED,0);
		GPIO.write(STEP_BROWN,0);
		print("Position reset.");
		delay = Timer.now();
	}
	else{
		print("BouncedR");
	}
}, null);



Timer.set(60000 /*60 seconds*/, true /*repeat*/, function(){
  
  print('Smoke sensor reading: ', ADC.read(ADC_PIN));
  if(ADC.read(ADC_PIN) > 500){ 
    alertFire();
  }
  
}, null);

let alertFire = function() {
  //getTimestamp();
  let fireAlert = JSON.stringify({
    'ADCValue': ADC.read(ADC_PIN),
    'TimeSensed': Timer.now(),
    'Tempterature': ESP32.temp(),
    'FireAlert' : "True"
  });
  let ok = MQTT.pub(topicFire, fireAlert, 1);
  print('Published:', ok, topicFire, '->',fireAlert);
  return 1;
};




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

