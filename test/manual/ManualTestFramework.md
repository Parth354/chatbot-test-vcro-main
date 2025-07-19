# Manual Test Framework

This document provides structured procedures for tests that require manual supervision and cannot be fully automated.

## Avatar Management Tests

### Test Case 3: Change Avatar Image
**Manual Steps Required:**
1. Navigate to Basic tab
2. Use drag-and-drop or file browser to upload image
3. **Manual Verification:** Visual inspection of uploaded image in preview
4. Click Save Changes
5. **Manual Verification:** Check Direct Link shows new avatar

**Test Data:** Use sample images of different formats (JPEG, PNG, GIF, WebP)

### Test Case 6: Remove Avatar Image  
**Manual Steps Required:**
1. Navigate to Basic tab with existing avatar
2. Click remove/delete button on avatar
3. **Manual Verification:** Avatar removed, showing default placeholder
4. **Manual Verification:** Preview updates immediately

## Live Preview Tests

### Test Case 35-36: Bubble/Chat View Preview
**Manual Steps Required:**
1. Click "Bubble View" tab in live preview
2. **Manual Verification:** Shows collapsed chatbot widget
3. Click "Chat View" tab
4. **Manual Verification:** Shows expanded chat interface

### Test Case 37: Real-time Updates
**Manual Steps Required:**
1. Make changes in any customization tab
2. **Manual Verification:** Preview updates without page refresh
3. Test multiple changes across different tabs

### Test Case 38: Interactive Preview Testing
**Manual Steps Required:**
1. Type messages in preview chat interface
2. **Manual Verification:** Shows welcome message
3. **Manual Verification:** Suggested prompts appear as clickable
4. **Manual Verification:** Dynamic prompts trigger correctly

## Deploy Tab Tests

### Test Case 39: Copy Direct Link
**Manual Steps Required:**
1. Navigate to Deploy tab
2. Click "Copy" button next to direct link
3. **Manual Verification:** Success toast appears
4. **Manual Verification:** Link copied to clipboard (paste test)

### Test Case 40: Open Direct Link
**Manual Steps Required:**
1. Click "Open" button next to direct link
2. **Manual Verification:** Opens in new tab/window
3. **Manual Verification:** Chatbot loads correctly at URL

### Test Case 42: Copy Website Script
**Manual Steps Required:**
1. Click copy button on website script code block
2. **Manual Verification:** HTML script tag copied to clipboard
3. **Manual Verification:** Bot ID matches current agent

### Test Case 43-44: Iframe Functionality
**Manual Steps Required:**
1. Change width and height values for iframe
2. **Manual Verification:** Iframe code updates immediately
3. Click copy button on iframe code
4. **Manual Verification:** Correct HTML with dimensions copied

## Complex Lead Collection Tests

### Test Case 25: Custom Form Field without Keywords
**Manual Steps Required:**
1. Add custom field without keywords
2. Set backup trigger to 2 messages
3. Save settings and navigate to dashboard
4. Return to Lead Collection tab
5. **Manual Verification:** Field saved and visible
6. **Manual Verification:** After 2 messages in chatbot, form appears

### Test Case 26: Custom Form Field without Backup Trigger
**Manual Steps Required:**
1. Add custom field with keywords but no backup
2. Save settings and navigate to dashboard
3. Return to Lead Collection tab
4. **Manual Verification:** Field saved and visible
5. **Manual Verification:** Keyword triggers form in chatbot

## Error Handling Tests

### Test Case 50: Network Error Handling
**Manual Steps Required:**
1. Disconnect internet connection
2. Attempt to save changes
3. **Manual Verification:** Error toast with connection failure message

### Test Case 51: Invalid Agent ID
**Manual Steps Required:**
1. Navigate to `/admin/agent/invalid-id/customize`
2. **Manual Verification:** "Agent not found" error
3. **Manual Verification:** Redirects to main dashboard

### Test Case 52: Unauthorized Access
**Manual Steps Required:**
1. Clear authentication/logout
2. Attempt to access admin panel
3. **Manual Verification:** Redirects to login page

### Test Case 53: Large Image Upload
**Manual Steps Required:**
1. Attempt to upload image file >5MB
2. **Manual Verification:** Appropriate error message
3. **Manual Verification:** Upload does not proceed

## Test Data Sets

### Sample Images for Testing
- **Valid Images:** JPEG (1MB), PNG (1.5MB), GIF (500KB), WebP (800KB)
- **Invalid Images:** TXT file, PDF file, Image >2MB, Image >5MB
- **Edge Cases:** 0KB file, Corrupted image file

### Sample Agent Data
- **Valid Names:** "Test Agent", "Customer Support Bot", "Sales Assistant"
- **Invalid Names:** Empty string, 501+ characters
- **Valid URLs:** "https://example.com", "https://test.co.uk/page"
- **Invalid URLs:** "not-a-url", "ftp://invalid", "javascript:alert('xss')"

## Manual Test Execution Log

Use this template for each manual test session:

```
Date: ___________
Tester: ___________
Browser: ___________
Test Environment: ___________

Test Case: ___________
Status: [PASS/FAIL/BLOCKED]
Notes: ___________
Issues Found: ___________
Screenshots: ___________
```

## Visual Regression Guidelines

1. **Color Accuracy:** Compare colors against design system values
2. **Layout Consistency:** Check responsive behavior at 320px, 768px, 1024px, 1920px
3. **Animation Smooth:** Verify transitions are smooth and complete
4. **Font Rendering:** Check typography matches design system
5. **Interactive States:** Test hover, focus, active states

## Accessibility Manual Checks

1. **Keyboard Navigation:** Tab through all interactive elements
2. **Screen Reader:** Test with screen reader software
3. **Color Contrast:** Verify WCAG compliance
4. **Focus Indicators:** Check visible focus states
5. **Alt Text:** Verify all images have appropriate alt text