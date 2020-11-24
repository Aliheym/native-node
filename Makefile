build:
	docker build -t i-node-sb ./docker/node

volume:
	docker volume create dbdata

up:
	docker run -d -v dbdata:/data/db --name db-sb -p 27017:27017 mongo && \
	docker run -v $(PWD)/code:/usr/app --link db-sb:db --name c-sb -p 3000:3000 i-node-sb

shell:
	docker exec -it c-sb sh

clean:
	docker stop db-sb && docker rm db-sb && docker stop c-sb && docker rm c-sb