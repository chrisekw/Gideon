# **App Name**: Gideon Eye

## Core Features:

- Dashboard: Display a dashboard featuring a camera button, image preview, text input area, and an “Ask AI” submission button.
- AI Image Analysis: Use a Gemini multimodal tool via the `/analyze-image` API endpoint to analyze the image with an optional user-provided question, then provide an answer or useful information about what’s in the image.
- Styled Answer Box: Show the AI-generated description, a contextual answer (like product information, plant identification, or homework help), and optional sources in a markdown-formatted answer box.
- Loading and Error Handling: Display loading state animations and handle error messaging gracefully when the API call is in process or encounters issues.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) to convey intelligence, vision, and futuristic tech.
- Background color: Very light indigo (#F0F2F9) for a clean, calming backdrop.
- Accent color: Bright magenta (#E91E63) for interactive elements like the 'Ask AI' button, adding a pop of energetic color.
- Body and headline font: 'Inter', a grotesque-style sans-serif known for its modern, neutral, and machined look.
- Utilize lucide-react icons for camera, upload, and AI functionalities.
- Employ a clean, responsive layout achieved using Tailwind CSS, optimized for both mobile and desktop viewing.
- Incorporate subtle animations with Framer Motion for smooth transitions, providing a visually engaging and modern feel.