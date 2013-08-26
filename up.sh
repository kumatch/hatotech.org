#!/bin/bash

CURRENT_DIRECTORY=$( cd "$( dirname "$0" )" && pwd )

TARGET_HOST="hatotech@hatotech.org"
TARGET_PATH="/var/www/hatotech.org"

rsync -avuz \
  --delete \
  --exclude=".*" \
  -e ssh \
  ${CURRENT_DIRECTORY}/web/ \
  ${TARGET_HOST}:${TARGET_PATH}
