#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:6060"

PRODUCT_COUNTS=(10000 20000 35000 50000)

# Check if MongoDB is running
echo -e "${YELLOW}Checking MongoDB connection...${NC}"
if ! mongosh --eval "db.version()" > /dev/null 2>&1; then
  echo -e "${RED}ERROR: MongoDB is not running!${NC}"
  echo -e "${YELLOW}Start MongoDB with: brew services start mongodb-community${NC}"
  exit 1
fi
echo -e "${GREEN}✓ MongoDB is running${NC}"
echo ""

# Check if server is running
echo -e "${YELLOW}Checking if server is running at ${BASE_URL}...${NC}"
if ! curl -s "${BASE_URL}/api/v1/category/get-category" > /dev/null 2>&1; then
  echo -e "${RED}ERROR: Server is not running at ${BASE_URL}!${NC}"
  echo -e "${YELLOW}Start server with: npm run start:volume-test${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Create results directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p results/public && echo -e "${GREEN}✓ results/public${NC}"
mkdir -p results/admin && echo -e "${GREEN}✓ results/admin${NC}"
echo ""

for i in "${!PRODUCT_COUNTS[@]}"; do
  product_count="${PRODUCT_COUNTS[$i]}"
  user_count=$((product_count / 50))
  order_count=$((user_count * 5))

  echo -e "${BLUE}Test #$((i + 1))${NC}"
  echo -e "${BLUE}  Products: ${product_count}${NC}"
  echo -e "${BLUE}  Users:    ${user_count}${NC}"
  echo -e "${BLUE}  Orders:   ${order_count}${NC}"
  echo ""

  echo -e "${YELLOW}Seeding database...${NC}"
  if ! PRODUCT_COUNT=$product_count node utils/seed-database.js; then
    echo -e "${RED}✗ Failed to seed database${NC}"
    exit 1
  fi
  echo ""

  echo -e "${YELLOW}Running k6 tests...${NC}"
  k6 run k6/public-endpoints.js --env PRODUCT_COUNT=${product_count}
  k6 run k6/admin-endpoints.js --env PRODUCT_COUNT=${product_count}
  echo ""

  if (( i < ${#PRODUCT_COUNTS[@]} - 1 )); then
    echo -e "${YELLOW}Waiting 5 seconds before next test...${NC}"
    sleep 5
    echo ""
  fi
done
