# Chatbot Project

## Project Vision

This project provides a highly customizable chatbot widget that can be embedded on any website. It's designed to help businesses engage with their users, answer questions, and capture leads automatically. The integrated admin panel allows for easy management of the chatbot's appearance, behavior, and knowledge base without needing to touch any code.

## Key Features

- **Customizable Chatbot Widget:** Easily embed a chat widget on any website.
- **Admin Panel:** A user-friendly interface to manage all aspects of your chatbot.
- **Q&A Management:** Train your chatbot by providing it with questions and answers.
- **Lead Collection:** Capture user information through a customizable form in the chat.
- **AI Integration:** Powered by OpenAI to provide intelligent and conversational responses.
- **Third-Party Integrations:** Connect with services like Make.com via webhooks for extended functionality.
- **Style Customization:** Tailor the look and feel of the widget to match your brand.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, TailwindCSS, shadcn-ui
- **Backend & Database:** Supabase
- **AI:** OpenAI
- **Deployment:** Vercel, Render

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (or your preferred package manager)

### Local Development

1.  **Clone the repository:**
    ```sh
    git clone <YOUR_GIT_URL>
    cd <YOUR_PROJECT_NAME>
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    - Copy the example environment file:
      ```sh
      cp .env.example .env
      ```
    - Populate the `.env` file with your credentials for Supabase, OpenAI, etc.

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

### Deployment on Render

You can deploy this application as a **Static Site** on Render.

1.  **Create a new "Static Site"** on Render and connect your GitHub repository.
2.  **Configure the build settings:**
    - **Build Command:** `npm run build`
    - **Publish Directory:** `dist`
3.  **Add Environment Variables:**
    - Go to the "Environment" tab for your new service.
    - Add all the necessary environment variables from your `.env` file (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
    > **Important:** Since this is a Vite project, ensure all environment variables that need to be exposed to the frontend are prefixed with `VITE_`.

4.  **Deploy:**
    - Click "Create Static Site". Render will automatically build and deploy your application.