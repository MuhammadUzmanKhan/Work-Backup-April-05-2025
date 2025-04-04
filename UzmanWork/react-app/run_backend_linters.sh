#!/bin/bash

set -o errexit

echo "Running mypy ..."
poetry run python -m mypy backend

echo "Running isort and fixing imports ..."
poetry run python -m isort backend --overwrite-in-place

echo "Running flake8 ..."
poetry run flake8 backend

echo "Running python black"
poetry run python -m black .
