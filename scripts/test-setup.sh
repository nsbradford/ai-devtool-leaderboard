#!/bin/bash
# Copyright 2025 Anysphere Inc.

# Script to simulate test setup with configurable sleep time and loading messages
# Usage: ./test-setup.sh <sleep_seconds> <num_lines>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <sleep_seconds> <num_lines>"
    exit 1
fi

sleep_time=$1
num_lines=$2

# Sleep for the specified time
sleep $sleep_time

# Output "Loading" the specified number of times
for i in $(seq 1 $num_lines); do
    echo "Loading"
done

# Exit with error code 1
exit 1
