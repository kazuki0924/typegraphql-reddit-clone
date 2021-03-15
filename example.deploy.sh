#!/bin/bash

echo What should the version be?
read VERSION

docker build -t example_account/example_app_name:$VERSION .
docker push  example_account/example_app_name:$VERSION
ssh root@157.245.240.4 "docker pull example_account/example_app_name:$VERSION && docker tag example_account/example_app_name:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"
