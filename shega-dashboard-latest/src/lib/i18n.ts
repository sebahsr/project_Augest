export type Lang = 'en' | 'am';

export const messages: Record<Lang, Record<string, string>> = {
  en: {
    // nav / header
    'nav.brand': 'SHEGA | ሸጋ',
    'nav.dashboard': 'Dashboard',
    'nav.rag': 'RAG',
    'nav.login': 'Login',
    'nav.profile': 'Profile & Settings',
    'nav.logout': 'Logout',
    'nav.search': 'Search devices…',
    'nav.live': 'Live air quality & stove safety',

    // footer
    'footer.login': 'Login',
    'footer.dashboard': 'Dashboard',
    'footer.rag': 'RAG',
    'footer.profile': 'Profile',

    // hero / landing (examples)
    'hero.strap': 'Smart Home Environmental Guardian',
    'hero.titleA': 'Breathe easy.',
    'hero.titleB': 'Cook safely with SHEGA | ሸጋ.',
    'hero.intro':
      'Live CO₂, CO, PM, temperature & humidity — clear visuals, instant alerts, and smart actions that keep your home comfortable and safe.',
    'hero.btn.login': 'Login',
    'hero.btn.learn': 'Learn how it works',
    'cta.title': 'Ready to connect your home?',
    'cta.text': 'Sign in to link your devices and start seeing live measurements.',
    'cta.explore': 'Explore devices',
    'brand_sub': 'Smart Home Guardian',
    'sign_in': 'Sign in',
    'dashboard': 'Dashboard',
    'devices': 'Devices',
    'alerts': 'Alerts',
    'settings': 'Settings',
    'my_home': 'My Home',
    'account': 'Account',
    'guest': 'guest',
    'language': 'Language',
    'sign_out': 'Sign out',
    'users': 'Users',

     // labels
    'label.firmware': 'FW',
    'label.fan': 'Fan',
    'label.buzzer': 'Buzzer',
    'label.on': 'on',
    'label.off': 'off',
    'label.lastSeen': 'Last seen',
    'label.alarm':"alarm",

    // controls
    'control.fan': 'Fan',
    'control.buzzer': 'Buzzer',
    'control.ventilate2min': 'Ventilate (2 min)',
    'control.cutoff': 'Safety Cutoff',

    // metrics
    'metric.CO2': 'CO₂',
    'metric.CO': 'CO',
    'metric.PM25': 'PM2.5',
    'metric.PM10': 'PM10',
    'metric.Temp': 'Temp',
    'metric.Humidity': 'Humidity',
    'metric.Pressure': 'Pressure',
    'metric.Stove': 'Stove',

    // units
    'unit.ppm': 'ppm',
    'unit.ugm3': 'µg/m³',
    'unit.celsius': '°C',
    'unit.percent': '%',
    'unit.hpa': 'hPa',

    // issues
    'issue.co2Elevated': 'CO₂ elevated',
    'issue.co2High': 'CO₂ too high',
    'issue.coElevated': 'CO elevated',
    'issue.coHigh': 'CO dangerous',
    'issue.pm25Elevated': 'PM2.5 elevated',
    'issue.pm25High': 'PM2.5 too high',
    'issue.pm10Elevated': 'PM10 elevated',
    'issue.pm10High': 'PM10 too high',
    'issue.stoveHigh': 'Stove temperature high',
    'issue.stoveTooHot': 'Stove temperature dangerous',
    'issue.ambientWarm': 'Room temperature high',
    'issue.ambientTooHot': 'Room temperature dangerous',
    // en
'homes.back': 'Back to households',
'home.label': 'Home',
'home.devices': 'Devices',
'home.noOwners': 'No linked owners',
'device.airnode': 'AIRNODE',
'device.stovenode': 'STOVENODE',
'homes.title': 'Households',
'homes.total': 'total',
'homes.searchPlaceholder': 'Search by homeId…',
'homes.noOwnersShort': '—',
'homes.th.homeId': 'Home ID',
'homes.th.owners': 'Owners',
'homes.th.devices': 'Devices',
'homes.th.statusMix': 'Status mix',
'homes.th.lastSeen': 'Last seen',
'homes.empty': 'No households match your filters.',
'homes.more': 'more',
'filter.status': 'Status',
'filter.type': 'Type',
'filter.anyStatus': 'Any status',
'filter.anyType': 'Any type',
'status.online': 'online',
'status.offline': 'offline',
'status.unknown': 'unknown',

'action.view': 'View',
'pagination.page': 'Page',
'pagination.of': 'of',
'pagination.prev': 'Prev',
'pagination.next': 'Next',
// Users page
'users.title': 'Users',
'users.subtitle': 'Admin-only list of all users and their homes.',
'users.add': 'Add User',
'users.addTitle': 'Add a new user',
'users.loadError': 'Failed to load users',
'users.createError': 'Failed to create user.',
'users.create': 'Create user',
'users.creating': 'Creating…',
'users.create.success': 'User created successfully',
'users.noHomes': 'No homes',
'users.empty': 'No users found.',

// Table headers
'users.th.name': 'Name',
'users.th.email': 'Email',
'users.th.role': 'Role',
'users.th.homes': 'Homes',

// Form
'users.form.nameOptional': 'Name (optional)',
'users.form.email': 'Email',
'users.form.password': 'Password',
'users.form.role': 'Role',
'users.form.homes': 'Homes (comma-separated)',

// Placeholders
'users.placeholder.name': 'Jane Doe',
'users.placeholder.email': 'jane@example.com',
'users.placeholder.password': 'At least 6 characters',
'users.placeholder.homes': 'home-1, home-2',

// Validation
'users.err.emailRequired': 'Email is required.',
'users.err.emailInvalid': 'Please enter a valid email address.',
'users.err.password': 'Password must be at least 6 characters.',
'users.err.roleInvalid': 'Role must be admin or user.',

// Shared
'role.admin': 'admin',
'role.user': 'user',
'action.cancel': 'Cancel',
'loading': 'Loading…',
'label.valve': 'Valve',
'control.alarm': 'Alarm',
'label.open': 'open',
'label.closed': 'closed',
'control.valve': 'Valve',

  },

 am: {
  // nav / header
  'nav.brand': 'SHEGA | ሸጋ',
  'nav.dashboard': 'ዳሽቦርድ',
  'nav.rag': 'የእውቀት መረጃ',
  'nav.login': 'ግባ',
  'nav.profile': 'መገለጫ & ቅንብር',
  'nav.logout': 'ውጣ',
  'nav.search': 'መሣሪያ ፈልግ…',
  'nav.live': 'አየር ጥራት እና የምግብ ቤት ደህንነት በቀጥታ',

  // footer
  'footer.login': 'ግባ',
  'footer.dashboard': 'ዳሽቦርድ',
  'footer.rag': 'መረጃ',
  'footer.profile': 'መገለጫ',

  // hero / landing (examples)
  'hero.strap': 'የቤት አካባቢና የምግብ ቤት ጠባቂ',
  'hero.titleA': 'ንፁህ አየር እንተንፈስ።',
  'hero.titleB': 'SHEGA | ሸጋ በመጠቀም በደህና ያብስሉ።',
  'hero.intro':
    'CO₂፣ CO፣ ጭስ፣ ሙቀት እና እርጥበትን በቀጥታ ተመልከት — ግልጽ ማሳያ፣ ወቅታዊ ማንቂያ፣ እና ቤትህን የሚያዳኩ ብልህ እርምጃዎች።',
  'hero.btn.login': 'ግባ',
  'hero.btn.learn': 'እንዴት እንደሚሰራ ይወቁ',
  'cta.title': 'ቤትህን ለማገናኘት ዝግጁ ነህ?',
  'cta.text': 'መሣሪያዎችህን አገናኝ እና በቀጥታ መለኪያዎችን ተመልከት።',
  'cta.explore': 'መሣሪያዎችን ተመልከት',

  'brand_sub': 'የቤት ብልህ ጠባቂ',
  'sign_in': 'ግባ',
  'dashboard': 'ዳሽቦርድ',
  'devices': 'መሣሪያዎች',
  'alerts': 'ማንቂያዎች',
  'settings': 'ቅንብር',
  'my_home': 'ቤቴ',
  'account': 'መለያ',
  'guest': 'እንግዳ',
  'language': 'ቋንቋ',
  'sign_out': 'ውጣ',
  'users': 'ተጠቃሚዎች',
  'label.firmware': 'ፋ.ዌር',         // Firmware (short)
    'label.fan': 'ፋን',
    'label.buzzer': 'ቢዘር',
    'label.on': 'እርምጃ ላይ',
    'label.off': 'ጠፍቷል',
    'label.lastSeen': 'መጨረሻ ታየበት',

    // controls
    'control.fan': 'ፋን',
    'control.buzzer': 'ቢዘር',
    'control.ventilate2min': 'አየር አቅርብ (2 ደቂቃ)',
    'control.cutoff': 'የደህንነት መቁረጫ',

    // metrics
    'metric.CO2': 'CO₂',
    'metric.CO': 'CO',
    'metric.PM25': 'PM2.5',
    'metric.PM10': 'PM10',
    'metric.Temp': 'ሙቀት',
    'metric.Humidity': 'እርጥበት',
    'metric.Pressure': 'ግፊት',
    'metric.Stove': 'እቃጭ',

    // units
    'unit.ppm': 'ppm',
    'unit.ugm3': 'µg/m³',
    'unit.celsius': '°C',
    'unit.percent': '%',
    'unit.hpa': 'hPa',

    // issues
    'issue.co2Elevated': 'CO₂ ከመጠን በላይ',
    'issue.co2High': 'CO₂ እጅግ ከፍተኛ',
    'issue.coElevated': 'CO ከመጠን በላይ',
    'issue.coHigh': 'CO አደገኛ',
    'issue.pm25Elevated': 'PM2.5 ከመጠን በላይ',
    'issue.pm25High': 'PM2.5 እጅግ ከፍተኛ',
    'issue.pm10Elevated': 'PM10 ከመጠን በላይ',
    'issue.pm10High': 'PM10 እጅግ ከፍተኛ',
    'issue.stoveHigh': 'የምግብ ቤት ሙቀት ከፍ ነው',
    'issue.stoveTooHot': 'የምግብ ቤት ሙቀት አደገኛ ነው',
    'issue.ambientWarm': 'የክፍል ሙቀት ከፍ ነው',
    'issue.ambientTooHot': 'የክፍል ሙቀት አደገኛ ነው',
    'homes.back': 'ወደ ተጠቃሚዎች ተመለስ',
'home.label': 'ቤት',
'home.devices': 'መሣሪያዎች',
'home.noOwners': 'ባለቤት አልተገናኙም',
'device.airnode': 'AIRNODE',
'device.stovenode': 'STOVENODE',
'homes.title': 'ተጠቃሚዎች', 
'homes.total': 'አጠቃላይ',
'homes.searchPlaceholder': 'በቤት መታወቂያ ፈልግ…',
'homes.noOwnersShort': '—',
'homes.th.homeId': 'የቤት መታወቂያ',
'homes.th.owners': 'ባለቤቶች',
'homes.th.devices': 'መሣሪያዎች',
'homes.th.statusMix': 'የሁኔታ ማዕከል',
'homes.th.lastSeen': 'መጨረሻ ታየበት',
'homes.empty': 'ከሚያጣጥሙ ማጣሪያዎች ጋር ተጠቃሚዎች አልተገኙም።',
'homes.more': 'ተጨማሪ',
'filter.status': 'ሁኔታ',
'filter.type': 'አይነት',
'filter.anyStatus': 'ማንኛውም ሁኔታ',
'filter.anyType': 'ማንኛውም አይነት',
'status.online': 'በመስመር',
'status.offline': 'ከመስመር ውጭ',
'status.unknown': 'አይታወቅም',

'action.view': 'አሳይ',
'pagination.page': 'ገጽ',
'pagination.of': 'ከ',
'pagination.prev': 'ወደ ፊት',
'pagination.next': 'ወደ ኋላ',
// Users page
'users.title': 'ተጠቃሚዎች',
'users.subtitle': 'የአስተዳዳሪ ለብቻ የሁሉም ተጠቃሚዎች እና ቤቶቻቸው ዝርዝር።',
'users.add': 'ተጠቃሚ ጨምር',
'users.addTitle': 'አዲስ ተጠቃሚ አክል',
'users.loadError': 'ተጠቃሚዎች መጫን አልተቻለም',
'users.createError': 'ተጠቃሚ መፍጠር አልተቻለም።',
'users.create': 'ተጠቃሚ ፍጠር',
'users.creating': 'በመፍጠር ላይ…',
'users.create.success': 'ተጠቃሚው ተፈጥሯል',
'users.noHomes': 'ቤት የለም',
'users.empty': 'ምንም ተጠቃሚ አልተገኘም።',

// Table headers
'users.th.name': 'ስም',
'users.th.email': 'ኢሜይል',
'users.th.role': 'ሚና',
'users.th.homes': 'ቤቶች',

// Form
'users.form.nameOptional': 'ስም (አማራጭ)',
'users.form.email': 'ኢሜይል',
'users.form.password': 'የይለፍ ቃል',
'users.form.role': 'ሚና',
'users.form.homes': 'ቤቶች (በኮማ የተለዩ)',

// Placeholders
'users.placeholder.name': 'ጄይን ዶ',
'users.placeholder.email': 'jane@example.com',
'users.placeholder.password': 'ቢያንስ 6 ቁምፊዎች',
'users.placeholder.homes': 'home-1, home-2',

// Validation
'users.err.emailRequired': 'ኢሜይል ያስፈልጋል።',
'users.err.emailInvalid': 'እባክዎ ትክክለኛ ኢሜይል ያስገቡ።',
'users.err.password': 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች ይሁን።',
'users.err.roleInvalid': 'ሚና አስተዳዳሪ ወይም ተጠቃሚ መሆን አለበት።',

// Shared
'role.admin': 'አስተዳዳሪ',
'role.user': 'ተጠቃሚ',
'action.cancel': 'ሰርዝ',
'loading': 'በመጫን ላይ…',
'label.valve':' ቫልቭ',
'control.alarm': 'አላርም',
'label.open': 'ክፍት',
'label.closed': 'ዝግ',
'control.valve': 'ቫልቭ',
'label.alarm' :'አላርም'
},

};
