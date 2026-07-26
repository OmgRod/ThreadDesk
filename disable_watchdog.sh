#!/bin/bash

echo "Stopping and disabling timer..."
sudo systemctl stop threaddesk-watchdog.timer
sudo systemctl disable threaddesk-watchdog.timer

echo "Removing service and timer files..."
sudo rm /etc/systemd/system/threaddesk-watchdog.service
sudo rm /etc/systemd/system/threaddesk-watchdog.timer

echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Watchdog service deactivated and removed."
