# CanIBunk

 Know if its safe to bunk before you bunk. The ultimate balance between class bunks and attendance!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)](https://www.typescriptlang.org/)

## About The Project

**CanIBunk** is an attendance tracking application designed specifically to maintain optimal attendance while making informed decisions about class attendance. Never wonder "Will my attendance drop too much if I skip today or a month later?" again!

### Key Features

- **Calendar Interface**: Visual calendar showing your attendance patterns with color-coded indicators
- **Attendance Tracking**: Monitor your attendance percentage for each course
- **Target-based Predictions**: Set attendance goals and see how many classes you can safely skip
- **Multi-course Management**: Track attendance for multiple courses simultaneously
- **Timetable Integration**: Set up your weekly schedule with breaks and lunch hours
- **Flexible Marking**: Mark days as attending, bunking, holidays, or exams
- **Local Storage**: All data stored locally in your browser for privacy
- **No Login Required**: No login require to use this application

<img width="1030" height="753" alt="image" src="https://github.com/user-attachments/assets/47e1eea3-3888-4e6d-8ef4-7d668ad2a951" />


## Project Structure

```
CanIBunk/
├── app/                          # Next.js App Router
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page with routing logic
├── components/                   # React components
│   ├── Dashboard.tsx             # Main dashboard with calendar
│   ├── LandingPage.tsx           # Landing page
│   ├── SemesterSetup.tsx         # Semester configuration
│   ├── TimetableSetup.tsx        # Timetable configuration
│   ├── PersistentHeader.tsx      # Persistent Header for routing
│   ├── ThemeToggle.tsx           # Theme Toggling
│   └── ui/                       # Reusable UI components
├── hooks/                        # Custom React hooks
├── lib/                          # Utility functions
└── public/                       # Static assets
```

## Tech Stack

This project is built with modern web technologies:

- **Framework**: [Next.js 15.5.4](https://nextjs.org/) - React framework with App Router
- **Language**: [TypeScript 5.2.2](https://www.typescriptlang.org/) - Type-safe JavaScript
- **UI Library**: [React 18.2.0](https://reactjs.org/) - Component-based UI
- **Styling**: 
  - [Tailwind CSS 3.3.3](https://tailwindcss.com/) - Utility-first CSS framework
  - [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) - Animation utilities
- **UI Components**: 
  - [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
  - [shadcn/ui](https://ui.shadcn.com/) - Re-usable component collection
  - [Lucide React](https://lucide.dev/) - Beautiful icon set
- **State Management**: React Hooks (useState, useEffect)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) - Dark mode support
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) - Toast notifications
- **Date Utilities**: [date-fns](https://date-fns.org/) - Modern date utility library
- **Charts**: [Recharts](https://recharts.org/) - Composable charting library

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18.x or higher)
- **npm** (version 9.x or higher) or **yarn** / **pnpm**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/acmpesuecc/CanIBunk.git
   cd CanIBunk
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application running.

### Building for Production

To create an optimized production build:

```bash
npm run build
npm start
```

The application will be built and ready to serve at [http://localhost:3000](http://localhost:3000).

### Linting

To check code quality:

```bash
npm run lint
```

## How to Use

1. **Get Started**: Click "Get Started" on the landing page
2. **Setup Timetable**: 
   - Select your working days
   - Set class timings and duration
   - Add your courses
   - Assign courses to time slots
3. **Setup Semester**:
   - Set semester start and end dates
   - Enter current attendance for each course
4. **Track Attendance**:
   - Click on calendar days to mark attendance
   - Single click: Mark as attending
   - Double click: Mark as bunking
   - Right-click options: Mark as holiday or exam
   - View predictions for how many more classes you can skip
5. **Manage Data**:
   - Edit timetable or semester setup anytime
   - Reset all data to start fresh


