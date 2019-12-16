node:
	sudo snap switch node --channel=13/stable
	sudo snap refresh

fix:
	php -d memory_limit=1024m vendor/bin/php-cs-fixer fix -v