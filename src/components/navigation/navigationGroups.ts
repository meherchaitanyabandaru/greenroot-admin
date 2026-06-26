import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaymentsIcon from '@mui/icons-material/Payments';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SecurityIcon from '@mui/icons-material/Security';
import SmsIcon from '@mui/icons-material/Sms';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import type { SvgIconComponent } from '@mui/icons-material';

export type NavItem = { label: string; path: string; icon: SvgIconComponent };
export type NavGroup = { section: string; items: NavItem[] };

export const navigationGroups: NavGroup[] = [
  {
    section: '',
    items: [{ label: 'Dashboard', path: '/', icon: DashboardIcon }],
  },
  {
    section: 'Approvals',
    items: [
      { label: 'Nursery Applications', path: '/nurseries/applications', icon: CheckCircleOutlineIcon },
    ],
  },
  {
    section: 'Platform Users',
    items: [
      { label: 'Users', path: '/users', icon: PeopleIcon },
      { label: 'Drivers', path: '/drivers', icon: AccountTreeIcon },
    ],
  },
  {
    section: 'Nurseries',
    items: [
      { label: 'All Nurseries', path: '/nurseries', icon: StorefrontIcon },
    ],
  },
  {
    section: 'Master Data',
    items: [
      { label: 'Plants', path: '/plants', icon: LocalFloristIcon },
      { label: 'Plant Categories', path: '/plants/categories', icon: CategoryIcon },
    ],
  },
  {
    section: 'Business Monitoring',
    items: [
      { label: 'Quotations', path: '/quotations', icon: DescriptionIcon },
      { label: 'Orders', path: '/orders', icon: ReceiptLongIcon },
      { label: 'Dispatches', path: '/dispatches', icon: LocalShippingIcon },
      { label: 'Plant Requests', path: '/requests', icon: AssignmentIcon },
      { label: 'Notifications', path: '/notifications', icon: NotificationsIcon },
    ],
  },
  {
    section: 'Commercial',
    items: [
      { label: 'Subscriptions', path: '/subscriptions', icon: SubscriptionsIcon },
      { label: 'Plans', path: '/subscription-plans', icon: SubscriptionsIcon },
      { label: 'Payments', path: '/payments', icon: PaymentsIcon },
    ],
  },
  {
    section: 'Governance',
    items: [
      { label: 'Audit Logs', path: '/audit', icon: SecurityIcon },
      { label: 'Notification Templates', path: '/notifications/templates', icon: SmsIcon },
    ],
  },
];
