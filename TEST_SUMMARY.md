Give below is a list of tests. Find out which tests you can complete automatically, which tests need my manual supervision, and any tests not mentioned in this list.

### Page: Admin Dashboard (Main)
1.  **Test Case**: Dashboard Loading
    -   **Replication Steps**: Navigate to `/admin` page when logged in
    -   **Result**: Dashboard should load showing user email, agent count stats, and agent cards if any exist
2.  **Test Case**: Create New Agent Button
    -   **Replication Steps**: Click "Create New Agent" button on dashboard
    -   **Result**: Should navigate to `/admin/agent/new/customize` page
3.  **Test Case**: Agent Card Display
    -   **Replication Steps**: View existing agent cards on dashboard
    -   **Result**: Each card should show agent avatar (or default icon), name, status badge, description, message/conversation counts, and Manage/Analytics buttons
4.  **Test Case**: Manage Agent Navigation
    -   **Replication Steps**: Click "Manage" button on an agent card
    -   **Result**: Should navigate to individual agent dashboard (`/admin/agent/{id}`)
5.  **Test Case**: Analytics Navigation
    -   **Replication Steps**: Click "Analytics" button on an agent card
    -   **Result**: Should navigate to agent history/analytics page (`/admin/agent/{id}/history`)
6.  **Test Case**: Sign Out Function
    -   **Replication Steps**: Click "Sign Out" button in header
    -   **Result**: Should log out user and redirect to auth page

---

### Page: Agent Dashboard (Individual Agent)
7.  **Test Case**: Agent Dashboard Loading
    -   **Replication Steps**: Navigate to `/admin/agent/{id}` for existing agent
    -   **Result**: Should display agent avatar, name, status, description, and metrics cards
8.  **Test Case**: Back to Dashboard Navigation
    -   **Replication Steps**: Click "Back to Dashboard" button
    -   **Result**: Should navigate back to main admin dashboard
9.  **Test Case**: Customize Agent Button
    -   **Replication Steps**: Click "Customize" button
    -   **Result**: Should navigate to agent customization page (`/admin/agent/{id}/customize`)
10. **Test Case**: View Analytics Button
    -   **Replication Steps**: Click "View Analytics" button
    -   **Result**: Should navigate to analytics/history page
11. **Test Case**: Tab Navigation (Overview, Settings, Deploy)
    -   **Replication Steps**: Click each tab in agent dashboard
    -   **Result**: Should switch between Overview, Settings, and Deploy content without page reload
12. **Test Case**: Deploy Tab Functionality
    -   **Replication Steps**: Navigate to Deploy tab
    -   **Result**: Should show direct link, website script, and iframe embedding options

---

### Page: Customize > Basic
1.  **Test Case**: Change Agent Name
    -   **Replication Steps**: Change name in the Agent Name text field
    -   **Result**: Changed name should be visible in live preview; On clicking Save Changes, the changed name should reflect in the Direct Link of the chatbot
2.  **Test Case**: Change Description
    -   **Replication Steps**: Change description in the Description text field
    -   **Result**: Changed description should be visible in live preview; On clicking Save Changes, the changed description should reflect in the Direct Link of the chatbot
3.  **Test Case**: Change Avatar Image
    -   **Replication Steps**: Upload new avatar image via drag-and-drop or file browser
    -   **Result**: New image should be visible in live preview; On clicking Save Changes, the new image should reflect in the Direct Link of the chatbot
4.  **Test Case**: Verify Max Image Size
    -   **Replication Steps**: Upload new avatar image greater than 2MB size
    -   **Result**: Should show error message "File size must be less than 2MB" and should not upload the image
5.  **Test Case**: Verify Image Format Validation
    -   **Replication Steps**: Upload non-image file (e.g., .txt, .pdf)
    -   **Result**: Should show error message "File must be a valid image (JPEG, PNG, GIF, or WebP)" and reject the file
6.  **Test Case**: Remove Avatar Image
    -   **Replication Steps**: Click remove/delete button on existing avatar
    -   **Result**: Avatar should be removed from preview and form, showing default placeholder
7.  **Test Case**: Change Welcome Message
    -   **Replication Steps**: Modify text in Welcome Message textarea
    -   **Result**: New welcome message should appear in live preview; After saving, should reflect in deployed chatbot
8.  **Test Case**: Toggle Agent Status
    -   **Replication Steps**: Toggle the "Active" switch
    -   **Result**: Status should change between active/inactive; Should be reflected in agent dashboard and direct link accessibility

---

### Page: Customize > Prompts
9.  **Test Case**: Add Suggested Prompt
    -   **Replication Steps**: Enter text in suggested prompt input field and click Plus button (or press Enter)
    -   **Result**: New prompt should appear in the list below and in live preview as clickable suggestion
10. **Test Case**: Remove Suggested Prompt
    -   **Replication Steps**: Click X button on existing suggested prompt
    -   **Result**: Prompt should be removed from list and disappear from live preview
11. **Test Case**: Add Rotating Message
    -   **Replication Steps**: Enter text in rotating message input and click Plus button
    -   **Result**: Message should be added to rotating messages list and cycle in the widget preview
12. **Test Case**: Remove Rotating Message
    -   **Replication Steps**: Click X button on existing rotating message
    -   **Result**: Message should be removed from list and stop appearing in widget rotation
13. **Test Case**: Add Dynamic Prompt
    -   **Replication Steps**: Enter keywords (comma-separated) and message, then click "Add Dynamic Prompt"
    -   **Result**: Dynamic prompt should appear in list with toggle switch enabled
14. **Test Case**: Remove Dynamic Prompt
    -   **Replication Steps**: Click X button on existing dynamic prompt
    -   **Result**: Dynamic prompt should be removed from list
15. **Test Case**: Toggle Dynamic Prompt
    -   **Replication Steps**: Click toggle switch on dynamic prompt
    -   **Result**: Should enable/disable the prompt; Disabled prompts should not trigger suggestions in live chatbot
16. **Test Case**: Test Dynamic Prompt Functionality
    -   **Replication Steps**: In live preview, type keywords that match dynamic prompt
    -   **Result**: Should show hover suggestion with the configured message

---

### Page: Customize > Lead Collection
17. **Test Case**: Enable Lead Collection
    -   **Replication Steps**: Toggle "Enable Lead Collection" switch to ON
    -   **Result**: Should show additional lead collection configuration options below
18. **Test Case**: Configure LinkedIn Profile Collection
    -   **Replication Steps**: Toggle LinkedIn Profile Collection switch
    -   **Result**: Should enable/disable LinkedIn profile field in lead forms
19. **Test Case**: Add CTA Button
    -   **Replication Steps**: Enter button label and URL, click "Add CTA Button"
    -   **Result**: CTA button should appear in list and in live preview chat interface
20. **Test Case**: Remove CTA Button
    -   **Replication Steps**: Click X button on existing CTA button
    -   **Result**: Button should be removed from list and disappear from live preview
21. **Test Case**: Add Keyword Trigger
    -   **Replication Steps**: Enter comma-separated keywords and click Plus button
    -   **Result**: Trigger should be added to list; When these keywords are typed in chat, lead form should appear
22. **Test Case**: Remove Keyword Trigger
    -   **Replication Steps**: Click X button on existing keyword trigger
    -   **Result**: Trigger should be removed; Keywords should no longer show lead form
23. **Test Case**: Configure Backup Trigger
    -   **Replication Steps**: Enable backup trigger and set message count
    -   **Result**: Lead form should appear after specified number of messages in chat
24. **Test Case**: Add Custom Form Field
    -   **Replication Steps**: Select field type, enter label and placeholder, click Plus button
    -   **Result**: Field should be added to custom fields list.
25. **Test Case**: Save Custom Form Field without keywords
    -   **Replication Steps**: Add a custom field without keywords and backup trigger of 2 messages. Save settings and navigate back to Chatboard dashboard. Visit the custom fields tab again.
    -   **Result**: (A) Field should be saved and visible to custom fields list. (B) After sending two messages in chatbot, the form should appear in chat history.
26. **Test Case**: Save Custom Form Field without backup trigger
    -   **Replication Steps**: Add a custom field with keywords and but without backup. Save settings and navigate back to Chatboard dashboard. Visit the custom fields tab again.
    -   **Result**: (A) Field should be saved and visible to custom fields list. (B) After sending a message with keyword trigger in chatbot, the form should appear in chat history.
27. **Test Case**: Remove Custom Form Field
    -   **Replication Steps**: Click X button on custom form field
    -   **Result**: Field should be removed from list and lead form
28. **Test Case**: Modify Submit Button Text
    -   **Replication Steps**: Change text in "Submit Button Text" field
    -   **Result**: Submit button in lead form should show new text
29. **Test Case**: Modify Success Message
    -   **Replication Steps**: Change text in "Success Message" field
    -   **Result**: After form submission, should show new success message

---

### Page: Customize > Style
30. **Test Case**: Change Primary Color
    -   **Replication Steps**: Use color picker or enter hex code for primary color
    -   **Result**: Live preview should immediately show new primary color for buttons and accents
31. **Test Case**: Change Bubble Color
    -   **Replication Steps**: Use color picker or enter hex code for bubble color
    -   **Result**: Background elements in live preview should update to new bubble color
32. **Test Case**: Change Text Color
    -   **Replication Steps**: Use color picker or enter hex code for text color
    -   **Result**: Text elements in live preview should update to new color
33. **Test Case**: Reset Appearance
    -   **Replication Steps**: Click "Reset Appearance" button and confirm
    -   **Result**: All colors should revert to default values (Primary: #3B82F6, Bubble: #F3F4F6, Text: #1F2937)
34. **Test Case**: Color Input Validation
    -   **Replication Steps**: Enter invalid hex code (e.g., "invalid")
    -   **Result**: Should either prevent input or revert to previous valid color

---

### Page: Live Preview
35. **Test Case**: Bubble View Preview
    -   **Replication Steps**: Click "Bubble View" tab in live preview
    -   **Result**: Should show collapsed chatbot widget as it appears on websites
33. **Test Case**: Chat View Preview
    -   **Replication Steps**: Click "Chat View" tab in live preview
    -   **Result**: Should show expanded chatbot interface with full chat functionality
37. **Test Case**: Real-time Updates
    -   **Replication Steps**: Make changes in any customization tab while viewing preview
    -   **Result**: Preview should update immediately without page refresh
38. **Test Case**: Interactive Preview Testing
    -   **Replication Steps**: Type messages in preview chat interface
    -   **Result**: Should respond with configured welcome message, show suggested prompts, trigger dynamic prompts

---

### Page: Deploy Tab
39. **Test Case**: Copy Direct Link
    -   **Replication Steps**: Click "Copy" button next to direct link
    -   **Result**: Should copy link to clipboard and show success toast message
40. **Test Case**: Open Direct Link
    -   **Replication Steps**: Click "Open" button next to direct link
    -   **Result**: Should open chatbot in new tab/window at the direct link URL
41. **Test Case**: Show/Hide QR Code
    -   **Replication Steps**: Click "Show QR Code" button
    -   **Result**: Should display QR code below; clicking "Hide QR Code" should hide it
42. **Test Case**: Copy Website Script
    -   **Replication Steps**: Click copy button on website script code block
    -   **Result**: Should copy HTML script tag to clipboard with correct bot ID
43. **Test Case**: Modify Iframe Dimensions
    -   **Replication Steps**: Change width and height values for iframe
    -   **Result**: Iframe code should update immediately with new dimensions
44. **Test Case**: Copy Iframe Code
    -   **Replication Steps**: Click copy button on iframe code block
    -   **Result**: Should copy iframe HTML with current dimensions to clipboard

---

### Page: Save Functionality
45. **Test Case**: Save Changes with Valid Data
    -   **Replication Steps**: Make changes to agent configuration and click "Save Changes"
    -   **Result**: Should show "Success" toast, update "Unsaved changes" badge, and persist changes
46. **Test Case**: Save Without Required Fields
    -   **Replication Steps**: Clear agent name field and attempt to save
    -   **Result**: Should show validation error "Agent name is required" and prevent saving
47. **Test Case**: Unsaved Changes Indicator
    -   **Replication Steps**: Make any change to form fields
    -   **Result**: Should show "Unsaved changes" badge near save button
48. **Test Case**: Navigation with Unsaved Changes
    -   **Replication Steps**: Make changes and attempt to navigate away without saving
    -   **Result**: Should show confirmation dialog asking if user wants to leave with unsaved changes
49. **Test Case**: Save Loading State
    -   **Replication Steps**: Click "Save Changes" and observe button state
    -   **Result**: Button should show "Saving..." text and be disabled during save operation

---

### Page: Error Handling & Edge Cases
50. **Test Case**: Network Error Handling
    -   **Replication Steps**: Disconnect internet and attempt to save changes
    -   **Result**: Should show error toast with appropriate message about connection failure
51. **Test Case**: Invalid Agent ID
    -   **Replication Steps**: Navigate to `/admin/agent/invalid-id/customize`
    -   **Result**: Should show "Agent not found" error and redirect to main dashboard
52. **Test Case**: Unauthorized Access
    -   **Replication Steps**: Access admin panel without authentication
    -   **Result**: Should redirect to login page
53. **Test Case**: Large Image Upload
    -   **Replication Steps**: Attempt to upload very large image file (>5MB)
    -   **Result**: Should show appropriate error message and not proceed with upload
54. **Test Case**: Form Validation Messages
    -   **Replication Steps**: Submit forms with various invalid inputs
    -   **Result**: Should show specific, user-friendly error messages for each validation failure

---

### Test Automation Analysis

Based on the provided test cases and the existing codebase, here's an analysis of which tests can be automated, which require manual supervision, and which existing tests were not explicitly mentioned in your list.

#### (A) Test Cases That Can Be Completed Automatically

The majority of the provided test cases, especially those involving UI rendering, component interaction, form input, and navigation, are highly automatable using your existing testing framework (likely Vitest with React Testing Library). These tests can mock data, simulate user events, and assert on the resulting UI state or routing changes.

**Admin Dashboard (Main)**: All 6 test cases.
**Agent Dashboard (Individual Agent)**: Test cases 7, 8, 9, 10, 11. (Test case 12 is partially automatable).
**Customize > Basic**: All 8 test cases.
**Customize > Prompts**: Test cases 9, 10, 11, 12, 13, 14, 15. (Test case 16 is partially automatable).
**Customize > Lead Collection**: Test cases 17, 18, 19, 20, 21, 22, 23, 24, 27, 28, 29. (Test cases 25, 26 are partially automatable).
**Customize > Style**: All 5 test cases.
**Live Preview**: Test cases 35, 36, 37. (Test case 38 is partially automatable).
**Deploy Tab**: Test case 43. (Test cases 39, 40, 41, 42, 44 are manual or partially automatable).
**Save Functionality**: All 5 test cases.
**Error Handling & Edge Cases**: All 5 test cases.

**Examples of Automatable Tests and How:**

*   **Dashboard Loading (Admin Dashboard)**:
    *   **How to Automate**: Render the `AdminDashboard` component. Mock authentication state to simulate a logged-in user. Mock API calls to return user data, agent counts, and a list of agents. Use `screen.getByText` or `screen.findByText` to assert the presence of the user's email, agent count statistics, and the names/descriptions of agent cards.
*   **Create New Agent Button (Admin Dashboard)**:
    *   **How to Automate**: Render the `AdminDashboard`. Find the "Create New Agent" button using `screen.getByRole('button', { name: /create new agent/i })`. Simulate a click using `userEvent.click()`. Assert that the routing library (e.g., React Router) has navigated to `/admin/agent/new/customize` by checking the history object or a mocked navigation function.
*   **Verify Max Image Size (Customize > Basic)**:
    *   **How to Automate**: Render the image upload component. Create a mock `File` object with a `size` property greater than 2MB and a valid `type`. Simulate a file selection event using `userEvent.upload()`. Assert that an error message like "File size must be less than 2MB" is displayed using `screen.getByText`.
*   **Change Primary Color (Customize > Style)**:
    *   **How to Automate**: Render the style customization component and the live preview. Find the color input for primary color. Simulate typing a new hex code (e.g., `#FF0000`) into the input. Assert that the live preview's relevant elements (e.g., buttons, accents) have their CSS `color` or `background-color` properties updated to the new value.

#### (B) Test Cases That Need Manual Supervision

Some test cases involve visual inspection, external system interactions, or subjective user experience evaluations that are difficult or impossible to fully automate with typical unit/integration tests. These are best handled through manual testing.

*   **Page: Agent Dashboard (Individual Agent)**
    *   **12. Deploy Tab Functionality**: While the presence of elements can be automated, verifying the actual functionality of the direct link (opening in a new tab), the QR code's scannability, and the correct embedding behavior of the website script/iframe requires manual verification in a live environment.
*   **Page: Customize > Basic**
    *   **3. Change Avatar Image**: While the preview update can be automated, verifying the actual file upload to a server and its persistence across sessions (e.g., by refreshing the page or checking the deployed chatbot) often requires end-to-end testing or manual checks.
*   **Page: Customize > Prompts**
    *   **16. Test Dynamic Prompt Functionality**: Simulating typing and asserting the hover suggestion in the live preview can be automated. However, verifying the full, real-world behavior of the dynamic prompt within a deployed chatbot (e.g., how it interacts with other prompts, its responsiveness) might benefit from manual testing.
*   **Page: Customize > Lead Collection**
    *   **25. Save Custom Form Field without keywords**: Verifying that the form *appears in chat history* after two messages requires a full end-to-end test or manual interaction with the deployed chatbot.
    *   **26. Save Custom Form Field without backup trigger**: Similar to 25, verifying that the form *appears in chat history* after a keyword trigger requires end-to-end or manual testing.
*   **Page: Live Preview**
    *   **38. Interactive Preview Testing**: While basic interactions can be automated, thoroughly testing the conversational flow, AI responses, and complex interactions within the live preview is best done manually to assess the user experience.
*   **Page: Deploy Tab**
    *   **39. Copy Direct Link**: Automated tests cannot directly interact with the user's clipboard. Manual verification is needed to confirm the link is copied correctly.
    *   **40. Open Direct Link**: Automated tests cannot reliably open a new browser tab/window and verify its content. This requires manual inspection.
    *   **41. Show/Hide QR Code**: While the visibility toggle can be automated, verifying the QR code's scannability and correctness requires visual inspection.
    *   **42. Copy Website Script**: Similar to copying the direct link, clipboard interaction is manual.
    *   **44. Copy Iframe Code**: Similar to copying the direct link, clipboard interaction is manual.

**General Areas Requiring Manual Supervision:**

*   **Visual Regression Testing**: Ensuring the UI looks correct and consistent across different browsers, devices, and screen sizes.
*   **User Experience (UX) and Usability**: Assessing the overall flow, intuitiveness, and ease of use of the admin panel.
*   **Accessibility**: Verifying that the application is usable by individuals with disabilities (e.g., keyboard navigation, screen reader compatibility).
*   **Performance**: Measuring load times, responsiveness under stress, and overall application speed.
*   **End-to-End Scenarios**: Complex workflows that span multiple pages and involve interactions with backend services or external APIs in a live environment.

#### (C) Test Cases Not Mentioned in This List (Existing in Codebase)

Your project has a robust set of automated tests covering many other functionalities that were not explicitly detailed in your provided list of 54 test cases. These existing tests are crucial for maintaining the quality of other parts of your application.

**Existing Automated Tests (from `test/__tests__` and `test/integration`):**

*   `AgentConversationHistory.test.ts`: Tests related to the history of conversations for an agent.
*   `AgentService.test.ts`: Unit tests for the `agentService.ts` module, likely covering CRUD operations and API interactions for agents.
*   `agentValidation.test.ts`: More specific and comprehensive tests for agent-related data validation rules.
*   `Auth.test.tsx`: Core tests for authentication components and logic.
*   `AuthCallback.test.tsx`: Tests for handling authentication callbacks (e.g., from OAuth providers).
*   `ChatbotLoginModal.test.tsx`: Tests for the login modal displayed within the chatbot.
*   `ChatbotPreviewPage.test.ts`: Tests specifically for the chatbot preview page.
*   `ChatbotUI.test.tsx`: Comprehensive tests for the main chatbot user interface and its core functionalities.
*   `ConversationHistoryTab.test.ts`: Tests for the conversation history tab within the UI.
*   `ConversationService.test.ts`: Unit tests for the `conversationService.ts` module.
*   `Embed.test.tsx`: Tests related to the chatbot's embedding capabilities.
*   `FeedbackService.test.ts`: Unit tests for the `feedbackService.ts` module.
*   `FeedbackTab.test.ts`: Tests for the feedback collection tab.
*   `Iframe.test.tsx`: Tests specifically for the iframe integration of the chatbot.
*   `Index.test.tsx`: Tests for the application's main entry point or index page.
*   `LeadCollectionForm.test.ts`: Tests for the standalone lead collection form component.
*   `LeadService.test.ts`: Unit tests for the `leadService.ts` module.
*   `missing-coverage.test.ts`: This file might be a placeholder or a report for areas lacking test coverage.
*   `OpenAIService.test.ts`: Unit tests for the `openAIService.ts` module, covering interactions with the OpenAI API.
*   `PromptResponseService.test.ts`: Unit tests for the `promptResponseService.ts` module.
*   `QnATab.test.tsx`: Tests for the Q&A tab.
*   `RotatingMessagesTab.isolated.test.tsx`: Isolated tests for the rotating messages tab, possibly focusing on specific behaviors.
*   `UploadService.test.ts`: Unit tests for the `uploadService.ts` module.
*   `useAuth.test.tsx`: Tests for the custom React hook responsible for authentication state.
*   `utils.test.ts`: Tests for general utility functions.
*   `validation.test.ts`: General validation tests that might not be specific to agents.
*   `integration.test.ts`: Broader integration tests that verify the interaction between multiple components or services across the application.

**Other Test-Related Files:**

*   `test/README.md`: Documentation for the test directory.
*   `test/setup.ts`: Test setup file, likely for configuring the testing environment (e.g., Jest/Vitest setup, global mocks).
