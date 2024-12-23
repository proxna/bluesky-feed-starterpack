#!/bin/bash

# Check if folder path is provided as an argument
if [ -z "$1" ]; then
    echo "Please provide a folder path as an argument."
    exit 1
fi

# Assign folder path
FOLDER_PATH="$1"

# Ensure the folder exists
if [ ! -d "$FOLDER_PATH" ]; then
    echo "The specified folder does not exist: $FOLDER_PATH"
    exit 1
fi

# Declare an associative array to store file hashes
declare -A file_hashes

# Find all files in the folder and subfolders
find "$FOLDER_PATH" -type f | while read -r file; do
    # Compute the hash of the file content using SHA256
    file_hash=$(sha256sum "$file" | awk '{print $1}')

    # Check if the hash already exists in the array
    if [[ -v file_hashes["$file_hash"] ]]; then
        echo "Deleting duplicate: $file"
        rm -f "$file"
    else
        # Store the hash and file path in the array
        file_hashes["$file_hash"]="$file"
    fi
done

echo "Deduplication complete. Unique files retained."
