# Estacao de Monitoramento IoT

Projeto da disciplina de Internet das Coisas para monitoramento de temperatura, umidade e qualidade do ar com ESP32, DHT11, MQ-135 e MQTT.

## Estrutura

- `web/`: dashboard estatico com Paho MQTT via WebSockets.
- `firmware/estacao_monitoramento.ino`: firmware para Arduino IDE e ESP32.
- `mosquitto/mosquitto.conf`: portas MQTT e WebSockets, acesso local e log permanente.
- `mosquitto/mosquitto.log`: exemplo de log para substituir pelo log real do teste.

## Configuracao rapida

1. Edite `WIFI_SSID`, `WIFI_PASSWORD` e `MQTT_HOST` no arquivo `.ino`.
2. Instale as bibliotecas `DHT sensor library` e `PubSubClient` na Arduino IDE.
3. Inicie o Mosquitto usando `mosquitto/mosquitto.conf`.
4. Abra `web/index.html` por um servidor HTTP local: `python3 -m http.server 8080 --directory web`.
5. No dashboard, abra **Configuracoes**, informe o host do broker e salve a senha do grupo.

O broker deve aceitar MQTT na porta 1883 e WebSockets na porta 9001. Os topicos sao:

```text
aulas/professor/temperatura
aulas/professor/umidade
aulas/professor/qualidade_ar
```

## Evidencias

- Print do dashboard ao vivo com o banner inferior.
- Print do `localStorage` com `iotGrupoSenha` e `iotDashboardConfig`.
- Log real do Mosquitto substituindo `mosquitto/mosquitto.log`.
- Video curto mostrando valores e LEDs respondendo aos limites.

Edite nomes dos integrantes e numero do grupo no objeto `PROJECT_CONFIG` em `web/index.js`.
