#!/bin/bash

# Stop on first error
set -o errexit

python /app/scripts/populate_db.py
