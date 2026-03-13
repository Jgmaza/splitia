You are a senior fullstack engineer helping build a hackathon MVP.

The goal is to build a working prototype as fast as possible.

The project name is:

SplitIA

CONCEPT

SplitIA is an AI assistant that scans Gmail for expense notifications and helps the user quickly categorize and register them through a chat interface.

Instead of manually organizing expenses in banking apps, the AI agent reviews detected transactions and asks quick questions to classify them.

Example interaction:

Assistant:
"I detected this expense:

$120000
Danny's Burger

Was this only for you or shared with friends?"

User:
"Shared with Juan and Pedro"

Assistant:
"What category should I store it in? (Suggested: Food)"

The agent then stores the expense in the database.

The goal of the MVP is to demonstrate:

1) Gmail expense detection
2) AI chat review of expenses
3) Storage of categorized expenses
4) A dashboard with basic analytics

This is a HACKATHON PROJECT so prioritize speed over perfection.

Avoid over engineering.

--------------------------------

TECH STACK

Use the following technologies:

Next.js 14
App Router
TypeScript
TailwindCSS
Supabase (Postgres database)
OpenAI API
Gmail API

Everything must run inside the Next.js project.

--------------------------------

PROJECT STRUCTURE

Create this structure:

app/
  page.tsx
  chat/page.tsx
  dashboard/page.tsx
  api/
    scan-gmail/route.ts
    chat-agent/route.ts

components/
  ChatWindow.tsx
  ChatMessage.tsx
  ChatInput.tsx
  DashboardCards.tsx

lib/
  supabase.ts
  gmail.ts
  openai.ts
  expenseParser.ts

--------------------------------

DATABASE

Use Supabase MCP to create the following tables.

users
- id uuid primary key
- email text
- name text
- gmail_access_token text
- created_at timestamp default now()

categories
- id uuid primary key
- user_id uuid
- name text
- icon text
- created_at timestamp default now()

friends
- id uuid primary key
- user_id uuid
- name text
- email text
- created_at timestamp default now()

expenses
- id uuid primary key
- user_id uuid
- amount numeric
- merchant text
- description text
- category_id uuid
- currency text
- date timestamp
- is_shared boolean
- created_at timestamp default now()

expense_participants
- id uuid primary key
- expense_id uuid
- friend_id uuid
- share_amount numeric
- paid_by_user boolean

email_expenses
- id uuid primary key
- user_id uuid
- merchant text
- amount numeric
- email_subject text
- email_date timestamp
- processed boolean default false

--------------------------------

GMAIL SCANNING

Create a module:

lib/gmail.ts

This module should:

1) Connect to Gmail using an access token stored in env:

GMAIL_ACCESS_TOKEN

2) Fetch recent emails.

3) Extract potential expense notifications.

Look for patterns like:

"$"
"pago"
"compra"
"transaction"
"payment"

Use regex to extract:

amount
merchant
date

Return a list of detected expenses.

--------------------------------

EXPENSE PARSER

Create:

lib/expenseParser.ts

This file should contain logic to extract:

merchant
amount

from email subjects or content.

Example inputs:

"Compra por $45.000 en Uber"
"Payment $120000 DANNYS BURGER"

Return structured data.

--------------------------------

API ROUTE

/api/scan-gmail

When called:

1) fetch emails
2) parse expenses
3) store them in email_expenses

Return the detected expenses.

--------------------------------

CHAT AGENT

Create:

/api/chat-agent

This route should:

1 retrieve the first email_expense where processed=false

2 generate a message like:

"I detected this transaction:

$120000
Danny's Burger

Was this only for you or shared with friends?"

3 use OpenAI to interpret user responses

The agent must extract:

category
is_shared
participants

When enough information is gathered:

Save the expense into the expenses table.

Mark email_expenses.processed = true.

--------------------------------

OPENAI MODULE

Create:

lib/openai.ts

Use OpenAI API with a cheap model.

The model should be used to:

- interpret user chat responses
- extract structured data

Return JSON.

--------------------------------

CHAT UI

Create a WhatsApp style chat UI.

Route:

/chat

Features:

- message bubbles
- user messages on right
- assistant messages on left
- scrollable chat
- input field
- send button

Use Tailwind.

--------------------------------

DASHBOARD

Route:

/dashboard

Show:

Total expenses this month

Expenses grouped by category

Shared expenses

Use simple charts or cards.

--------------------------------

LANDING PAGE

Route:

/

Show:

Title:

SplitIA

Subtitle:

"AI powered daily expense assistant"

Button:

"Review today's expenses"

This button should call:

/api/scan-gmail

and redirect to:

/chat

--------------------------------

ENV VARIABLES

Create a .env example:

OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
GMAIL_ACCESS_TOKEN=

--------------------------------

IMPORTANT

This is a hackathon MVP.

Focus on:

working demo
simple logic
clean UI

If Gmail API fails, fallback to mock expenses like:

$45000 Uber
$120000 Danny's Burger

--------------------------------

Finally:

Generate the entire project structure and initial implementation.