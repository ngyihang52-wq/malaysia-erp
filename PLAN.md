# Multi-Account Login System

## Steps
1. Create `lib/demo-users.ts` — shared demo users config (5 accounts: Admin, Manager, 3 Staff)
2. Update `app/api/auth/login/route.ts` — use real JWT tokens, set readable `erp_user` cookie
3. Update `app/api/auth/logout/route.ts` — clear both cookies
4. Create `app/api/auth/me/route.ts` — get current user from JWT
5. Create `contexts/AuthContext.tsx` — React context for auth state across app
6. Update `app/layout.tsx` — wrap with AuthProvider
7. Update `app/(auth)/login/page.tsx` — quick-login cards for all 5 accounts
8. Update `components/layout/Sidebar.tsx` — dynamic user display from auth context
9. Update `components/layout/TopBar.tsx` — show logged-in user + role badge
10. Create `middleware.ts` — route protection (redirect to /login if no token)
