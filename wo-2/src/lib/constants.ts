// Constants for Auth Roles
export const ROLES = {
    HEAD_IT: 'head_it',
    DESIGNER: 'designer',
    IT_DEV: 'it_dev',
    IT_SUPPORT: 'it_support',
} as const;

export const ADMIN_ROLES = Object.values(ROLES);

export const DEFAULT_REDIRECTS = {
    ADMIN: '/admin',
    USER: '/dashboard',
} as const;
