install:
	npm install

install-service:
	cp ./aws-discord-bot.service /etc/systemd/system/
	systemctl daemon-reload
	systemctl enable aws-discord-bot.service
	systemctl start aws-discord-bot.service
	systemctl status aws-discord-bot.service

start:
	node bot.js


start_service: start

