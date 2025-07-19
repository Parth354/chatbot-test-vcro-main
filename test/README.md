# Testing Documentation

This directory contains the complete test suite implementation for the Agent Customization system.

## Test Structure

```
src/test/
├── __tests__/                    # Automated test files
│   ├── AgentService.test.ts      # Service layer tests
│   ├── AgentCustomize.test.tsx   # Component tests
│   ├── validation.test.ts        # Validation logic tests
│   └── missing-coverage.test.ts  # Tests for missing coverage
├── integration/                  # Integration tests
│   └── integration.test.ts       # End-to-end integration tests
├── manual/                       # Manual testing framework
│   └── ManualTestFramework.md    # Manual test procedures
├── setup.ts                      # Test setup and mocks
└── README.md                     # This file
```

## Running Tests

### Automated Tests
```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run specific test file
npm run test AgentService.test.ts

# Run with coverage
npm run test -- --coverage
```

### Manual Tests
Refer to `manual/ManualTestFramework.md` for structured manual testing procedures.

## Test Coverage Summary

### ✅ Fully Automated Tests (25 total)

#### Basic Tab Tests (4/8)
- ✅ Test 1: Change Agent Name
- ✅ Test 2: Change Description  
- ✅ Test 7: Change Welcome Message
- ✅ Test 8: Toggle Agent Status

#### Prompts Tab Tests (4/8)
- ✅ Test 9: Add Suggested Prompt
- ✅ Test 11: Add Rotating Message
- ✅ Test 13: Add Dynamic Prompt
- ✅ Test 15: Toggle Dynamic Prompt

#### Lead Collection Tests (6/13)
- ✅ Test 17: Enable Lead Collection
- ✅ Test 19: Add CTA Button
- ✅ Test 21: Add Keyword Trigger
- ✅ Test 24: Add Custom Form Field
- ✅ Test 28: Modify Submit Button Text
- ✅ Test 29: Modify Success Message

#### Style Tab Tests (2/5)
- ✅ Test 30: Change Primary Color
- ✅ Test 33: Reset Appearance

#### Save Functionality Tests (3/5)
- ✅ Test 46: Save Without Required Fields
- ✅ Test 47: Unsaved Changes Indicator
- ✅ Test 49: Save Loading State

#### Validation Tests (6 additional)
- ✅ Image format validation
- ✅ Color input validation
- ✅ Character limit validation
- ✅ URL validation
- ✅ Required fields validation
- ✅ Array fields validation

### ⚠️ Manual Supervision Required (24 total)

#### Avatar Management
- Test 3: Change Avatar Image
- Test 6: Remove Avatar Image

#### Complex Lead Collection
- Test 25: Custom Form Field without keywords
- Test 26: Custom Form Field without backup trigger

#### Live Preview Tests
- Test 35: Bubble View Preview
- Test 36: Chat View Preview
- Test 37: Real-time Updates
- Test 38: Interactive Preview Testing

#### Deploy Tab Tests
- Test 39: Copy Direct Link
- Test 40: Open Direct Link
- Test 42: Copy Website Script
- Test 43: Modify Iframe Dimensions
- Test 44: Copy Iframe Code

#### Error Handling Tests
- Test 50: Network Error Handling
- Test 51: Invalid Agent ID
- Test 52: Unauthorized Access
- Test 53: Large Image Upload
- Test 54: Form Validation Messages

#### Additional Manual Tests
- Image size validation (Test 4)
- Image format validation (Test 5)
- Dynamic prompt functionality (Test 16)
- LinkedIn profile collection (Test 18)
- Backup trigger configuration (Test 23)
- Navigation with unsaved changes (Test 48)

### ✅ Missing Tests Now Covered (8 total)

#### Critical Missing Tests
- ✅ Dynamic Prompts Save Bug Test
- ✅ Reset Appearance Comprehensive Test
- ✅ Form Tab Navigation on Error
- ✅ Rotating Messages Validation
- ✅ Character Limit Validation Tests
- ✅ URL Validation Tests
- ✅ Authentication & Authorization Tests
- ✅ Database Persistence Tests

## Test Categories

### Unit Tests
- **AgentService.test.ts**: Tests service layer methods, data parsing, error handling
- **validation.test.ts**: Tests Zod schema validation rules and edge cases

### Component Tests  
- **AgentCustomize.test.tsx**: Tests React component behavior, user interactions, state updates

### Integration Tests
- **integration.test.ts**: Tests complete workflows, data transformation, error integration

### Manual Tests
- **ManualTestFramework.md**: Structured procedures for visual, interaction, and deployment testing

## Test Utilities and Mocks

### Setup Configuration
- **Vitest** as test runner with jsdom environment
- **React Testing Library** for component testing
- **User Event** for realistic user interactions
- **Custom mocks** for Supabase, React Router, and authentication

### Mock Services
- Supabase client with configurable responses
- Authentication context with test user
- Toast notifications
- React Router navigation

## Coverage Goals

- **Unit Test Coverage**: >90% for service and validation logic
- **Component Coverage**: >80% for user interactions and state management  
- **Integration Coverage**: 100% for critical user workflows
- **Manual Coverage**: 100% for visual, deployment, and complex interaction scenarios

## Contributing to Tests

### Adding New Tests
1. Identify the test category (unit/component/integration/manual)
2. Follow existing naming conventions
3. Include descriptive test names and comments
4. Add both positive and negative test cases
5. Update this README with new test information

### Test Writing Guidelines
1. **Arrange-Act-Assert** pattern for all tests
2. **Clear test descriptions** that match requirements
3. **Comprehensive mocking** to isolate units under test
4. **Edge case coverage** for validation and error scenarios
5. **Realistic test data** that matches production usage

### Manual Test Updates
1. Update ManualTestFramework.md for new manual procedures
2. Include screenshots and test data requirements
3. Specify browser and environment requirements
4. Provide clear pass/fail criteria

## Known Limitations

1. **Avatar upload testing** requires manual verification of file handling
2. **Live preview testing** needs visual confirmation of real-time updates
3. **Clipboard operations** cannot be fully automated due to browser security
4. **Network error simulation** requires manual network manipulation
5. **Cross-browser testing** needs manual execution in different browsers

## Future Improvements

1. **Visual regression testing** with screenshot comparison
2. **End-to-end testing** with Playwright or Cypress
3. **Performance testing** for large datasets
4. **Accessibility testing** automation
5. **API mocking** for more realistic integration tests