#!/bin/bash
while true; do
  curl -s -X POST http://127.0.0.1:3100/api/agents/claw-dantas/heartbeat -H "Authorization: Bearer ocs_7iiJ3o0b0iCfujff1f3od-uMmk873sED" -H "Content-Type: application/json" -d '{"status":"online","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > /dev/null 2>&1
  curl -s -X POST http://127.0.0.1:3100/api/agents/axxion/heartbeat -H "Authorization: Bearer ocs_l2gr-CJCoVQFAC5HlEPIgY--1_n4S80v" -H "Content-Type: application/json" -d '{"status":"online","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > /dev/null 2>&1
  curl -s -X POST http://127.0.0.1:3100/api/agents/wrexham/heartbeat -H "Authorization: Bearer ocs_AYy_7TSGO23kYeV9jnnfxKgba6l0rnp1" -H "Content-Type: application/json" -d '{"status":"online","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > /dev/null 2>&1
  sleep 60
done
