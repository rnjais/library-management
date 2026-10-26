// LocalStorage Keys
export const STORAGE_KEYS = {
  TOKEN: 'library_jwt_token',
  USER: 'library_user_profile',
}

// User Roles matching Spring Security Authority strings
export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  MEMBER: 'ROLE_MEMBER',
}

// Frontend Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  BOOKS: '/books',
  BOOK_DETAIL: '/books/:id',
  MY_BORROWINGS: '/my-borrowings',
  MY_FINES: '/my-fines',
  // Admin Routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_BOOKS: '/admin/books',
  ADMIN_MEMBERS: '/admin/members',
  ADMIN_BORROWINGS: '/admin/borrowings',
  ADMIN_FINES: '/admin/fines',
  ADMIN_REPORTS: '/admin/reports',
}
