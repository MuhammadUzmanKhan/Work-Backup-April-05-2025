#!/bin/bash

# Stop on first error
set -o errexit

python /app/scripts/drop_db.py
