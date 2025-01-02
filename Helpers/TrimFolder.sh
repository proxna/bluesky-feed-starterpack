#!/bin/bash

# Check if the required arguments are provided
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <folder_path> <files_to_keep>"
  exit 1
fi

FOLDER_PATH=$1
FILES_TO_KEEP=$2

# Check if the folder exists
if [ ! -d "$FOLDER_PATH" ]; then
  echo "Error: The folder '$FOLDER_PATH' does not exist."
  exit 1
fi

# Get the list of files sorted by modification time (oldest first)
FILES=($(ls -1t "$FOLDER_PATH"))

# Calculate the number of files to delete
FILES_COUNT=${#FILES[@]}
FILES_TO_DELETE=$((FILES_COUNT - FILES_TO_KEEP))

if [ "$FILES_TO_DELETE" -le 0 ]; then
  echo "No files to delete. The folder already contains $FILES_TO_KEEP or fewer files."
  exit 0
fi

# Delete the older files
for ((i=FILES_TO_KEEP; i<FILES_COUNT; i++)); do
  FILE_TO_DELETE="$FOLDER_PATH/${FILES[$i]}"
  if [ -f "$FILE_TO_DELETE" ]; then
    rm "$FILE_TO_DELETE"
    echo "Deleted file: $FILE_TO_DELETE"
  fi
done

echo "Deleted $FILES_TO_DELETE files, keeping the latest $FILES_TO_KEEP files."
