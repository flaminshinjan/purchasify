# Coding Exercise: Purchase Order Management System

A full-stack purchase order management system built with React, FastAPI, and PostgreSQL. This exercise challenges you to implement advanced frontend features including cursor-based pagination, virtualization, and modern UI interactions.

```
Time: 3 Hours 15 Minutes
```

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Running the Application

```bash
cd purchase-order-system
docker-compose up --build
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Database Scripts

Located in `backend/scripts/`, these utilities help you manage test data:

```bash
# Add 100k dummy purchase orders
docker exec -it purchase_order_backend python scripts/db_populate.py

# View comprehensive database statistics
docker exec -it purchase_order_backend python scripts/db_summary.py

# Clear all purchase orders from database
docker exec -it purchase_order_backend python scripts/db_clear.py
```

## Your Mission

Transform this basic purchase order system into a high-performance, modern web application with the following enhancements:

### Task 1: Cursor-Based Pagination with Performance Optimization

**Backend Requirements:**
- Replace the current simple endpoint with cursor-based pagination
- Optimize database queries for large datasets

**Frontend Requirements:**
- Implement infinite scroll with cursor-based pagination
- Add list virtualization (only render visible items) for performance
- Implement intelligent prefetching and caching
- Display loading indicator at bottom during prefetch

**Performance Targets:**
- Initial page load: < 1 second
- Scroll FPS: 60fps with 1M records
- Memory usage: < 100MB for rendered items

### Task 2: Modern Card Layout

**Requirements:**
- Replace the current table with a responsive card-based layout
- Each card should be thin, elegant, and display:
  - Item name
  - Quantity and unit price
  - Total price
  - Order and delivery dates
  - Status badge
  - Actions
- Card design specifications:
  - White background with subtle shadow
  - Hover effect with slight elevation increase
  - Responsive grid: mobile, tablet and desktop
  - Minimal use of color
  - Smooth transitions on all interactions

### Task 3: Animated Swipe-to-Delete with Confirmation

**Requirements:**
- Implement swipe gesture on cards (touch and mouse drag)
  - Swipe left reveals delete action
  - Visual feedback: card slides with damped animation
  - Red background with trash icon revealed during swipe
  - Requires swipe past threshold (50% of card width) to activate
- Before deletion, show a beautiful modal/dialog:
  - Display order details for confirmation
  - Clean design matching the overall aesthetic
  - Two buttons: "Cancel" (subtle) and "Delete" (red, prominent)
  - Overlay backdrop with blur effect
  - Smooth entrance/exit animations
- After deletion confirmation:
  - Card animates away with swipe-out animation
  - Subtle fade and slide out
  - Other cards smoothly fill the gap
  - Show success toast notification
  - Update pagination state and refetch if needed

### Task 4: Detailed Slide-Out Panel

**Requirements:**
- Clicking a card opens a slide-out panel from the right
- Panel displays comprehensive order information:
  - All basic fields (item name, dates, quantity, price)
  - Extended details (description, vendor, shipping address, category, notes)
  - Status with visual indicator
  - Well-organized sections with clear labels
- Panel design:
  - Smooth slide-in animation from right edge
  - Overlay backdrop (click to close)
  - Close button (X icon) in top-right
  - Scrollable content if needed
  - Responsive: full-width on mobile, 400-500px on desktop
  - Clean white background with proper spacing
  - Typography hierarchy for readability
- Interactions:
  - ESC key closes the panel
  - Smooth close animation
  - Body scroll locked when panel is open

## Technical Constraints & Requirements

1. **No Questions Allowed**: If you encounter ambiguity, make reasonable decisions and implement
2. **Fix Bugs Independently**: If something breaks, debug and fix it yourself
3. **Use Existing Stack**: React 18, Tailwind CSS, Axios, FastAPI, PostgreSQL
4. **Maintain Hot Reload**: Don't break the development experience
6. **API Backward Compatibility**: Keep existing endpoints working while adding new ones
7. **Code Quality**: Clean, maintainable code with proper component structure

## Bonus Challenges (Optional)

- Add search/filter functionality with debouncing
- Implement sorting (by date, price, status) with smooth transitions
- Add keyboard navigation (arrow keys, enter to open, delete to remove)
- Implement optimistic UI updates
- Add skeleton screens for better perceived performance
- Create custom hooks for reusable logic
- Add comprehensive error boundaries
- Implement accessibility (ARIA labels, keyboard navigation, screen reader support)

## Project Structure

```
purchase-order-system/
├── backend/
│   ├── main.py
│   ├── init_db.py
│   ├── requirements.txt
│   ├── scripts/
│   │   ├── db_populate.py
│   │   ├── db_summary.py
│   │   └── db_clear.py
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```
