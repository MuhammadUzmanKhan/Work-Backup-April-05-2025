export const filterAnswer = [
  { answer: 'Cashback' },
  { answer: 'Travel' },
  { answer: 'Low interest' },
  { answer: 'Reward' },
  { answer: 'Reward1' },
  { answer: 'Reward2' }
];

export const tabsHeaderPoints = [
  { id: 1, title: 'Finanical knowledge' },
  { id: 2, title: 'Physical activity' }
];

export const bannerPoints = [
  {
    id: 1,
    title: 'Do steps to earn points!',
    items: [
      {
        id: 1,
        title: '200K',
        text: 'Steps Walked',
        icon: require('assets/icons/points/FlagBanner.svg').default
      },
      {
        id: 2,
        title: '300',
        text: 'Points earned',
        icon: require('assets/icons/points/CircleWavyCheckOrng.svg').default
      }
    ]
  },
  {
    id: 2,
    title: 'Convert knowledge to points!',
    items: [
      {
        id: 1,
        title: '2 568',
        text: 'Completed quizes',
        icon: require('assets/icons/points/PersonSimpleRun.svg').default
      },
      {
        id: 2,
        title: '300',
        text: 'Points earned',
        icon: require('assets/icons/points/CircleWavyCheck.svg').default
      }
    ]
  }
];

export const pointsGraphics = [
  { name: 'M', uv: 100, pv: 2400, amt: 2400 },
  { name: 'T', uv: 400, pv: 2400, amt: 2400 },
  { name: 'W', uv: 200, pv: 2400, amt: 2400 },
  { name: 'T', uv: 300, pv: 2400, amt: 2400 },
  { name: 'F', uv: 400, pv: 2400, amt: 2400 },
  { name: 'S', uv: 350, pv: 2400, amt: 2400 },
  { name: 'S', uv: 150, pv: 2400, amt: 2400 }
];

export const sidebarList = [
  { id: 1, name: 'Dashboard', to: '/dashboard', icon: '' },
  { id: 2, name: 'Stats', to: '/stats', icon: '' },
  { id: 4, name: 'Activity', to: '/activity', icon: '' },
  { id: 3, name: 'Settings', to: '/settings', icon: '' }
];
 
export const dashboardList = [
  { id: 1, name: 'partners', to: '/partners', icon: '', access: 'read:partner' },
  { id: 2, name: 'products', to: '/products', icon: '', access: 'read:product' },
  { id: 3, name: 'productCategory', to: '/product-category', icon: '', access: 'read:category' },
  { id: 4, name: 'experts', to: '/experts', icon: '', access: 'read:expert' },
  { id: 5, name: 'resources', to: '/resources', icon: '', access: 'read:guidebook' },
  { id: 6, name: 'quizzes', to: '/quizzes', icon: '', access: 'read:quizqna' },
  { id: 7, name: 'tags', to: '/tags', icon: '', access: 'read:tag' },
  { id: 8, name: 'users', to: '/users', icon: '', access: '' },
  { id: 9, name: 'filters', to: '/filter', icon: '', access: 'read:filter' },
  { id: 10, name: 'rewards', to: '/rewards', icon: '', access: 'read:reward' },
  {
    id: 11,
    name: 'notifications',
    to: '/notifications',
    icon: '',
    access: 'write:notifications'
  },
  { id: 12, name: 'quizTheme', to: '/quiz-theme', icon: '', access: 'read:quizTheme' }
]

export const productsOptions = [
  { id: 1, name: 'Credit Cards' },
  { id: 2, name: 'Personal Loans' },
  { id: 3, name: 'Auto Loans' },
  { id: 4, name: 'Savings' },
  { id: 5, name: 'Deposits' }
]

export const tagsOptions = [
  { id: 1, name: 'Rewards' },
  { id: 2, name: 'Travel' },
  { id: 3, name: 'Shariah compliant' },
  { id: 4, name: 'Cashback' },
  { id: 5, name: 'Low interest' }
]

export const currencyOptions = [
  { id: 1, title: 'None' },
  { id: 2, title: 'BHD' },
  { id: 3, title: 'USD' },
  { id: 4, title: 'EU' },
  { id: 5, title: '%' },
  // { id: 6, title: 'BD' },
  { id: 6, title: 'د.ب.' }
]

export const quizTypes = [
  { id: 1, title: 'multiple', value: 'MULTIPLE' },
  { id: 2, title: 'single', value: 'SINGLE' }
]

export const filterQuestionTypes = [
  { id: 1, title: 'multiple', value: 'MULTIPLE', name: 'multiple' },
  { id: 2, title: 'dropdown', value: 'SINGLE', name: 'single' },
  { id: 3, title: 'slider', value: 'SLIDER', name: 'ranges' },
  { id: 4, title: 'checkboxes', value: 'CHECKBOXES', name: 'checkboxes' }
]

export const pushNotificationTypes = [
  { id: 1, title: 'New Guidebook', value: 'NEW_GUIDEBOOK' },
  { id: 2, title: 'New Reward', value: 'NEW_REWARD' },
  { id: 3, title: 'New Product', value: 'NEW_PRODUCT' },
  { id: 4, title: 'New FAQ', value: 'NEW_FAQ' },
  { id: 5, title: 'Read FAQ', value: 'READ_FAQ' },
  { id: 6, title: 'Unlock Points', value: 'UNLOCK_POINTS' },
  { id: 7, title: 'Refer Friends', value: 'REFER_FRIENDS' }
]

/* eslint-disable no-useless-escape */

export const roleBasedRoutes = [
  {
    '/partners': {
      permission: ['read:partner', 'write:partner'],
      reg: /^\/partners[^\/]*\/?$/,
      title: 'Partners'
    }
  },
  {
    '/partners/create': {
      permission: ['write:partner'],
      reg: /^\/partners\/[^\/]*create\b[^\/]*\/?$/,
      title: 'Partners'
    }
  },
  {
    '/partners/create/:id': {
      permission: ['read:partner', 'write:partner'],
      reg: /^\/partners\/[^\/]*create\b[^\/]*\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Partners'
    }
  },
  {
    '/partners/details/:id': {
      permission: ['read:partner', 'write:partner'],
      reg: /^\/partners\/[^\/]*details\b[^\/]*\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Partners'
    }
  },

  {
    '/products/category/:categoryId/provider/:providerId': {
      permission: ['read:product', 'write:product'],
      reg: /^\/products\/[^\/]*category\b[^\/]*\/[^\/]*[a-zA-z\d]{24}[^\/]*\/[^\/]*provider\b[^\/]*\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Products'
    }
  },
  {
    '/products': {
      permission: ['read:product', 'write:product'],
      reg: /^\/products[^\/]*\/?$/,
      title: 'Products'
    }
  },
  {
    '/products/category/:categoryId': {
      permission: ['read:product', 'write:product'],
      reg: /^\/products\/[^\/]*category\b[^\/]*\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Products'
    }
  },
  {
    '/products/0': {
      permission: ['write:product'],
      reg: /^\/products\/[^\/]*0[^\/]*\/?$/,
      title: 'Products'
    }
  },
  {
    '/products/:id': {
      permission: ['read:product', 'write:product'],
      reg: /^\/products\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Products'
    }
  },

  {
    '/products/create/0/category/:categoryId': {
      permission: ['write:product'],
      reg: /^\/products\/[^\/]*create\b[^\/]*\/[^\/]*0[^\/]*\/[^\/]*category\b[^\/]*\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Products'
    }
  },
  {
    '/product-category': {
      permission: ['read:category', 'write:category'],
      reg: /^\/product-category[^\/]*\/?$/,
      title: 'Product Category'
    }
  },
  {
    '/product-category/0': {
      permission: ['write:category'],
      reg: /^\/product-category\/[^\/]*0[^\/]*\/?$/,
      title: 'Product Category'
    }
  },
  {
    '/product-category/:id': {
      permission: ['read:category', 'write:category'],
      reg: /^\/product-category\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Product Category'
    }
  },
  {
    '/experts': {
      permission: ['read:expert', 'write:expert'],
      reg: /^\/experts[^\/]*\/?$/,
      title: 'Experts'
    }
  },
  {
    '/experts/:id/faq': {
      permission: ['read:faq', 'write:faq'],
      reg: /^\/experts\/[^\/]*[a-zA-z\d]{24}[^\/]*\/[^\/]*faq\b[^\/]*\/?$/,
      title: 'Experts FAQ'
    }
  },
  {
    '/experts/:id': {
      permission: ['read:expert', 'write:expert'],
      reg: /^\/experts\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Experts'
    }
  },
  {
    '/experts/:id/guidebook': {
      permission: ['read:guidebook', 'write:guidebook'],
      reg: /^\/experts\/[^\/]*[a-zA-z\d]{24}[^\/]*\/[^\/]*guidebook\b[^\/]*\/?$/,
      title: 'Experts Guidebook'
    }
  },
  {
    '/experts/add': {
      permission: ['write:expert'],
      reg: /^\/experts\/[^\/]*add\b[^\/]*\/?$/,
      title: 'Experts'
    }
  },

  {
    '/resources': {
      permission: ['read:guidebook', 'write:guidebook'],
      reg: /^\/resources[^\/]*\/?$/,
      title: 'Resources'
    }
  },
  {
    '/resources/:id': {
      permission: ['read:guidebook', 'write:guidebook'],
      reg: /^\/resources\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Resources'
    }
  },
  {
    '/resources/add': {
      permission: ['write:guidebook'],
      reg: /^\/resources\/[^\/]*add\b[^\/]*\/?$/,
      title: 'Resources'
    }
  },
  {
    '/quizzes': {
      permission: ['read:quizqna', 'write:quizqna'],
      reg: /^\/quizzes[^\/]*\/?$/,
      title: 'Quizzes'
    }
  },
  {
    '/quizzes/:id': {
      permission: ['read:quizqna', 'write:quizqna'],
      reg: /^\/quizzes\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Quizzes'
    }
  },
  {
    '/quizzes/add': {
      permission: ['write:quizqna'],
      reg: /^\/quizzes\/[^\/]*add\b[^\/]*\/?$/,
      title: 'Quizzes'
    }
  },

  {
    '/tags': { permission: ['read:tag', 'write:tag'], reg: /^\/tags[^\/]*\/?$/, title: 'Tags' }
  },
  {
    '/tags/product/:id': {
      permission: ['read:tag', 'write:tag'],
      reg: /^\/tags\/[^\/]*product\b[^\/]*\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Product Tags'
    }
  },
  {
    '/tags/quizzes': {
      permission: ['read:tag', 'write:tag'],
      reg: /^\/tags\/[^\/]*quizzes\b[^\/]*\/?$/,
      title: 'Quizzes Tags'
    }
  },
  {
    '/tags/quizzes/add': {
      permission: ['write:tag'],
      reg: /^\/tags\/[^\/]*quizzes\b[^\/]*\/[^\/]*add\b[^\/]*\/?$/,
      title: 'Quizzes Tags'
    }
  },
  {
    '/tags/quizzes/:id': {
      permission: ['read:tag', 'write:tag'],
      reg: /^\/tags\/[^\/]*quizzes\b[^\/]*\/[^\/]*[a-zA-z\d]{24}\/?$/,
      title: 'Quizzes Tags'
    }
  },
  {
    '/tags/rewards/:id': {
      permission: ['read:tag', 'write:tag'],
      reg: /^\/tags\/[^\/]*rewards\b[^\/]*\/[^\/]*[a-zA-z\d]{24}\/?$/,
      title: 'Rewards Tags'
    }
  },
  {
    '/tags/rewards/add': {
      permission: ['write:tag'],
      reg: /^\/tags\/[^\/]*rewards\b[^\/]*\/[^\/]*add\b[^\/]*\/?$/,
      title: 'Rewards Tags'
    }
  },
  {
    '/tags/reward': {
      permission: ['read:tag', 'write:tag'],
      reg: /^\/tags\/[^\/]*reward\b[^\/]*\/?$/,
      title: 'Rewards Tags'
    }
  },
  {
    '/tags/faq': {
      permission: ['read:tag', 'write:tag'],
      reg: /^\/tags\/[^\/]*faq\b[^\/]*\/?$/,
      title: 'FAQ Tags'
    }
  },
  {
    '/tags/faq/add': {
      permission: ['write:tag'],
      reg: /^\/tags\/[^\/]*faq\b[^\/]*\/[^\/]*add\b[^\/]*\/?$/,
      title: 'FAQ Tags'
    }
  },
  {
    '/tags/faq/:id': {
      permission: ['read:tag', 'write:tag'],
      reg: /^\/tags\/[^\/]*faq\b[^\/]*\/[^\/]*[a-zA-z\d]{24}\/?$/,
      title: 'FAQ Tags'
    }
  },
  {
    '/tags/product/add': {
      permission: ['write:tag'],
      reg: /^\/tags\/[^\/]*product\b[^\/]*\/[^\/]*add\b[^\/]*\/?$/,
      title: 'Product Tags'
    }
  },
  {
    '/tags/product/add/:id': {
      permission: ['read:tag', 'write:tag'],
      reg: /^\/tags\/[^\/]*product\b[^\/]*\/[^\/]*add\b[^\/]*\/[^\/]*[a-zA-z\d]{24}\/?$/,
      title: 'Product Tags'
    }
  },
  {
    '/tags/filter/add': {
      permission: ['write:tag'],
      reg: /^\/tags\/[^\/]*filter\b[^\/]*\/[^\/]*add\b[^\/]*\/?$/,
      title: 'Filter Tags'
    }
  },
  {
    '/tags/filter/:id': {
      permission: ['read:tag', 'write:tag'],
      reg: /^\/tags\/[^\/]*filter\b[^\/]*\/[^\/]*[a-zA-z\d]{24}\/?$/,
      title: 'Filter Tags'
    }
  },
  {
    '/tags/filter': {
      permission: ['read:tag', 'write:tag'],
      reg: /^\/tags\/[^\/]*filter\b[^\/]*\/?$/,
      title: 'Filter Tags'
    }
  },
  { '/users': { permission: [], reg: /^\/users[^\/]*\/?$/, title: 'Users' } },
  { '/users/add': { permission: [], reg: /^\/users\/[^\/]*add\b[^\/]*\/?$/, title: 'Users' } },
  {
    '/users/:id': {
      permission: [],
      reg: /^\/users\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Users'
    }
  },
  {
    '/filter': {
      permission: ['read:filter', 'write:filter'],
      reg: /^\/filter[^\/]*\/?$/,
      title: 'Filters'
    }
  },
  {
    '/filter/:id': {
      permission: ['read:filter', 'write:filter'],
      reg: /^\/filter\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Filters'
    }
  },
  {
    '/rewards/': {
      permission: ['read:reward', 'write:reward'],
      reg: /^\/rewards[^\/]*\/?$/,
      title: 'Rewards'
    }
  },
  {
    '/rewards/add': {
      permission: ['write:reward'],
      reg: /^\/rewards\/[^\/]*add\b[^\/]*\/?$/,
      title: 'Rewards'
    }
  },
  {
    '/rewards/:id': {
      permission: ['read:reward', 'write:reward'],
      reg: /^\/rewards\/[^\/]*[a-zA-z\d]{24}[^\/]*\/?$/,
      title: 'Rewards'
    }
  },
  {
    '/quiz-theme': {
      permission: ['read:quizTheme', 'write:quizTheme'],
      reg: /^\/quiz-theme[^\/]*\/?$/,
      title: 'Quiz Theme'
    }
  },
  {
    '/quiz-theme/0': {
      permission: ['read:quizTheme', 'write:quizTheme'],
      reg: /^\/quiz-theme\/[^\/]*0[^\/]*\/?$/,
      title: 'Quiz Theme'
    }
  },
  {
    '/notifications/0': {
      permission: ['write:notifications'],
      reg: /^\/notifications\/[^\/]*0[^\/]*\/?$/,
      title: 'Notifications'
    }
  }
]

export const roles = [
  { id: 'INTERNAL_EDITOR', title: 'internalEditor' },
  { id: 'EXTERNAL_EDITOR', title: 'externalEditor' },
  { id: 'INTERNAL_PUBLISHER', title: 'internalPublisher' },
  { id: 'EXTERNAL_PUBLISHER', title: 'externalPublisher' }
]

export const notificationType = [
  { id: 1, name: 'Push Notifications', to: '/push/0' },
  { id: 2, name: 'Tailored Notifications', to: '/tailored' }
]

export const tailoredNotificationType = [
  {
    id: 'HEALTH_CONNECTION_REMINDER',
    name: 'Health Connection Reminder',
    path: 'Health-Connection-Reminder'
  },
  {
    id: 'PROFILE_COMPLETION_REMINDER',
    name: 'Profile Completion Reminder',
    path: 'Profile-Completion-Reminder'
  },
  {
    id: 'REWARD_REDEMPTION_REMINDER',
    name: 'Reward Redemption Reminder',
    path: 'Reward-Redemption-Reminder'
  },
  { id: 'REVIEW_REMINDER', name: 'Review Reminder', path: 'Review-Reminder' }
]