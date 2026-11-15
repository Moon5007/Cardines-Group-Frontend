# Product Management System: Frontend (React)

React + Vite storefront and admin app that connects to the Laravel API with registration, login, logout and role-based screens.

- **Group:** <Cardines Group>
- **Members:** <Mark Prinzy Cardines> (@github-marky231), <Viial Cleave Villara> (@github-VialCleave), <Pia Rose Cabrillos> (@github-cabrillospiarose), <Ivanne Llona> (@github-llonaivannejan-cell), <Reymund Llave> (@github-Moon5007), <Paulo Bactalan> (@github-No Account Yet)
- **Backend repository:** https://github.com/Moon5007/Cardines-Group-Backend<<Moon5007>>/<backend-repository>

## Prerequisites

- Node.js (current LTS) and npm
- The backend running locally (see the backend README)

## Installation

```bash
git clone https://github.com/<owner>/<frontend-repository>.git
cd <frontend-repository>
npm install
cp .env.example .env
```

## Environment variables

`.env.example` contains a placeholder only. Never commit your real `.env`.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Run

```bash
npm run dev      # development server at http://localhost:5173
npm run build    # production build
npm run lint     # ESLint
```

## Authentication flow

1. The user registers on `/register` and then logs in on `/login`.
2. The login response contains a Sanctum token and safe user fields (id, name, email, role). Both are saved in `localStorage` (`token` and `user`).
3. The shared Axios instance (`src/api/axios.js`) sends `Authorization: Bearer <token>` on every request.
4. A 401 response clears the saved login and sends the user to `/login`.
5. Logout calls `POST /logout`, then clears the saved login and returns to `/login`.

Storing a token in `localStorage` is a teaching approach: it can be read by JavaScript and stolen through cross-site scripting. Production apps should prefer secure HttpOnly cookies.

## Routes and access

| Route | Guest | Customer | Admin |
| --- | --- | --- | --- |
| `/`, `/shop`, `/products/:id` | Allowed | Allowed | Allowed |
| `/login`, `/register` | Allowed | Redirects away | Redirects away |
| `/cart`, `/order-history` | Redirect to login | Allowed | Allowed |
| `/dashboard`, `/users`, `/admin/products`, `/admin/categories`, `/orders`, `/reviews` | Redirect to login | Redirect to home | Allowed |

The frontend hides admin screens and controls for normal users, but the backend enforces the real permissions: a direct API request to create, update or delete a product returns 401 for guests and 403 for customers.

## Error handling

- **401:** the saved login is cleared and the user must sign in again.
- **403:** an access-denied message is shown.
- **422:** field errors from the backend are shown next to the form.

## Screenshots

### Admin Dashboard
![Admin Dashboard](./src/assets/docs/screenshots/admindashboard.png)

### Admin Orders
![Admin Orders](./src/assets/docs/screenshots/adminorders.png)

### Product Categories API
![API Categories](./src/assets/docs/screenshots/apicategories.png)

### API Products
![API Products](./src/assets/docs/screenshots/apiproducts.png)

### Categories Management
![Categories Admin](./src/assets/docs/screenshots/categories-admin.png)

### Product List
![Product List](./src/assets/docs/screenshots/productlist.png)

## User Side

### Registration
![Registration](./src/assets/docs/screenshots/registration.png)

### Reviews
![Reviews](./src/assets/docs/screenshots/reviews.png)

### User Dashboard
![User Dashboard](./src/assets/docs/screenshots/useradmindashboard.png)

### Shop
![Shop](./src/assets/docs/screenshots/shop.png)

### Homepage
![User Homepage](./src/assets/docs/screenshots/userhomepage.png)

## Known limitations

- Guests can browse products (public catalog policy, see the backend README).
- <add any other differences from the example API contract>
- there is no route for inventory and reports
-UI needs more improvements and that will be work