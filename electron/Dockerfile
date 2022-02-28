FROM ubuntu:20.04

# Create dicekeys directory
WORKDIR /dicekeys

VOLUME /dicekeys

RUN apt-get update \
    && DEBIAN_FRONTEND="noninteractive" apt-get install -y curl rpm zip build-essential git software-properties-common wget  \
    && curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs wine64 \
    && npm install -g npm

CMD npm install && npm run dist-win-linux
