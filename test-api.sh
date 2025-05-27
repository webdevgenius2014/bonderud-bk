#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_BASE="http://localhost:5000/api/v1"

echo "Testing Bonderud Law Firm API..."
echo "================================"

# Test 1: API Root
echo -e "\n${GREEN}Test 1: API Root${NC}"
curl -s $API_BASE | jq '.'

# Test 2: Health Check
echo -e "\n${GREEN}Test 2: Health Check${NC}"
curl -s http://localhost:5000/health | jq '.'

# Test 3: List Attorneys (Public)
echo -e "\n${GREEN}Test 3: List Attorneys${NC}"
curl -s $API_BASE/attorneys | jq '.'

# Test 4: List Practice Areas (Public)
echo -e "\n${GREEN}Test 4: List Practice Areas${NC}"
curl -s $API_BASE/practice-areas | jq '.'

# Test 5: List Case Results (Public)
echo -e "\n${GREEN}Test 5: List Case Results${NC}"
curl -s $API_BASE/case-results | jq '.'

# Test 6: List Reviews (Public)
echo -e "\n${GREEN}Test 6: List Reviews${NC}"
curl -s $API_BASE/reviews | jq '.'

# Test 7: List Blog Posts (Public)
echo -e "\n${GREEN}Test 7: List Blog Posts${NC}"
curl -s $API_BASE/blog/posts | jq '.'

echo -e "\n${GREEN}API Testing Complete!${NC}"