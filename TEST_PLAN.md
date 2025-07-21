# Comprehensive Test Plan for VCRO Chatbot Widget

## 1. Introduction

This document outlines a comprehensive test plan for the VCRO Chatbot Widget application. The goal is to ensure the application's functionality, reliability, and user experience across all its features, from the administrative panel to the end-user chatbot widget.

## 2. Testing Strategy

The testing strategy will employ a multi-layered approach, combining:

*   **Unit Tests:** Focusing on individual functions, components (pure functions, small UI elements), and service methods in isolation.
*   **Integration Tests:** Verifying the interaction between different modules, such as a React component interacting with a custom hook, or a service interacting with the Supabase client.
*   **Component Tests (UI):** Testing React components in isolation, simulating user interactions and asserting rendered output. This will primarily use React Testing Library.
*   **End-to-End (E2E) Tests:** Simulating full user journeys through the application, covering critical paths and integrations. (Note: E2E tests are outlined but not implemented in this phase, as they typically require a separate framework like Cypress or Playwright).

**Tools:**
*   **Vitest:** For unit and integration testing of JavaScript/TypeScript code.
*   **React Testing Library:** For testing React components.
*   **Mocking:** `vi.mock` from Vitest will be used extensively to mock external dependencies (e.g., Supabase, `fetch` calls, `localStorage`).

## 3. Test Environment Setup

*   **Local Development Environment:** Node.js, npm/yarn, Git.
*   **Testing Framework:** Vitest.
*   **Database:** Supabase (mocked for most unit/integration tests, real for E2E if implemented).
*   `.env` configuration for API keys and database URLs.

## 4. Test Phases and Detailed Test Cases

### Phase 1: Core UI Components & Utilities

This phase focuses on the foundational UI components and utility functions, ensuring they behave as expected in isolation.

*   **`src/lib/utils.ts`**
    *   **`cn` function:**
        *   Should correctly merge Tailwind CSS classes.
        *   Should handle empty inputs.
        *   Should handle conditional classes.
    *   **`isValidUUID` function:**
        *   Should return `true` for valid UUID v4 strings.
        *   Should return `false` for invalid UUID strings (malformed, wrong version).
        *   Should return `false` for non-string inputs.
    *   **`normalizeLinkedInUrl` function:**
        *   Should normalize various LinkedIn profile URL formats to a consistent format.
        *   Should return `null` for invalid or non-LinkedIn URLs.
        *   Should handle LinkedIn usernames without full URLs.

*   **`src/components/CodeBlock.tsx`**
    *   Should render the provided code and language label.
    *   Should display a "Copy" button if `onCopy` prop is provided.
    *   `onCopy` callback should be triggered when the copy button is clicked.

*   **`src/components/LeadCollectionForm.tsx`**
    *   Should render input fields based on the `fields` prop (text, email, phone, textarea, select, checkbox).
    *   Should display required indicators for required fields.
    *   Should update `formData` state on input change.
    *   Should display validation errors for invalid inputs (e.g., empty required fields, invalid email, invalid LinkedIn URL).
    *   Should call `onSubmit` with correct `formData` when the form is valid and submitted.
    *   Should not call `onSubmit` if the form is invalid.
    *   Should call `onCancel` when the cancel button is clicked.

*   **`src/components/ui/*` (Shadcn UI components)**
    *   For each custom UI component (e.g., `Button`, `Input`, `Select`, `Switch`, `Dialog`, `Toast`):
        *   **Rendering:** Should render correctly with default props.
        *   **Props:** Should apply various props (e.g., `variant`, `size`, `disabled`, `className`) correctly.
        *   **Interactions:** Should respond to user interactions (e.g., clicks, input changes) and trigger appropriate callbacks.
        *   **Accessibility:** (Basic checks) Ensure elements have appropriate ARIA attributes where applicable.

### Phase 2: Authentication & Authorization

This phase covers user authentication flows and access control.

*   **`src/hooks/useAuth.tsx`**
    *   **`AuthProvider`:**
        *   Should provide `user`, `profile`, `loading` states correctly based on Supabase auth state.
        *   Should handle initial loading state.
        *   Should update states on `onAuthStateChange` events (login, logout).
    *   **`signInWithGoogleForAdmin`:**
        *   Should initiate Google OAuth sign-in.
        *   Should handle successful sign-in and update auth state.
        *   Should handle errors during sign-in.
    *   **`signOut`:**
        *   Should log out the user from Supabase.
        *   Should clear user and profile states.

*   **`src/pages/Auth.tsx`**
    *   **Sign In Tab:**
        *   Should display email and password fields.
        *   Should show validation errors for empty fields.
        *   Should call `supabase.auth.signInWithPassword` with correct credentials.
        *   Should display loading state during sign-in.
        *   Should display error messages for failed sign-in attempts (e.g., invalid credentials, email not confirmed).
        *   Should navigate to `/` on successful sign-in.
        *   Should allow sign-in with Google.
    *   **Sign Up Tab:**
        *   Should display full name, email, password, and confirm password fields.
        *   Should show validation errors for empty fields, password mismatch, and weak passwords.
        *   Should call `supabase.auth.signUp` with correct data.
        *   Should display loading state during sign-up.
        *   Should display error messages for failed sign-up attempts (e.g., email already exists).
        *   Should display success message and clear form on successful sign-up.

*   **`src/components/ProtectedRoute.tsx`**
    *   Should render children if `user` is authenticated and `profile.role` is 'admin' or 'superadmin'.
    *   Should redirect to `/auth` if no `user` is authenticated.
    *   Should redirect to `/` if `user` is authenticated but `profile.role` is not 'admin' or 'superadmin'.
    *   Should display a loading indicator while authentication state is resolving.

*   **`src/components/ChatbotLoginModal.tsx`**
    *   Should open and close correctly based on `isOpen` prop.
    *   Should display email input for OTP request.
    *   Should send OTP via `supabase.auth.signInWithOtp`.
    *   Should display OTP input after OTP is sent.
    *   Should verify OTP via `supabase.auth.verifyOtp`.
    *   Should call `onSuccess` and `onClose` on successful login.
    *   Should handle and display errors during OTP send/verify.
    *   Should allow sign-in with Google.

### Phase 3: Agent Management (Admin Panel)

This phase covers the creation, customization, and listing of chatbot agents.

*   **`src/services/agentService.ts`**
    *   **`getAgents(userId)`:**
        *   Should fetch all agents associated with a given `userId`.
        *   Should correctly parse JSON fields (`cta_buttons`, `colors`, `lead_form_fields`).
        *   Should include `total_messages` and `total_conversations` metrics.
        *   Should handle errors during data fetching.
    *   **`getAgent(id)`:**
        *   Should fetch a single agent by ID.
        *   Should return `null` if agent not found (`PGRST116` error).
        *   Should correctly parse JSON fields.
        *   Should handle other errors.
    *   **`createAgent(agentData)`:**
        *   Should require an authenticated user.
        *   Should insert new agent data into Supabase.
        *   Should handle default values for optional fields.
        *   Should return the created agent object.
        *   Should handle errors (e.g., database constraints).
    *   **`updateAgent(id, agentData)`:**
        *   Should update existing agent data by ID.
        *   Should only update provided fields.
        *   Should handle errors.
    *   **`deleteAgent(id)`:**
        *   Should delete an agent by ID.
        *   Should handle errors.
    *   **`getAgentMetrics(agentId)`:**
        *   Should correctly calculate `totalSessions`, `totalMessages`, `todayMessages`, `yesterdayMessages`, `leadsRequiringAttention`, and `satisfactionRate`.
        *   Should return zeroed metrics if no sessions exist.
        *   Should handle errors during metric fetching.
    *   **`getAdminMetrics()`:**
        *   Should correctly calculate overall admin metrics.
        *   Should handle errors.
    *   **`getUserPerformanceData(userId)`:**
        *   Should fetch persona data for a user.
        *   Should return `null` if no data found.
        *   Should handle errors.
    *   **`getUserPerformanceDataByLinkedIn(linkedinUrl)`:**
        *   Should fetch user ID from profile using LinkedIn URL.
        *   Should then fetch persona data using the retrieved user ID.
        *   Should return `null` if no profile or persona data found.
        *   Should handle errors.

*   **`src/schemas/agentValidation.ts`**
    *   **`agentValidationSchema`:**
        *   Should correctly validate `name` (min/max length).
        *   Should correctly validate `description` (max length).
        *   Should correctly validate `avatar_url` (URL format, optional).
        *   Should correctly validate `welcome_message` (min/max length).
        *   Should correctly validate `colors` (hex format).
        *   Should correctly validate `cta_buttons` (label, URL format).
        *   Should correctly validate `lead_form_fields` (structure, types).
        *   Should correctly validate `linkedin_url` (URL format, optional).
        *   Should correctly validate `ai_model_config`, `openai_api_key`, `ai_mode`, `openai_assistant_id`.
    *   **`validateAgentData`:**
        *   Should return `success: true` and `data` for valid input.
        *   Should return `success: false` and `errors` array for invalid input.
    *   **`validateAgentDataForTests`:**
        *   Should return simplified error messages for testing purposes.

*   **`src/hooks/useAgentCustomizeForm.tsx`**
    *   **`handleInputChange`:** Should update `formData` for basic fields.
    *   **`handleColorChange`:** Should update `formData.colors` correctly.
    *   **`addCtaButton` / `removeCtaButton`:** Should manage CTA buttons array.
    *   **`addLeadFormTrigger` / `removeLeadFormTrigger`:** Should manage lead form triggers array.
    *   **`addLeadFormField` / `removeLeadFormField`:** Should manage lead form fields array.
    *   **`handleResetAppearance`:** Should reset relevant `formData` fields to default.
    *   Should correctly set `hasUnsavedChanges` when `formData` changes.

*   **`src/pages/AdminDashboard.tsx`**
    *   Should display a loading spinner initially.
    *   Should redirect to login if not authenticated.
    *   Should display overall metrics (Total Agents, Conversations, Today's Messages, Response Rate).
    *   Should list all agents with their status, description, and metrics.
    *   Should have buttons to create new agents, customize existing agents, and view chat history.
    *   Should handle sign-out.
    *   Should display a message if no agents are found.

*   **`src/pages/AgentCreate.tsx`**
    *   Should render all customization tabs (Basic, Rotating Messages, Lead Collection, Style, AI Settings, Personalization).
    *   Should allow input for all agent properties.
    *   Should display validation errors for invalid inputs.
    *   Should show a live preview of the chatbot widget (collapsed and expanded modes).
    *   Should call `AgentService.createAgent` on save.
    *   Should navigate to the customize page of the new agent on success.
    *   Should display saving state.
    *   Should indicate unsaved changes.
    *   Should allow resetting appearance.

*   **`src/pages/AgentCustomize.tsx`**
    *   Should load existing agent data and populate the form.
    *   Should render all customization tabs.
    *   Should allow editing all agent properties.
    *   Should display validation errors.
    *   Should show a live preview of the chatbot widget.
    *   Should call `AgentService.updateAgent` on save.
    *   Should display saving state.
    *   Should indicate unsaved changes.
    *   Should allow resetting appearance.
    *   Should handle agent not found scenario.

*   **`src/components/agent-customize/*Tabs.tsx`**
    *   **`BasicInfoTab`:**
        *   Should render name, description, avatar upload, welcome message, and status switch.
        *   Should correctly bind inputs to `formData`.
        *   Should display field-specific validation errors.
    *   **`RotatingMessagesTab`:**
        *   Should allow adding and removing rotating messages.
        *   Should display the list of rotating messages.
    *   **`LeadCollectionTab`:**
        *   Should toggle lead collection enabled/disabled.
        *   Should manage CTA buttons (add/remove).
        *   Should manage keyword triggers (add/remove).
        *   Should manage backup trigger settings.
        *   Should manage custom form fields (add/remove, type selection).
        *   Should allow editing submit button text and success message.
        *   Should correctly handle LinkedIn profile field (enable/disable, required, label).
    *   **`StyleCustomizationTab`:**
        *   Should allow selecting primary, bubble, and text colors via color pickers and hex inputs.
        *   Should display field-specific validation errors for hex format.
    *   **`AiSettingsTab`:**
        *   Should allow selecting AI mode (chat completion, assistant).
        *   Should allow input for OpenAI API key.
        *   Should fetch and display available models/assistants based on API key.
        *   Should handle loading states and errors during API key validation/resource fetching.
    *   **`PersonalizationTab`:**
        *   Should allow input for LinkedIn URL.
        *   Should allow setting LinkedIn prompt message count.

*   **`src/services/uploadService.ts`**
    *   **`validateFile`:**
        *   Should return `null` for valid image files (size, type).
        *   Should return error messages for invalid file size or type.
    *   **`uploadAvatar`:**
        *   Should upload a file to Supabase storage.
        *   Should call `onProgress` callback during upload.
        *   Should return the public URL and path.
        *   Should handle various upload errors (network, authentication, storage).
    *   **`deleteAvatar`:** Should delete a file from Supabase storage.
    *   **`createPreviewUrl` / `revokePreviewUrl`:** Should correctly manage object URLs for image previews.

### Phase 4: Chatbot Widget Core Functionality

This phase focuses on the end-user facing chatbot widget.

*   **`src/hooks/useChatbotLogic.ts`**
    *   **`initializeSession`:**
        *   Should correctly initialize/update session for anonymous users (using cookies).
        *   Should correctly initialize/update session for authenticated users (fetching existing or creating new).
        *   Should fetch and set initial chat history.
        *   Should prevent unnecessary re-initialization.
        *   Should handle errors during session initialization and fall back to a generated session ID.
        *   Should correctly set `isLoggedIn` state.
        *   Should clear chat history when a new session is genuinely started (e.g., after logout or new login).
    *   **`loadMoreMessages`:**
        *   Should fetch older messages and prepend them to `chatHistory`.
        *   Should maintain scroll position after loading more messages.
        *   Should update `messagesOffset` and `hasMoreMessages` states.
    *   **`handleSendMessage`:**
        *   Should add user message to `chatHistory` immediately.
        *   Should clear message input and suggestions.
        *   Should set `isBotTyping` to `true`.
        *   Should call `PromptResponseService.findMatchingResponse` first.
        *   If no Q&A match, should call `OpenAIService.getChatCompletion` (or assistant API).
        *   Should handle inappropriate words.
        *   Should handle lead form triggers (display form, skip LLM).
        *   Should add bot response to `chatHistory`.
        *   Should set `isBotTyping` to `false` after response.
        *   Should increment `messageCount`.
        *   Should persist messages to `ConversationService` if not in preview mode.
        *   Should handle persona data integration into the prompt.
        *   Should handle LinkedIn prompt logic.
    *   **`handleMessageChange`:** Should update message input state and trigger smart suggestions.
    *   **`getSmartSuggestions`:** Should fetch dynamic prompts based on keywords.
    *   **`handlePromptClick`:** Should set message input and clear suggestions.
    *   **`handleCopyMessage`:** Should copy message text to clipboard and display feedback.
    *   **`handleFeedback`:** Should call `FeedbackService.createFeedback` and update `chatHistory` with feedback type.
    *   **`handleLoginClick`:** Should toggle login modal visibility.
    *   **`handleLoginSuccess`:** Should fetch user profile, set `currentUser` and `isLoggedIn`, close modal, and allow `initializeSession` to handle history.
    *   **`handleSignOut`:** Should sign out user, clear states, and trigger session re-initialization.
    *   **`handleLinkedInSubmit`:** Should normalize URL, update user profile, display feedback, and add bot message.
    *   **`handleLeadFormSubmit`:** Should submit lead data, update states, and add success message.
    *   **`handleCtaButtonClick`:** Should increment CTA click count and open URL.

*   **`src/components/ChatbotUI.tsx`**
    *   **Collapsed Mode:**
        *   Should display rotating messages with animation.
        *   Should display agent avatar and name.
        *   Should expand to chat view on click.
    *   **Expanded Mode:**
        *   Should display chat header (agent avatar, name, description, login/logout buttons).
        *   Should display welcome message and suggested prompts initially.
        *   Should render chat history (user and bot messages) correctly.
        *   Should display bot typing indicator.
        *   Should display lead collection form when triggered.
        *   Should display LinkedIn prompt when triggered.
        *   Should have message input, send button, and action buttons (mic, attachment).
        *   Should allow copying bot messages and providing feedback.
        *   Should auto-scroll to the bottom of the chat.
        *   Should lazy load older messages on scroll to top.
        *   Should apply dynamic colors from `chatbotData`.
    *   Should handle loading state.

*   **`src/types/sessionManager.ts`**
    *   **`getSessionCookie` / `setSessionCookie` / `clearSessionCookie`:** Should correctly manage session ID in browser cookies.
    *   **`generateSessionId`:** Should generate a valid UUID.

*   **`src/pages/Embed.tsx` / `src/pages/Iframe.tsx` / `src/pages/ChatbotPreviewPage.tsx`**
    *   Should correctly load agent data based on `agentId` from URL params.
    *   Should render `ChatbotUI` with appropriate `previewMode` and `isLivePreview` props.
    *   Should handle loading and error states.
    *   `Iframe.tsx` should correctly apply alignment based on URL query params.

### Phase 5: Conversation & Feedback Management

This phase focuses on the admin panel features for managing conversations and feedback.

*   **`src/services/conversationService.ts`**
    *   **`getChatSessions`:**
        *   Should fetch chat sessions for a given agent.
        *   Should apply filters (date, status, keyword) correctly.
        *   Should include message count, last message preview, and user profile data.
        *   Should handle `includeDeleted` and `forChatbotWidget` flags.
        *   Should identify and hard-delete anonymous, empty sessions.
        *   Should handle errors.
    *   **`getChatMessages`:**
        *   Should fetch messages for a given session ID.
        *   Should apply limit and offset for pagination.
        *   Should return messages in chronological order.
        *   Should handle errors.
    *   **`addMessage`:**
        *   Should insert a new message into `chat_messages`.
        *   Should update `last_message_at`, `last_message_preview`, `status` to 'unread', and `deleted_by_admin` to `false` in `chat_sessions`.
        *   Should handle errors.
    *   **`createOrUpdateSession`:**
        *   Should create a new session if none exists (anonymous or authenticated).
        *   Should update an existing session (e.g., associate anonymous session with a logged-in user).
        *   Should store session ID in local storage.
        *   Should handle errors.
    *   **`getConversationDetails`:** (Similar to `getChatMessages` but for admin view)
    *   **`getLatestSessionForUserAndAgent`:**
        *   Should fetch the latest session for a specific user and agent.
        *   Should respect `forChatbotWidget` flag for `deleted_by_admin` filtering.
        *   Should return `null` if no session found.
    *   **`updateLinkedInProfile`:** Should update the `linkedin_profile_url` for a user's profile.
    *   **`softDeleteChatSession`:** Should set `deleted_by_admin` to `true` for a session.
    *   **`hardDeleteChatSession`:**
        *   Should permanently delete anonymous sessions.
        *   Should soft-delete authenticated sessions.
        *   Should handle cascading deletes for messages and feedback.
    *   **`updateChatSessionStatus`:** Should update the status of a chat session.
    *   **`incrementCtaButtonClick`:** Should increment the click count for a specific CTA button.

*   **`src/services/feedbackService.ts`**
    *   **`createFeedback` / `addFeedback`:**
        *   Should add new feedback or update existing feedback for a message.
        *   Should validate UUIDs.
        *   Should handle errors.
    *   **`getFeedbackForAgent`:**
        *   Should fetch feedback for a given agent, optionally filtered by type.
        *   Should include associated message content and session user details.
        *   Should handle errors.
    *   **`getFeedbackStats`:**
        *   Should calculate total, positive, and negative feedback counts for an agent.
        *   Should handle errors.

*   **`src/components/ConversationHistoryTab.tsx`**
    *   Should display a table of chat sessions for the agent.
    *   Should allow filtering by date range, keyword, and status.
    *   Should allow exporting conversations to CSV.
    *   Should allow viewing detailed messages for a selected conversation.
    *   Should update session status to 'read' when viewed.
    *   Should allow deleting individual conversations (soft or hard delete based on user type).
    *   Should allow deleting all conversations (soft/hard based on user type).
    *   Should display loading state.
    *   Should display a message if no conversations are found.

*   **`src/components/FeedbackTab.tsx`**
    *   Should display feedback statistics (total, positive, negative, satisfaction rate).
    *   Should display a table of individual feedback entries.
    *   Should allow filtering feedback by type (positive/negative/all).
    *   Should display associated message content and user details.
    *   Should display insights and recommendations based on feedback stats.
    *   Should display loading state.
    *   Should display a message if no feedback is found.

*   **`src/components/QnATab.tsx`**
    *   Should display existing suggested and dynamic prompts.
    *   Should allow adding new Q&A pairs (prompt, response, dynamic, keywords).
    *   Should allow editing existing Q&A pairs.
    *   Should allow deleting Q&A pairs.
    *   Should validate input fields (prompt, response, keywords).
    *   Should display loading state.
    *   Should display a message if no Q&A pairs are found.

*   **`src/pages/AgentConversationHistory.tsx`**
    *   Should display a sidebar with a list of chat sessions.
    *   Should allow searching sessions by user name, email, or session ID.
    *   Should display messages for the selected session in the main panel.
    *   Should allow deleting individual sessions (soft or hard delete).
    *   Should allow deleting all sessions.
    *   Should update session status to 'read' when viewed.
    *   Should display loading state.
    *   Should display messages if no sessions or messages are found.

### Phase 6: OpenAI Integration

This phase focuses on the interaction with the OpenAI API.

*   **`src/services/openAIService.ts`**
    *   **Constructor:**
        *   Should initialize `OpenAI` client with provided API key.
        *   Should set `OpenAI-Beta` header for assistant mode.
        *   Should throw error if API key is missing.
    *   **`getChatCompletion(prompt, persona, threadId)`:**
        *   If `aiMode` is 'chat_completion', should call `openai.chat.completions.create`.
        *   Should correctly include persona data in the system message if provided.
        *   Should return the bot's response.
        *   Should handle errors from OpenAI API.
        *   If `aiMode` is 'assistant', should delegate to `getAssistantResponse`.
    *   **`getAssistantResponse(userMessage, threadId)`:**
        *   Should create a new thread if `threadId` is not provided.
        *   Should add user message to the thread.
        *   Should create and poll a run for the assistant.
        *   Should retrieve and return the assistant's response.
        *   Should return the `threadId`.
        *   Should handle errors and failed run statuses.
        *   Should throw error if `assistantId` is missing for assistant mode.
    *   **`listModels()`:** Should fetch and return a list of available OpenAI models.
    *   **`listAssistants()`:** Should fetch and return a list of available OpenAI assistants.

### Phase 7: End-to-End Scenarios

These tests cover critical user flows through the entire application.

*   **Admin User Journey:**
    1.  Sign up/Sign in as an admin.
    2.  Create a new agent, configuring basic info, rotating messages, and style.
    3.  Verify the agent appears on the dashboard.
    4.  Customize the agent, adding Q&A pairs and lead collection settings.
    5.  Verify changes are reflected in the live preview.
    6.  Deploy the agent using the embed script.
    7.  View conversation history and feedback for the agent.
    8.  Delete a conversation.
    9.  Sign out.

*   **Chatbot User Journey (Anonymous):**
    1.  Access the chatbot widget (via embed or iframe).
    2.  Observe rotating messages.
    3.  Expand the chatbot.
    4.  Send a message that triggers a static Q&A response.
    5.  Send a message that triggers a dynamic Q&A response.
    6.  Send a message that triggers the lead collection form.
    7.  Submit the lead form.
    8.  Send a message that triggers the LinkedIn prompt.
    9.  Provide feedback (thumbs up/down) on a bot message.
    10. Close the chatbot.
    11. Re-open the chatbot and verify chat history persists.

*   **Chatbot User Journey (Authenticated):**
    1.  Access the chatbot widget.
    2.  Log in via the chatbot modal.
    3.  Send messages and verify history persists across sessions.
    4.  Log out.
    5.  Verify chat history is cleared and a new anonymous session starts.

*   **Error Handling Scenarios:**
    *   Attempt to create an agent with invalid data.
    *   Attempt to send a message to the chatbot when OpenAI API key is invalid.
    *   Attempt to upload an invalid image for agent avatar.
    *   Attempt to access protected routes without authentication.

## 5. Test Implementation (Next Steps)

Following the approval of this test plan, the next steps will involve:

1.  **Updating Existing Tests:** Review and update `AgentService.test.ts` and `useAuth.test.tsx` to align with the detailed test cases.
2.  **Implementing New Tests:** Create new test files for `ConversationService`, `FeedbackService`, `PromptResponseService`, `OpenAIService`, `UploadService`, `useChatbotLogic`, and all relevant React components (`ChatbotUI`, `ChatbotLoginModal`, `ConversationHistoryTab`, `FeedbackTab`, `QnATab`, `LeadCollectionForm`, and the `agent-customize` tabs).
3.  **Running Tests:** Execute tests using `npm test` and ensure all tests pass.
4.  **Code Coverage:** Aim for high code coverage, especially for critical business logic and API interactions.
5.  **Refinement:** Continuously refine test cases and implementation based on new features or bug fixes.
