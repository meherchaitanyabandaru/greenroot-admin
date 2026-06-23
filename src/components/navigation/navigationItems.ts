import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaymentsIcon from '@mui/icons-material/Payments';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SecurityIcon from '@mui/icons-material/Security';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import TimelineIcon from '@mui/icons-material/Timeline';
import type { SvgIconComponent } from '@mui/icons-material';

export type NavigationItem = {
  label: string;
  path: string;
  icon: SvgIconComponent;
};

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/', icon: DashboardIcon },
  { label: 'Users', path: '/users', icon: PeopleIcon },
  { label: 'Plants', path: '/plants', icon: LocalFloristIcon },
  { label: 'Plant Categories', path: '/plants/categories', icon: LocalFloristIcon },
  { label: 'Nurseries', path: '/nurseries', icon: StorefrontIcon },
  { label: 'Inventory', path: '/inventory', icon: InventoryIcon },
  { label: 'Requests', path: '/requests', icon: AssignmentIcon },
  { label: 'Orders', path: '/orders', icon: ReceiptLongIcon },
  { label: 'Payments', path: '/payments', icon: PaymentsIcon },
  { label: 'Dispatches', path: '/dispatches', icon: LocalShippingIcon },
  { label: 'Vehicles', path: '/vehicles', icon: DirectionsCarIcon },
  { label: 'Drivers', path: '/drivers', icon: AccountTreeIcon },
  { label: 'Tracking', path: '/tracking', icon: TimelineIcon },
  { label: 'Notifications', path: '/notifications', icon: NotificationsIcon },
  { label: 'Notification Devices', path: '/notifications/devices', icon: NotificationsIcon },
  { label: 'Notification Templates', path: '/notifications/templates', icon: NotificationsIcon },
  { label: 'Subscriptions', path: '/subscriptions', icon: SubscriptionsIcon },
  { label: 'Subscription Plans', path: '/subscription-plans', icon: SubscriptionsIcon },
  { label: 'Attachments', path: '/attachments', icon: AttachFileIcon },
  { label: 'Audit Logs', path: '/audit', icon: SecurityIcon },
];
