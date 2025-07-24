#!/bin/bash

# Run a specific test file for debugging
TEST_FILE="test/__tests__/ConversationService.test.ts"

echo "Running single test: $TEST_FILE"
vitest run test/__tests__/AgentService.test.ts test/__tests__/AgentService.test.ts
if [ $? -ne 0 ]; then
  echo "Test failed: $TEST_FILE"
  echo "You can debug this test by adding 'debugger;' statements in the test file or the code it tests, and then running 'vitest --inspect-brk $TEST_FILE' to attach a debugger."
fi
echo "----------------------------------------------------"

echo "Single test run complete."