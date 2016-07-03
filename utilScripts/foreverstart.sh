#! /bin/bash
forever start -a -l /root/code/logs/forever_umeran.log \
              -o /root/code/logs/forever_umeran.log \
              -e /root/code/logs/forever_umeran.log \
              --uid umeran \
              --pidFile /root/code/logs/umeran.pid \
              /root/code/umeran.js/app.js
forever list
echo "Done"
