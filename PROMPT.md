# AI Prompt for Web App: TaskNest

## 1. App Overview

**App Name:** TaskNest

**Core Purpose:** TaskNest is a personal productivity and life organization web application. It helps users manage their daily life through four integrated modules: a To-Do List, a Habit Tracker, an Expense Tracker, and user account management. The app uses Firebase for backend services, including authentication and a Firestore database for real-time data persistence.

## 2. Global Style & UI Guidelines

### Color Palette:
- **Primary:** Deep purple (`#50207A`). Used for main actions, headers, and active states.
- **Background:** Light lavender (`#D6B9FC`). Used for the main background of screens.
- **Accent:** Medium blue (`#838CE5`). Used for highlights, secondary buttons, and interactive elements like rings on input fields.
- **Card/Surface:** A slightly off-white/very light lavender (`#FFFFFF` or a shade like `#FBF9FF`). Cards should have a subtle drop shadow.
- **Text (Primary):** Dark purple/charcoal (`#3D175E`).
- **Text (Secondary/Muted):** Grayish purple (`#8B7E96`).

### Typography:
- **Primary Font:** 'PT Sans'. Use for all text, including headers and body content.
- **Headers (e.g., Screen Titles):** Bold, ~24-30px.
- **Sub-headers (e.g., Card Titles):** Semibold, ~18-22px.
- **Body Text:** Regular, ~14-16px.
- **Labels & Captions:** Regular, ~12-14px.

### Component Style:
- **Buttons:** Rounded corners (e.g., 0.5rem radius). Primary buttons are filled with the primary color. Secondary/Outline buttons have a border.
- **Cards:** Rounded corners (e.g., 0.75rem radius) with a subtle elevation/drop shadow.
- **Input Fields:** Rounded corners, with a clear border. When focused, the border should be highlighted with the accent color.
- **Icons:** Use the `lucide-react` icon library. Icons should be clear, simple, and instantly recognizable.

## 3. Data Storage & Backend

All application data must be stored in **Firebase Firestore**. The application is designed to be fully real-time and cloud-native.

The Firestore database schema should include collections for:
- `users/{userId}/tasks`
- `users/{userId}/habits`
- `users/{userId}/expenses`
- `users/{userId}/incomes`
- `users/{userId}/expenseCategories`
- `users/{userId}/incomeCategories`

User authentication is handled by **Firebase Authentication**.

## 4. App Navigation Structure

The app uses a combination of a sidebar for desktop and a bottom navigation bar for mobile for primary navigation between the main screens.

**Navigation Items (from top to bottom or left to right):**
1.  **Dashboard** (Icon: `LayoutDashboard`)
2.  **To-Do** (Icon: `CheckSquare`)
3.  **Habits** (Icon: `Target`)
4.  **Finance** (Icon: `Wallet`)
5.  **Settings** (Icon: `Settings`)

The active tab should be highlighted using the primary color.

## 5. Screen-by-Screen Breakdown

### Screen 1: Dashboard

- **Layout:** A vertical scrolling list of summary cards.
- **Header:** "Dashboard" title, with a subtitle "A quick overview of your tasks, habits, and finances."
- **Components:**
    1.  **To-Do Summary Card:**
        - **Title:** "To-Do Summary"
        - **Content:** Displays a count of "Pending Tasks". Shows a small Pie Chart visualizing the ratio of "Completed" vs. "Pending" tasks. Also lists total tasks, completed, and pending counts as text.
        - **Action:** A button/link at the bottom: "Go to To-Do List ->" which navigates to the To-Do screen.
        - **Empty State:** If no tasks exist, show a message like "No tasks yet. Add one to get started!" with a button to navigate to the To-do screen.
    2.  **Habits Summary Card:**
        - **Title:** "Habits Summary"
        - **Content:** Shows "Last 7 Days Completion Rate" as a percentage. Below this, it lists the first 5 habits and their status for *today* (Completed, Missed, or Pending) using icons (`check` for completed, `x` for missed).
        - **Action:** A button/link: "Go to Habit Tracker ->".
        - **Empty State:** If no habits exist, show "No habits are being tracked." with a button to navigate to the Habits screen.
    3.  **Finance Summary Card:**
        - **Title:** "Monthly Finance Summary" for the current month (e.g., "August 2024").
        - **Content:** A simple bar chart comparing total "Income" vs. total "Expenses" for the current calendar month.
        - **Action:** A button/link: "Go to Finance Tracker ->".
        - **Empty State:** If no financial data exists for the month, show "No financial data for this month." with a button to navigate to the Finance screen.

### Screen 2: To-Do List

- **Header:** "To-Do List" title, subtitle "Manage your tasks and stay organized."
- **Action Button:** A floating action button (FAB) or standard button with a `+` icon to add a new task.
- **Filter/Sort Controls:**
    - **Sort by:** A dropdown menu with options: "Default", "Priority", "Due Date".
    - **Sort Order:** A dropdown menu with options: "Ascending", "Descending".
- **Task List:**
    - A vertically scrolling list of tasks. Each task is an item in the list.
    - Completed tasks are shown at the bottom, visually distinct (e.g., semi-transparent/grayed out, title has a strikethrough).
    - **Task Item UI:**
        - **Checkbox:** On the left, to mark the task as complete/incomplete.
        - **Title:** The main text of the task.
        - **Description:** Smaller text below the title, if it exists.
        - **Priority Indicator:** A small colored dot (High: Red, Medium: Yellow, Low: Green).
        - **Due Date:** If it exists, show a calendar icon and the formatted date (e.g., "Aug 28, 2024").
        - **Actions:** An "Edit" button and a "Delete" button (trash can icon). Clicking "Edit" opens the Add/Edit Task dialog. Clicking "Delete" shows a confirmation dialog.
- **Empty State:** If no tasks exist, display a message in the center: "You have no tasks yet. Add one to get started!".
- **Add/Edit Task Dialog (Modal/Popup):**
    - **Title:** (string input)
    - **Description:** (multiline string input)
    - **Priority:** (Dropdown: "High", "Medium", "Low")
    - **Due Date:** (Date picker)
    - **Actions:** "Save" and "Cancel" buttons.

### Screen 3: Habit Tracker

- **Header:** "Habit Tracker" title, subtitle showing today's date (e.g., "What will you accomplish today, August 28?").
- **Action Button:** A primary button at the top right: "+ Add Habit".
- **Today's Habits View:**
    - A list of all created habits.
    - **Habit Item UI:**
        - **Habit Name:** The main text.
        - **Completion Actions:** Three buttons on the right:
            1.  A "Complete" button (thumbs up icon). Toggles the habit's status for today to 'completed'.
            2.  A "Missed" button (thumbs down icon). Toggles the habit's status to 'missed'.
            3.  A "Delete" button (trash can icon). Shows a confirmation dialog.
        - The "Complete" or "Missed" button should be styled as "active" (e.g., filled with primary color) if that status is selected for the day. If the habit is completed, its name should have a strikethrough.
- **Habit History View (Card below today's list):**
    - **Title:** "Habit History".
    - **Date Range Picker:** Allows the user to select a start and end date. Defaults to the current week.
    - **History Table:** A horizontally scrollable table.
        - **Rows:** Each row represents a habit. The habit name is in a sticky/frozen first column.
        - **Columns:** Each column represents a day in the selected date range.
        - **Cells:** The intersection of a habit and a day shows an icon representing the status: `check` (completed), `x` (missed), or empty.
- **Add Habit Dialog:** A simple dialog with a text input for the habit name and "Save"/"Cancel" buttons.

### Screen 4: Finance Tracker

- **Layout:** This screen uses tabs for navigation.
- **Header:** "Finance Tracker" title.
- **Tabs:** "Summary", "Expenses", "Income".
- **Tab 1: Summary**
    - **Month Navigation:** "<" and ">" buttons to navigate between months. A text label shows the selected month (e.g., "August 2024").
    - **Budget Summary Card:**
        - **Chart:** A Donut Chart showing the breakdown of spending into "Needs", "Wants", and "Savings" for the selected month. The center of the donut shows the "Total Spent" amount.
        - **Stat Cards:**
            - Total Income (for the month)
            - Total Needs (for the month)
            - Total Wants (for the month)
            - Total Savings (for the month)
            - Remaining to Budget (Income - (Needs + Wants + Savings))
- **Tab 2: Expenses**
    - **FAB:** A `+` button to add a new expense, opening the "Add Expense" dialog.
    - **Filter Card:**
        - **Month Filter:** Dropdown to select a month (or "All Months").
        - **Category Filter:** Dropdown to select a category (or "All Categories").
        - **Type Filter:** Dropdown to select a type ("Need", "Want", "Savings", or "All Types").
    - **Filtered Summary:** A text view showing the "Filtered Total" amount based on the active filters.
    - **Expense Table/List:** A list of transactions matching the filters, sorted by date (newest first).
        - **Item UI:** Shows description, date, category, type, and amount. A delete icon is on the right.
- **Tab 3: Income**
    - **FAB:** A `+` button to add new income, opening the "Add Income" dialog.
    - **Income Table/List:** A list of all income transactions, sorted by date (newest first).
        - **Item UI:** Shows description, date, category, and amount. A delete icon is on the right.

- **Add/Edit Expense/Income Dialogs:**
    - **Description:** (string input)
    - **Amount:** (number/decimal input)
    - **Date:** (date picker)
    - **Category:** (Dropdown menu). Should include an option to trigger an "Add New Category" dialog.
    - **Type (for Expenses only):** (Dropdown: "Need", "Want", "Savings")
- **Add New Category Dialog:** Simple dialog with a text input for the new category name.

### Screen 5: Settings

- **Header:** "Settings" title.
- **Account Management Card:**
    - **Title:** "Account".
    - **Content:** Displays the current user's name and email.
    - **Action:** A "Sign Out" button.
- **Data Management Card (OBSOLETE - REMOVED):**
    - The functionality for local data backup and restore is no longer relevant as all data is stored and managed in Firebase. This section should be removed from the UI.
