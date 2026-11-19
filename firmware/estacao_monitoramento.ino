#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

const char* WIFI_SSID = "SUA_REDE_WIFI";
const char* WIFI_PASSWORD = "SUA_SENHA_WIFI";
const char* MQTT_HOST = "192.168.1.100";
const uint16_t MQTT_PORT = 1883;

#define DHT_PIN 14
#define DHT_TYPE DHT11
#define MQ135_PIN 34
#define LED_TEMPERATURE 25
#define LED_HUMIDITY 26
#define LED_GAS 27

const char* TOPIC_TEMPERATURE = "aulas/professor/temperatura";
const char* TOPIC_HUMIDITY = "aulas/professor/umidade";
const char* TOPIC_AIR = "aulas/professor/qualidade_ar";

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
unsigned long lastReading = 0;

String createClientId() {
  uint64_t chipId = ESP.getEfuseMac();
  return "esp32-estacao-" + String((uint32_t)(chipId >> 32), HEX) + String((uint32_t)chipId, HEX);
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWi-Fi conectado: " + WiFi.localIP().toString());
}

void connectMqtt() {
  while (!mqttClient.connected()) {
    String clientId = createClientId();
    Serial.println("Conectando MQTT como " + clientId);
    if (mqttClient.connect(clientId.c_str())) Serial.println("MQTT conectado");
    else { Serial.print("Falha MQTT, estado: "); Serial.println(mqttClient.state()); delay(2000); }
  }
}

void publishReading(float temperature, float humidity, int airQuality) {
  char temperaturePayload[10], humidityPayload[10], airPayload[10];
  dtostrf(temperature, 1, 1, temperaturePayload);
  dtostrf(humidity, 1, 1, humidityPayload);
  snprintf(airPayload, sizeof(airPayload), "%d", airQuality);
  mqttClient.publish(TOPIC_TEMPERATURE, temperaturePayload, true);
  mqttClient.publish(TOPIC_HUMIDITY, humidityPayload, true);
  mqttClient.publish(TOPIC_AIR, airPayload, true);
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(LED_TEMPERATURE, OUTPUT); pinMode(LED_HUMIDITY, OUTPUT); pinMode(LED_GAS, OUTPUT);
  connectWifi();
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWifi();
  if (!mqttClient.connected()) connectMqtt();
  mqttClient.loop();
  if (millis() - lastReading < 3000) return;
  lastReading = millis();
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  if (isnan(temperature) || isnan(humidity)) { Serial.println("Falha na leitura do DHT11"); return; }
  int airQuality = analogRead(MQ135_PIN);
  digitalWrite(LED_TEMPERATURE, temperature > 28 ? HIGH : LOW);
  digitalWrite(LED_HUMIDITY, humidity > 56 ? HIGH : LOW);
  digitalWrite(LED_GAS, airQuality > 400 ? HIGH : LOW);
  publishReading(temperature, humidity, airQuality);
  Serial.printf("Temperatura: %.1f C | Umidade: %.1f %% | Ar: %d\n", temperature, humidity, airQuality);
}