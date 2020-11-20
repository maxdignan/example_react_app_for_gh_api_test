#!/bin/bash

# this is for dev env only
# https://www.npmjs.com/package/supervisor

# DEBUG=* \
  node_modules/supervisor/lib/cli-wrapper.js \
    --watch ., ../src/server/dist \
    --ignore-symlinks \
    --ignore node_modules \
    --extensions js \
    --quiet \
    --non-interactive \
    --no-restart-on error \
    --instant-kill \
    --inspect  \
    dist/app.js