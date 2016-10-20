#!/bin/bash

# USERNAME=administrator
# PASSWORD=administrato
# CAM_ADDRESS=172.31.0.137:88
# WIDTH=640
# HEIGHT=480

node jsmpeg/stream-server.js foo123 &
avconv -i rtsp://$USERNAME:$PASSWORD@$CAM_ADDRESS/videoMain -f mpeg1video -b:v 200k -r 30 -s ${WIDTH}x${HEIGHT} http://localhost:8082/foo123/$WIDTH/$HEIGHT