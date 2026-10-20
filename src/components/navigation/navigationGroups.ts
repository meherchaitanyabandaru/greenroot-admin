import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import BugReportIcon from '@mui/icons-material/BugReport';
import CampaignIcon from '@mui/icons-material/Campaign';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EmailIcon from '@mui/icons-material/Email';
import DescriptionIcon from '@mui/icons-material/Description';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import HistoryIcon from '@mui/icons-material/History';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaymentsIcon from '@mui/icons-material/Payments';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SmsIcon from '@mui/icons-material/Sms';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import BadgeIcon from '@mui/icons-material/Badge';
import ForumIcon from '@mui/icons-material/Forum';
import GroupsIcon from '@mui/icons-material/Groups';
import HubIcon from '@mui/icons-material/Hub';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import PhonelinkRingIcon from '@mui/icons-material/PhonelinkRing';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import SecurityIcon from '@mui/icons-material/Security';
import SpaIcon from '@mui/icons-material/Spa';
import StoreIcon from '@mui/icons-material/Store';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import YardIcon from '@mui/icons-material/Yard';
import type { SvgIconComponent } from '@mui/icons-material';

export type NavItem = { label: string; path: string; icon: SvgIconComponent; badge?: string };
/** `icon` marks the section in the sidebar (and stands for it when collapsed). */
export type NavGroup = { section: string; icon?: SvgIconComponent; items: NavItem[] };

export const navigationGroups: NavGroup[] = [
  {
    section: '',
    items: [{ label: 'Dashboard', path: '/', icon: DashboardIcon }],
  },
  {
    section: 'People',
    icon: GroupsIcon,
    items: [
      { label: 'All Users', path: '/users', icon: PeopleIcon },
      { label: 'Drivers', path: '/drivers', icon: BadgeIcon },
    ],
  },
  {
    section: 'Nurseries',
    icon: YardIcon,
    items: [
      { label: 'All Nurseries', path: '/nurseries', icon: StorefrontIcon },
      { label: 'Pending Approvals', path: '/nurseries/applications', icon: CheckCircleOutlineIcon },
      { label: 'Top Items', path: '/top-items', icon: StarOutlineIcon },
    ],
  },
  {
    section: 'Plant Catalogue',
    icon: SpaIcon,
    items: [
      { label: 'Plants', path: '/plants', icon: LocalFloristIcon },
      { label: 'Categories', path: '/plants/categories', icon: CategoryIcon },
    ],
  },
  {
    section: 'Sourcing Network',
    icon: HubIcon,
    items: [
      { label: 'Network Members', path: '/sourcing-network', icon: HubIcon },
    ],
  },
  {
    section: 'Local Market',
    icon: StoreIcon,
    items: [
      { label: 'Review Queue', path: '/market/review', icon: GppMaybeIcon },
      { label: 'All Ads', path: '/market/ads', icon: CampaignIcon },
    ],
  },
  {
    section: 'Sales',
    icon: PointOfSaleIcon,
    items: [
      { label: 'Quotations', path: '/quotations', icon: DescriptionIcon },
      { label: 'Orders', path: '/orders', icon: ReceiptLongIcon },
      { label: 'Plant Requests', path: '/requests', icon: AssignmentIcon },
    ],
  },
  {
    section: 'Logistics',
    icon: LocalShippingIcon,
    items: [
      { label: 'Dispatches', path: '/dispatches', icon: LocalShippingIcon },
      { label: 'Vehicles', path: '/vehicles', icon: DirectionsCarIcon },
      { label: 'Live Tracking', path: '/tracking', icon: TimelineIcon },
    ],
  },
  {
    section: 'Billing',
    icon: AccountBalanceWalletIcon,
    items: [
      { label: 'Subscription Plans', path: '/subscription-plans', icon: WorkspacePremiumIcon },
      { label: 'Active Subscriptions', path: '/subscriptions', icon: AutorenewIcon },
      { label: 'Promo Offers', path: '/subscription-promos', icon: LocalOfferIcon },
      { label: 'Payments', path: '/payments', icon: PaymentsIcon },
    ],
  },
  {
    section: 'Communication',
    icon: ForumIcon,
    items: [
      { label: 'Notifications', path: '/notifications', icon: NotificationsIcon },
      { label: 'Templates', path: '/notifications/templates', icon: TextSnippetIcon },
      { label: 'Notification Devices', path: '/notifications/devices', icon: PhonelinkRingIcon },
      { label: 'SMS / DLT', path: '/sms', icon: SmsIcon },
      { label: 'Email', path: '/email', icon: EmailIcon },
    ],
  },
  {
    section: 'Media',
    icon: PermMediaIcon,
    items: [
      { label: 'Attachments', path: '/attachments', icon: AttachFileIcon },
    ],
  },
  {
    section: 'Logs',
    icon: ManageSearchIcon,
    items: [
      { label: 'Audit Logs',    path: '/audit',         icon: HistoryIcon },
      { label: 'Security Logs', path: '/security-logs', icon: SecurityIcon },
      { label: 'App Crash Reports', path: '/crash-reports', icon: BugReportIcon },
    ],
  },
];
