#include "mgos.h"
#include "rom/rtc.h"
#include "driver/rtc_io.h"
#include "esp_sleep.h"
#include "mgos_mqtt.h"


//  DEEP SLEEP HELPER FUNCTION: 
//  
static void gotosleep(int pin, void *arg){
  esp_sleep_enable_ext0_wakeup(pin, 1);		// 1== HIGH (Sensor Open)

  printf("All done.  Going to sleep in ");
  for(int i=5; i>0; --i){
    printf("%d...\n", i);
    sleep(2);
  }
  printf("Good night.\n");

  esp_deep_sleep_start();
}
//
//Function to publish to amazon on button push
static void button_cb(int pin, void *arg) {
  char topic[100], message[100];
  struct json_out out = JSON_OUT_BUF(message, sizeof(message));
  snprintf(topic, sizeof(topic), "/devices/%s/events",
           mgos_sys_config_get_device_id());
  json_printf(&out, "{total_ram: %lu, free_ram: %lu}",
              (unsigned long) mgos_get_heap_size(),
              (unsigned long) mgos_get_free_heap_size());
  bool res = mgos_mqtt_pub(topic, message, strlen(message), 1, false);
  LOG(LL_INFO, ("Pin: %d, published: %s", pin, res ? "yes" : "no"));
  (void) arg;
}





//  HELPER FUNCTION: Decode the reason for resetting. 
//  Refer to:
//    https://github.com/espressif/arduino-esp32/blob/master/libraries/ESP32/examples/ResetReason/ResetReason.ino
//    https://github.com/espressif/esp-idf/blob/master/components/esp32/include/rom/rtc.h
//
void why_reset(){
  int reset_reason = rtc_get_reset_reason(0); 
  printf("Reset Reason (%d): ", reset_reason);

  switch (reset_reason) {
    case 1  : printf("Vbat power on reset");break;
    case 3  : printf("Software reset digital core");break;
    case 4  : printf("Legacy watch dog reset digital core");break;
    case 5  : printf("Deep Sleep reset digital core");break;
    case 6  : printf("Reset by SLC module, reset digital core");break;
    case 7  : printf("Timer Group0 Watch dog reset digital core");break;
    case 8  : printf("Timer Group1 Watch dog reset digital core");break;
    case 9  : printf("RTC Watch dog Reset digital core");break;
    case 10 : printf("Instrusion tested to reset CPU");break;
    case 11 : printf("Time Group reset CPU");break;
    case 12 : printf("Software reset CPU");break;
    case 13 : printf("RTC Watch dog Reset CPU");break;
    case 14 : printf("for APP CPU, reseted by PRO CPU");break;
    case 15 : printf("Reset when the vdd voltage is not stable");break;
    case 16 : printf("RTC Watch dog reset digital core and rtc module");break;
    default : printf("NO_MEAN");
  }  
  printf("\n");
}

//  HELPER FUNCTION: Decode our reason for waking.
//
void why_wake(){
  int wake_cause = esp_sleep_get_wakeup_cause();
  printf("Wake Cause (%d): ", wake_cause);
  switch (wake_cause) {
    case 1  : printf("Wakeup caused by external signal using RTC_IO");
    case 2  : printf("Wakeup caused by external signal using RTC_CNTL");
    case 3  : printf("Wakeup caused by timer");
    case 4  : printf("Wakeup caused by touchpad");
    case 5  : printf("Wakeup caused by ULP program");
    default : printf("Undefined.  In case of deep sleep, reset was not caused by exit from deep sleep.");
  } 
  printf("\n");
}

// Read the sensor via timer
//
static void sensor_timer_cb(void *arg){
  if(mgos_gpio_read(13)){
    printf("Door is Open!\n");
    mgos_gpio_write(17,1);
  } else {
    printf("Door is closed, going to sleep.\n");
    mgos_gpio_write(17,0);
    gotosleep(13, NULL);
  }
}

enum mgos_app_init_result mgos_app_init(void) {
  printf("-------------- STARTING APPLICATION -------------\n");
  why_reset();
  why_wake();

  int pin = 13;
  rtc_gpio_deinit(pin);
  mgos_gpio_set_mode(pin, MGOS_GPIO_MODE_INPUT);
  mgos_gpio_set_pull(pin, MGOS_GPIO_PULL_UP);
  
  mgos_gpio_set_mode(17, MGOS_GPIO_MODE_OUTPUT);
 
  int button = 22;
  mgos_gpio_set_mode(button, MGOS_GPIO_MODE_OUTPUT);
  mgos_gpio_set_pull(pin, MGOS_GPIO_PULL_UP);
  
  printf("MGOS GPIO13 read: %d\n", mgos_gpio_read(13));
  printf("RTC GPIO13 read: %d\n", rtc_gpio_get_level(13));

  mgos_set_timer(2000, MGOS_TIMER_REPEAT, sensor_timer_cb, NULL);
  
   /* Publish to MQTT on button press */
  mgos_gpio_set_button_handler(button,
                               MGOS_GPIO_PULL_UP, MGOS_GPIO_INT_EDGE_NEG, 200,
                               button_cb, NULL);

  return MGOS_APP_INIT_SUCCESS;
}
