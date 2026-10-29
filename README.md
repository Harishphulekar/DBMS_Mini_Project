
# IntelliShop — Intelligent Online Shopping System

An intelligent online shopping web application built with Next.js, TypeScript, Tailwind CSS, and MySQL.

## Features

- Dynamic product catalog connected to MySQL
- Product search by name, brand, and description
- Category filters
- Add to Cart functionality
- Shopping cart with quantity and price totals
- Remove items from the cart
- Live cart item count
- MySQL database integration

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** MySQL
- **Planned:** Qdrant-powered semantic search and personalized recommendations

## Project Structure

```text
online-shopping-app/
├── app/
│   ├── api/
│   │   ├── cart/
│   │   ├── products/
│   │   └── db-test/
│   ├── cart/
│   ├── AddToCartButton.tsx
│   ├── CartNavLink.tsx
│   ├── ProductFilters.tsx
│   └── page.tsx
├── lib/
│   └── db.ts
├── public/
├── .env.example
├── package.json
└── README.md
```

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=intelligent_online_shopping
```

Replace `your_mysql_password` with your own local MySQL password. Never commit `.env.local` or actual credentials to GitHub.

### 3. Prepare the database

Create the `intelligent_online_shopping` database in MySQL and execute the project's SQL schema and sample-data scripts.

### 4. Run the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current Development Status

The product catalog, database integration, search and category filters, and basic shopping cart functionality have been implemented.

Wishlist, customer authentication, checkout, semantic search, and recommendations are planned future enhancements.
