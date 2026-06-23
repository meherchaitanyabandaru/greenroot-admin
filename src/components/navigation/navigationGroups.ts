import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CategoryIcon from '@mui/icons-material/Category';
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
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import SmsIcon from '@mui/icons-material/Sms';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import TimelineIcon from '@mui/icons-material/Timeline';
import type { SvgIconComponent } from '@mui/icons-material';

export type NavItem = { label: string; path: string; icon: SvgIconComponent };
export type NavGroup = { section: string; items: NavItem[] };

export const navigationGroups: NavGroup[] = [
  {
    section: '',
    items: [{ label: 'Dashboard', path: '/', icon: DashboardIcon }],
  },
  {
    section: 'User Management',
    items: [{ label: 'Users', path: '/users', icon: PeopleIcon }],
  },
  {
    section: 'Plant Catalog',
    items: [
      { label: 'Plants', path: '/plants', icon: LocalFloristIcon },
      { label: 'Categories', path: '/plants/categories', icon: CategoryIcon },
    ],
  },
  {
    section: 'Nursery Network',
    items: [
      { label: 'Nurseries', path: '/nurseries', icon: StorefrontIcon },
      { label: 'Inventory', path: '/inventory', icon: InventoryIcon },
      { label: 'Requests', path: '/requests', icon: AssignmentIcon },
    ],
  },
  {
    section: 'Commerce',
    items: [
      { label: 'Orders', path: '/orders', icon: ReceiptLongIcon },
      { label: 'Payments', path: '/payments', icon: PaymentsIcon },
    ],
  },
  {
    section: 'Logistics',
    items: [
      { label: 'Dispatches', path: '/dispatches', icon: LocalShippingIcon },
      { label: 'Vehicles', path: '/vehicles', icon: DirectionsCarIcon },
      { label: 'Drivers', path: '/drivers', icon: AccountTreeIcon },
      { label: 'Tracking', path: '/tracking', icon: TimelineIcon },
    ],
  },
  {
    section: 'Notifications',
    items: [
      { label: 'Notifications', path: '/notifications', icon: NotificationsIcon },
      { label: 'Templates', path: '/notifications/templates', icon: SmsIcon },
      { label: 'Devices', path: '/notifications/devices', icon: SmartphoneIcon },
    ],
  },
  {
    section: 'Billing',
    items: [
      { label: 'Subscriptions', path: '/subscriptions', icon: SubscriptionsIcon },
      { label: 'Plans', path: '/subscription-plans', icon: SubscriptionsIcon },
    ],
  },
  {
    section: 'Platform',
    items: [
      { label: 'Attachments', path: '/attachments', icon: AttachFileIcon },
      { label: 'Audit Logs', path: '/audit', icon: SecurityIcon },
    ],
  },
];
