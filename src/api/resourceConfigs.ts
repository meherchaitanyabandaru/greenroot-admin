// The generic admin list pages: one entry per resource (path, tag, columns).
import type { ResourceConfig } from './adminTypes';

export const resourceConfigs = {
  users: {
    key: 'users',
    tag: 'Users',
    path: '/api/v1/admin/users',
    collectionKey: 'users',
  },
  nurseries: {
    key: 'nurseries',
    tag: 'Nurseries',
    path: '/api/v1/nurseries',
    collectionKey: 'nurseries',
  },

  orders: { key: 'orders', tag: 'Orders', path: '/api/v1/orders', collectionKey: 'orders' },
  quotations: { key: 'quotations', tag: 'Quotations', path: '/api/v1/quotations', collectionKey: 'quotations' },
  payments: {
    key: 'payments',
    tag: 'Payments',
    path: '/api/v1/payments',
    collectionKey: 'payments',
  },
  dispatches: {
    key: 'dispatches',
    tag: 'Dispatches',
    path: '/api/v1/dispatches',
    collectionKey: 'dispatches',
  },
  vehicles: {
    key: 'vehicles',
    tag: 'Vehicles',
    path: '/api/v1/vehicles',
    collectionKey: 'vehicles',
  },
  drivers: { key: 'drivers', tag: 'Drivers', path: '/api/v1/drivers', collectionKey: 'drivers' },
  notifications: {
    key: 'notifications',
    tag: 'Notifications',
    path: '/api/v1/notifications',
    collectionKey: 'notifications',
  },
  notificationDevices: {
    key: 'notificationDevices',
    tag: 'Notifications',
    path: '/api/v1/notifications/devices',
    collectionKey: 'devices',
  },
  notificationTemplates: {
    key: 'notificationTemplates',
    tag: 'Notifications',
    path: '/api/v1/notifications/templates',
    collectionKey: 'templates',
  },
  subscriptionPlans: {
    key: 'subscriptionPlans',
    tag: 'Subscriptions',
    path: '/api/v1/subscription-plans',
    collectionKey: 'plans',
  },
  subscriptions: {
    key: 'subscriptions',
    tag: 'Subscriptions',
    path: '/api/v1/subscriptions',
    collectionKey: 'subscriptions',
  },
  attachments: {
    key: 'attachments',
    tag: 'Attachments',
    path: '/api/v1/attachments',
    collectionKey: 'attachments',
  },
  sourcingNetwork: {
    key: 'sourcingNetwork',
    tag: 'Sourcing',
    path: '/api/v1/sourcing-network/nurseries',
    collectionKey: 'nurseries',
  },
  tracking: {
    key: 'tracking',
    tag: 'Tracking',
  },
  audit: { key: 'audit', tag: 'Audit', path: '/api/v1/audit-logs', collectionKey: 'audit_logs' },
  securityLogs: { key: 'securityLogs', tag: 'SecurityLogs', path: '/api/v1/security-logs', collectionKey: 'security_logs' },
} satisfies Record<string, ResourceConfig>;
