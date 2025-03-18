#!/bin/bash
# Documentation health check script

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DOC_DIR="./docs"
LARGE_FILE_THRESHOLD=10000
CRITICAL_SIZE_THRESHOLD=20000

# Function to calculate file age in days
get_file_age() {
  local file="$1"
  if [[ -f "$file" ]]; then
    # Using stat in a way compatible with both macOS and Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
      local file_time=$(stat -f "%m" "$file")
    else
      local file_time=$(stat -c "%Y" "$file")
    fi
    local current_time=$(date +%s)
    local age_seconds=$((current_time - file_time))
    local age_days=$((age_seconds / 86400))
    echo $age_days
  else
    echo "0"
  fi
}

# Check documentation file health
check_doc_health() {
  echo -e "${GREEN}======= Documentation Health Check =======${NC}"
  echo "Running checks on $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  
  local large_files=0
  local critical_files=0
  local old_files=0
  
  # Check if docs directory exists
  if [[ ! -d "$DOC_DIR" ]]; then
    echo -e "${RED}Documentation directory '$DOC_DIR' does not exist!${NC}"
    exit 1
  fi
  
  # Find all markdown files in the docs directory
  local doc_files=$(find "$DOC_DIR" -name "*.md" -type f)
  
  # Also add README.md if it exists
  if [[ -f "README.md" ]]; then
    doc_files="$doc_files README.md"
  fi
  
  # Check each documentation file
  for doc_file in $doc_files; do
    if [[ ! -f "$doc_file" ]]; then
      continue
    fi
    
    # Get file size
    local size=$(wc -c < "$doc_file")
    local lines=$(wc -l < "$doc_file")
    local age=$(get_file_age "$doc_file")
    
    # Format output based on file size
    if [[ $size -gt $CRITICAL_SIZE_THRESHOLD ]]; then
      echo -e "${RED}$doc_file: $size bytes, $lines lines, last modified $age days ago${NC}"
      echo -e "${RED}  ⚠️  This file is critically large and should be summarized${NC}"
      critical_files=$((critical_files + 1))
    elif [[ $size -gt $LARGE_FILE_THRESHOLD ]]; then
      echo -e "${YELLOW}$doc_file: $size bytes, $lines lines, last modified $age days ago${NC}"
      echo -e "${YELLOW}  ⚠️  This file is getting large and may need summarizing${NC}"
      large_files=$((large_files + 1))
    else
      echo -e "${GREEN}$doc_file: $size bytes, $lines lines, last modified $age days ago${NC}"
    fi
    
    # Check for old files that haven't been updated recently
    if [[ $age -gt 30 ]]; then
      echo -e "${YELLOW}  ⚠️  This file hasn't been updated in over a month${NC}"
      old_files=$((old_files + 1))
    fi
  done
  
  echo ""
  echo -e "${GREEN}===== Documentation Health Summary =====${NC}"
  if [[ $critical_files -gt 0 ]]; then
    echo -e "${RED}$critical_files files are critically large and need attention${NC}"
  fi
  if [[ $large_files -gt 0 ]]; then
    echo -e "${YELLOW}$large_files files are large and should be summarized soon${NC}"
  fi
  if [[ $old_files -gt 0 ]]; then
    echo -e "${YELLOW}$old_files files haven't been updated in over a month${NC}"
  fi
  
  if [[ $critical_files -eq 0 && $large_files -eq 0 && $old_files -eq 0 ]]; then
    echo -e "${GREEN}All documentation files are in good health!${NC}"
  fi
}

# Main execution
check_doc_health

exit 0