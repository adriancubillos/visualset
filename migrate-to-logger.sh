#!/bin/bash

# Script to migrate console.error calls to logger
# Usage: ./migrate-to-logger.sh

set -e

echo "🔍 Starting console.error to logger migration..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter for changes
total_files=0
total_replacements=0

# Function to add logger import if not present
add_logger_import() {
    local file=$1
    
    # Check if logger import already exists
    if grep -q "import { logger } from '@/utils/logger';" "$file"; then
        return 0
    fi
    
    # Check if it's a TypeScript/TSX file
    if [[ $file == *.ts ]] || [[ $file == *.tsx ]]; then
        # Find the last import statement and add logger import after it
        if grep -q "^import" "$file"; then
            # Get the line number of the last import
            last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
            
            # Insert logger import after the last import
            sed -i "${last_import_line}a import { logger } from '@/utils/logger';" "$file"
            echo -e "${GREEN}  ✓ Added logger import${NC}"
            return 0
        else
            # No imports found, add at the top after 'use client' if present
            if grep -q "'use client';" "$file"; then
                sed -i "/'use client';/a \\nimport { logger } from '@/utils/logger';" "$file"
            else
                sed -i "1i import { logger } from '@/utils/logger';" "$file"
            fi
            echo -e "${GREEN}  ✓ Added logger import${NC}"
            return 0
        fi
    fi
}

# Function to replace console.error with logger.error
replace_console_errors() {
    local file=$1
    local count=0
    
    # Pattern 1: console.error('message:', error) -> logger.error('message', error)
    count=$(grep -c "console\.error(" "$file" 2>/dev/null || echo "0")
    
    if [ "$count" -gt 0 ]; then
        echo -e "${BLUE}📝 Processing: $file${NC}"
        echo -e "${YELLOW}  Found $count console.error call(s)${NC}"
        
        # Add logger import
        add_logger_import "$file"
        
        # Replace console.error with logger.error
        # Pattern: console.error('text:', var) -> logger.error('text', var)
        sed -i "s/console\.error(\([^,]*\):\([^)]*\))/logger.error(\1,\2)/g" "$file"
        
        # Pattern: console.error('text', var) -> logger.error('text', var)
        sed -i "s/console\.error(/logger.error(/g" "$file"
        
        total_files=$((total_files + 1))
        total_replacements=$((total_replacements + count))
        
        echo -e "${GREEN}  ✓ Replaced $count console.error call(s)${NC}"
        echo ""
    fi
}

# Find all TypeScript and TSX files with console.error
echo "🔎 Scanning for files with console.error..."
echo ""

files=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "console\.error" {} \; 2>/dev/null || true)

if [ -z "$files" ]; then
    echo -e "${GREEN}✨ No console.error calls found! Migration complete.${NC}"
    exit 0
fi

# Process each file
while IFS= read -r file; do
    # Skip the logger.ts file itself
    if [[ $file == *"utils/logger.ts"* ]]; then
        echo -e "${YELLOW}⏭️  Skipping: $file (logger implementation)${NC}"
        echo ""
        continue
    fi
    
    replace_console_errors "$file"
done <<< "$files"

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Summary:${NC}"
echo "  • Files modified: $total_files"
echo "  • Total replacements: $total_replacements"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "  1. Review the changes: git diff"
echo "  2. Test the application"
echo "  3. Commit the changes: git add . && git commit -m 'Migrate console.error to logger'"
echo ""
