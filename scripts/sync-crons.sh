#!/bin/bash
cd /root/openclaw-dashboard
DATABASE_URL="file:./dev.db" /usr/bin/node /root/openclaw-dashboard/scripts/dashboard-sync.js
