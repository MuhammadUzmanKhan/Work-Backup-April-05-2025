#!/bin/bash

cat <<"EOF"
 ____             _                  _   ____             __ _ _
| __ )  __ _  ___| | _____ _ __   __| | |  _ \ _ __ ___  / _(_) | ___ _ __
|  _ \ / _` |/ __| |/ / _ \ '_ \ / _` | | |_) | '__/ _ \| |_| | |/ _ \ '__|
| |_) | (_| | (__|   <  __/ | | | (_| | |  __/| | | (_) |  _| | |  __/ |
|____/ \__,_|\___|_|\_\___|_| |_|\__,_| |_|   |_|  \___/|_| |_|_|\___|_|

EOF

# List only the names of Docker containers with "app-backend" in the name
container_names=$(docker ps -a --filter "name=app-backend" --format "{{.Names}}")
container_count=1

echo "Available containers with 'app-backend' in the name:"
while IFS= read -r container; do
    echo "[$container_count] $container"
    ((container_count++))
done <<<"$container_names"

# Ask the user to pick a container number or exit
read -p "Enter the container number or type 'exit' to quit: " container_number
if [ "$container_number" = "exit" ]; then
    echo "Exiting..."
    exit 0
fi

# Get the selected container name by number
container_name=$(echo "$container_names" | sed "${container_number}q;d")
if [ -z "$container_name" ]; then
    echo "Invalid container number. Exiting..."
    exit 1
fi

# Run ps -a inside the selected container and find the ID of a process starting with python -m uvicorn
uvicorn_process_id=$(docker exec "$container_name" ps -ax | grep "python -m uvicorn" | awk '{print $1}')

if [ -z "$uvicorn_process_id" ]; then
    echo "No process with 'python -m uvicorn' found in the container."
    exit 1
fi

# Ask the user for the mode: dump or interactive
read -p "Choose the mode (dump: 1, interactive: 2): " mode

# Run command based on the selected mode
case "$mode" in
1|dump)
    docker exec --workdir /app/profile_traces -it "$container_name" py-spy record -o ./profile.svg --pid $uvicorn_process_id --subprocesses
    ;;
2|interactive)
    docker exec -it "$container_name" py-spy top --pid $uvicorn_process_id --subprocesses
    ;;
*)
    echo "Invalid mode selected. Exiting..."
    ;;
esac
