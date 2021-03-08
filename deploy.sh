#!/bin/bash

echo What should the version be?
read VERSION

docker build -t kazuki0924/reddit-clone:$VERSION .
docker push  kazuki0924/reddit-clone:$VERSION
ssh root@157.245.240.4 "docker pull kazuki0924/reddit-clone:$VERSION && docker tag kazuki0924/reddit-clone:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"
