#!/bin/bash

# Service and Timer files
SERVICE_FILE="/etc/systemd/system/threaddesk-watchdog.service"
TIMER_FILE="/etc/systemd/system/threaddesk-watchdog.timer"
SCRIPT_PATH="$(pwd)/update_watchdog.sh"

echo "Creating service..."
sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=ThreadDesk Update Watchdog
After=network.target

[Service]
Type=oneshot
ExecStart=/bin/bash $SCRIPT_PATH
User=$USER
WorkingDirectory=$(pwd)

[Install]
WantedBy=multi-user.target
EOF

echo "Creating timer..."
sudo tee $TIMER_FILE > /dev/null <<EOF
[Unit]
Description=Run ThreadDesk Watchdog every 10 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=10min

[Install]
WantedBy=timers.target
EOF

echo "Enabling and starting timer..."
sudo systemctl daemon-reload
sudo systemctl enable threaddesk-watchdog.timer
sudo systemctl start threaddesk-watchdog.timer

echo "Watchdog service activated."
