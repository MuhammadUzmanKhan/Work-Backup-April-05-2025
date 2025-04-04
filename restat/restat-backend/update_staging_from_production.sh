#!/bin/bash

# Updated Database connection details
PROD_HOST="prod-products-phaedrasolutions-12082024-do-user-1788947-0.h.db.ondigitalocean.com"
STAGING_HOST="db-postgresql-sgp1-54645-do-user-1788947-0.c.db.ondigitalocean.com"
PORT=25060
USER="doadmin"
PROD_DB="restat-production"
STAGING_DB="restat-staging"
PROD_DUMP_FILE="backup-prod.dump"

# Production Database password
PROD_PASSWORD="AVNS_dYorPR3-azfH6T4HZwZ"

# Staging Database password
STAGING_PASSWORD="AVNS_inAOlbCDkUgaGi6ri0I"

# Function to print messages
function print_message() {
    echo "---------------------------------"
    echo "$1"
    echo "---------------------------------"
}

# Check if pg_dump and pg_restore are available
if ! command -v pg_dump &> /dev/null; then
    echo "pg_dump could not be found. Please ensure PostgreSQL client tools are installed and in your PATH."
    exit 1
fi

if ! command -v pg_restore &> /dev/null; then
    echo "pg_restore could not be found. Please ensure PostgreSQL client tools are installed and in your PATH."
    exit 1
fi

# Dump the production database
export PGPASSWORD=$PROD_PASSWORD
print_message "Starting to dump the production database..."
pg_dump -h $PROD_HOST -U $USER -p $PORT -F c $PROD_DB > $PROD_DUMP_FILE

if [ $? -eq 0 ]; then
    print_message "Production database dumped successfully."
else
    print_message "Error occurred while dumping the production database."
    exit 1
fi

# Drop the staging database
export PGPASSWORD=$STAGING_PASSWORD
print_message "Dropping the staging database..."
psql -h $STAGING_HOST -U $USER -p $PORT -d defaultdb -c "DROP DATABASE IF EXISTS \"$STAGING_DB\";"

if [ $? -eq 0 ]; then
    print_message "Staging database dropped successfully."
else
    print_message "Error occurred while dropping the staging database."
    exit 1
fi

# Recreate the staging database
print_message "Recreating the staging database..."
psql -h $STAGING_HOST -U $USER -p $PORT -d defaultdb -c "CREATE DATABASE \"$STAGING_DB\";"

if [ $? -eq 0 ]; then
    print_message "Staging database created successfully."
else
    print_message "Error occurred while creating the staging database."
    exit 1
fi

# Restore to the staging database
print_message "Starting to restore the staging database..."
pg_restore -h $STAGING_HOST -U $USER -p $PORT -d $STAGING_DB -1 $PROD_DUMP_FILE

if [ $? -eq 0 ]; then
    print_message "Staging database updated successfully."
else
    print_message "Error occurred while restoring the staging database."
    exit 1
fi

# Cleanup
unset PGPASSWORD
rm $PROD_DUMP_FILE

print_message "Update process completed."
