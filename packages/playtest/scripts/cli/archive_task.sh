#!/bin/bash

# archive_task.sh - A script to move completed tasks from TASKS.md to TASK_ARCHIVE.md
# Usage: ./scripts/archive_task.sh T-XXX

if [ $# -ne 1 ]; then
    echo "Usage: $0 T-XXX"
    echo "Where T-XXX is the task ID to archive"
    exit 1
fi

TASK_ID=$1
TASKS_FILE="docs/TASKS.md"
ARCHIVE_FILE="docs/TASK_ARCHIVE.md"
TEMP_FILE="/tmp/task_content.txt"

# Check if files exist
if [ ! -f "$TASKS_FILE" ]; then
    echo "Error: $TASKS_FILE not found"
    exit 1
fi

if [ ! -f "$ARCHIVE_FILE" ]; then
    echo "Error: $ARCHIVE_FILE not found"
    exit 1
fi

# Extract the task content
echo "Extracting task $TASK_ID from $TASKS_FILE..."
TASK_CONTENT=$(awk -v taskid="$TASK_ID" '
    /^### \['"$TASK_ID"'\]/ {
        print $0
        in_task = 1
        next
    }
    in_task && /^### \[T-[0-9]+\]/ && !($0 ~ taskid) {
        in_task = 0
    }
    in_task {
        print $0
    }
' "$TASKS_FILE")

if [ -z "$TASK_CONTENT" ]; then
    echo "Error: Task $TASK_ID not found in $TASKS_FILE"
    exit 1
fi

# Check if task is marked as DONE
if ! echo "$TASK_CONTENT" | grep -q "\[$TASK_ID\].*\[DONE\]"; then
    echo "Error: Task $TASK_ID is not marked as DONE. Only completed tasks should be archived."
    exit 1
fi

# Write task content to temp file
echo "$TASK_CONTENT" > "$TEMP_FILE"

# Append to archive file with a newline before the task
echo "Appending task $TASK_ID to $ARCHIVE_FILE..."
echo -e "\n" >> "$ARCHIVE_FILE"
cat "$TEMP_FILE" >> "$ARCHIVE_FILE"

# Remove task from TASKS.md
echo "Removing task $TASK_ID from $TASKS_FILE..."
awk -v taskid="$TASK_ID" '
    /^### \['"$TASK_ID"'\]/ {
        skip_task = 1
        next
    }
    skip_task && /^### \[T-[0-9]+\]/ {
        skip_task = 0
    }
    !skip_task {
        print $0
    }
' "$TASKS_FILE" > "${TASKS_FILE}.new"

# Replace original file with modified version
mv "${TASKS_FILE}.new" "$TASKS_FILE"

# Clean up
rm "$TEMP_FILE"

echo "Task $TASK_ID has been successfully archived."
echo "Archived tasks can be found in $ARCHIVE_FILE"