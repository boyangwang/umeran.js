#! /bin/bash
# forever start -a -l /root/code/logs/forever_umeran.log \
#               -o /root/code/logs/forever_umeran.log \
#               -e /root/code/logs/forever_umeran.log \
#               --uid umeran \
#               --pidFile /root/code/logs/umeran.pid \
#               /root/code/umeran.js/app.js
#! /bin/bash
forever start -a -l /root/code/logs/forever_umeran_scraper.log \
              -o /root/code/logs/forever_umeran_scraper.log \
              -e /root/code/logs/forever_umeran_scraper.log \
              --uid umeran_scraper \
              --pidFile /root/code/logs/umeran_scraper.pid \
              /root/code/umeran.js/scraper/index.js scrapConfig.json
forever list
echo "Done"
