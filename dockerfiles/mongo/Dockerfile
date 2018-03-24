FROM mongo

ENV MONGO_DATA_DIR=/data/db
ENV MONGO_LOG_DIR=/dev/null

VOLUME [ "/data/db" ]

EXPOSE 27017

RUN mongod --smallfiles --logpath=/dev/null
