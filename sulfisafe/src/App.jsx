import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import "./App.css";

const _sbUrl = import.meta.env.VITE_SUPABASE_URL;
const _sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!_sbUrl || !_sbKey) {
  throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. See .env.example.");
}
const Pa = createClient(_sbUrl, _sbKey);
const l = React;
const z = { jsx, jsxs, Fragment };

// SECURITY: demo credentials removed. Use Supabase Auth / env config; never hardcode passwords or OTPs.
// Shown only when explicitly enabled via VITE_SHOW_DEMO_HINT=true for local dev.
let Ia = import.meta.env.VITE_DEMO_ADMIN_ID || ``,
  La = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || ``,
  Ra = import.meta.env.VITE_DEMO_OTP || ``,
  za = {
    en: {
      chooseLanguage: `Choose Your Language`,
      languageDescription: `Select your preferred language to continue.`,
      continue: `Continue`,
      back: `Back`,
      welcome: `Welcome to SulfiSafe`,
      welcomeText: `Industrial safety monitoring and H₂S exposure management.`,
      employeePortal: `Employee Portal`,
      adminPortal: `Administrator Portal`,
      employeePortalText: `Access your safety identity, exposure information and workplace records.`,
      adminPortalText: `Monitor employees, safety conditions, reports and high-risk areas.`,
      employeeLogin: `Employee Login`,
      adminLogin: `Admin Login`,
      employeeId: `Employee ID`,
      adminId: `Admin ID`,
      password: `Password`,
      login: `Log In`,
      logout: `Logout`,
      forgotPassword: `Forgot Password?`,
      signUp: `Sign Up`,
      createAccount: `Create Employee Account`,
      noAccount: `Don't have an account?`,
      alreadyAccount: `Already have an account?`,
      fullName: `Full Name`,
      organisation: `Organisation`,
      branch: `Branch / Location`,
      sector: `Sector`,
      bloodGroup: `Blood Group`,
      phone: `Phone Number`,
      profilePicture: `Profile Picture`,
      confirmPassword: `Confirm Password`,
      setPassword: `Set Password`,
      save: `Save Changes`,
      employeeDashboard: `Employee Dashboard`,
      adminDashboard: `Admin Dashboard`,
      notifications: `Notifications`,
      digitalId: `Digital Safety ID`,
      historyLogs: `History & Logs`,
      exposure: `Exposure Analysis`,
      h2sMonitoring: `H₂S Exposure Monitoring`,
      profile: `Update Profile`,
      emergency: `EMERGENCY SOS`,
      reportIssue: `Report an Issue`,
      emergencyNumber: `Emergency Number`,
      currentStatus: `Current Safety Status`,
      safe: `SAFE`,
      risk: `AT RISK`,
      temperature: `Temperature`,
      humidity: `Humidity`,
      cumulativeDose: `Estimated Cumulative H₂S Dose`,
      wristband: `Wristband Status`,
      valid: `Valid`,
      expired: `Expired`,
      exposureDay: `1 Day`,
      exposureWeek: `1 Week`,
      exposureMonth: `1 Month`,
      entry: `Entry`,
      exit: `Exit`,
      estimated: `Estimated value – environmental conditions may influence colourimetric reaction speed.`,
      issueTitle: `Issue Title`,
      issueDescription: `Describe the issue`,
      submitReport: `Submit Report`,
      searchEmployee: `Search Employee ID or Name`,
      totalEmployees: `Registered Employees`,
      safeEmployees: `Safe Employees`,
      riskEmployees: `At Risk`,
      activeReports: `Active Reports`,
      employeeReports: `Employee Reports`,
      emergencyAlerts: `Emergency Alerts`,
      sendAlert: `Send Safety Alert`,
      alertMessage: `Safety alert message`,
      noNotifications: `No new notifications`,
      resetPassword: `Reset Password`,
      enterPhone: `Enter your registered phone number`,
      enterOtp: `Enter the 6-digit OTP`,
      newPassword: `New Password`,
      confirmNewPassword: `Confirm New Password`,
      verifyOtp: `Verify OTP`,
      updatePassword: `Update Password`,
      otpHint: `Check your registered phone for the OTP`,
      adminReset: `Admin Password Reset`,
      employeeReset: `Employee Password Reset`,
    },
    hi: {
      chooseLanguage: `अपनी भाषा चुनें`,
      languageDescription: `आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें।`,
      continue: `जारी रखें`,
      back: `वापस`,
      welcome: `SulfiSafe में आपका स्वागत है`,
      welcomeText: `औद्योगिक सुरक्षा और H₂S एक्सपोज़र प्रबंधन।`,
      employeePortal: `कर्मचारी पोर्टल`,
      adminPortal: `प्रशासक पोर्टल`,
      employeePortalText: `अपनी सुरक्षा पहचान और कार्यस्थल रिकॉर्ड देखें।`,
      adminPortalText: `कर्मचारियों और सुरक्षा स्थितियों की निगरानी करें।`,
      employeeLogin: `कर्मचारी लॉगिन`,
      adminLogin: `एडमिन लॉगिन`,
      employeeId: `कर्मचारी आईडी`,
      adminId: `एडमिन आईडी`,
      password: `पासवर्ड`,
      login: `लॉगिन`,
      logout: `लॉग आउट`,
      forgotPassword: `पासवर्ड भूल गए?`,
      signUp: `साइन अप`,
      createAccount: `कर्मचारी अकाउंट बनाएं`,
      noAccount: `क्या आपका अकाउंट नहीं है?`,
      alreadyAccount: `पहले से अकाउंट है?`,
      fullName: `पूरा नाम`,
      organisation: `संगठन`,
      branch: `ब्रांच / स्थान`,
      sector: `सेक्टर`,
      bloodGroup: `ब्लड ग्रुप`,
      phone: `फोन नंबर`,
      profilePicture: `प्रोफाइल फोटो`,
      confirmPassword: `पासवर्ड की पुष्टि करें`,
      setPassword: `पासवर्ड सेट करें`,
      save: `बदलाव सेव करें`,
      employeeDashboard: `कर्मचारी डैशबोर्ड`,
      adminDashboard: `एडमिन डैशबोर्ड`,
      notifications: `सूचनाएं`,
      digitalId: `डिजिटल सुरक्षा आईडी`,
      historyLogs: `इतिहास और लॉग`,
      exposure: `एक्सपोज़र विश्लेषण`,
      profile: `प्रोफाइल अपडेट करें`,
      emergency: `आपातकालीन SOS`,
      reportIssue: `समस्या रिपोर्ट करें`,
      emergencyNumber: `आपातकालीन नंबर`,
      currentStatus: `वर्तमान सुरक्षा स्थिति`,
      safe: `सुरक्षित`,
      risk: `जोखिम में`,
      temperature: `तापमान`,
      humidity: `नमी`,
      cumulativeDose: `अनुमानित H₂S डोज़`,
      wristband: `रिस्टबैंड स्थिति`,
      valid: `वैध`,
      expired: `समाप्त`,
      exposureDay: `1 दिन`,
      exposureWeek: `1 सप्ताह`,
      exposureMonth: `1 महीना`,
      entry: `प्रवेश`,
      exit: `निकास`,
      estimated: `अनुमानित मूल्य – पर्यावरणीय परिस्थितियां परिणामों को प्रभावित कर सकती हैं।`,
      issueTitle: `समस्या का शीर्षक`,
      issueDescription: `समस्या का विवरण`,
      submitReport: `रिपोर्ट भेजें`,
      searchEmployee: `कर्मचारी खोजें`,
      totalEmployees: `पंजीकृत कर्मचारी`,
      safeEmployees: `सुरक्षित कर्मचारी`,
      riskEmployees: `जोखिम वाले कर्मचारी`,
      activeReports: `सक्रिय रिपोर्ट`,
      employeeReports: `कर्मचारी रिपोर्ट`,
      emergencyAlerts: `आपातकालीन अलर्ट`,
      sendAlert: `सुरक्षा अलर्ट भेजें`,
      alertMessage: `सुरक्षा अलर्ट संदेश`,
      noNotifications: `कोई नई सूचना नहीं`,
      resetPassword: `पासवर्ड रीसेट करें`,
      enterPhone: `पंजीकृत फोन नंबर दर्ज करें`,
      enterOtp: `6 अंकों का OTP दर्ज करें`,
      newPassword: `नया पासवर्ड`,
      confirmNewPassword: `नए पासवर्ड की पुष्टि करें`,
      verifyOtp: `OTP सत्यापित करें`,
      updatePassword: `पासवर्ड अपडेट करें`,
      otpHint: `OTP आपके पंजीकृत फोन पर भेजा गया है`,
    },
    kn: {
      chooseLanguage: `ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ`,
      languageDescription: `ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.`,
      continue: `ಮುಂದುವರಿಸಿ`,
      back: `ಹಿಂದೆ`,
      welcome: `SulfiSafe ಗೆ ಸ್ವಾಗತ`,
      welcomeText: `ಕೈಗಾರಿಕಾ ಸುರಕ್ಷತೆ ಮತ್ತು H₂S ಎಕ್ಸ್‌ಪೋಸರ್ ನಿರ್ವಹಣೆ.`,
      employeePortal: `ಉದ್ಯೋಗಿ ಪೋರ್ಟಲ್`,
      adminPortal: `ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್`,
      employeeLogin: `ಉದ್ಯೋಗಿ ಲಾಗಿನ್`,
      adminLogin: `ನಿರ್ವಾಹಕ ಲಾಗಿನ್`,
      employeeId: `ಉದ್ಯೋಗಿ ಐಡಿ`,
      adminId: `ನಿರ್ವಾಹಕ ಐಡಿ`,
      password: `ಪಾಸ್‌ವರ್ಡ್`,
      login: `ಲಾಗಿನ್`,
      logout: `ಲಾಗ್ ಔಟ್`,
      forgotPassword: `ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?`,
      signUp: `ನೋಂದಣಿ`,
      employeeDashboard: `ಉದ್ಯೋಗಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್`,
      adminDashboard: `ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್`,
      notifications: `ಅಧಿಸೂಚನೆಗಳು`,
      digitalId: `ಡಿಜಿಟಲ್ ಸುರಕ್ಷತಾ ಗುರುತಿನ ಚೀಟಿ`,
      historyLogs: `ಇತಿಹಾಸ ಮತ್ತು ದಾಖಲೆಗಳು`,
      exposure: `ಎಕ್ಸ್‌ಪೋಸರ್ ವಿಶ್ಲೇಷಣೆ`,
      profile: `ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ`,
      emergency: `ತುರ್ತು SOS`,
      reportIssue: `ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ`,
      safe: `ಸುರಕ್ಷಿತ`,
      risk: `ಅಪಾಯದಲ್ಲಿ`,
      temperature: `ತಾಪಮಾನ`,
      humidity: `ಆರ್ದ್ರತೆ`,
    },
    ta: {
      chooseLanguage: `உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்`,
      languageDescription: `தொடர உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்.`,
      continue: `தொடரவும்`,
      back: `பின் செல்லவும்`,
      welcome: `SulfiSafe-க்கு வரவேற்கிறோம்`,
      welcomeText: `தொழில்துறை பாதுகாப்பு மற்றும் H₂S வெளிப்பாடு மேலாண்மை.`,
      employeePortal: `பணியாளர் போர்டல்`,
      adminPortal: `நிர்வாகி போர்டல்`,
      employeeLogin: `பணியாளர் உள்நுழைவு`,
      adminLogin: `நிர்வாகி உள்நுழைவு`,
      employeeId: `பணியாளர் ஐடி`,
      adminId: `நிர்வாகி ஐடி`,
      password: `கடவுச்சொல்`,
      login: `உள்நுழையவும்`,
      logout: `வெளியேறு`,
      forgotPassword: `கடவுச்சொல் மறந்துவிட்டதா?`,
      signUp: `பதிவு செய்யவும்`,
      employeeDashboard: `பணியாளர் டாஷ்போர்டு`,
      adminDashboard: `நிர்வாக டாஷ்போர்டு`,
      notifications: `அறிவிப்புகள்`,
      digitalId: `டிஜிட்டல் பாதுகாப்பு அட்டை`,
      historyLogs: `வரலாறு மற்றும் பதிவுகள்`,
      exposure: `வெளிப்பாடு பகுப்பாய்வு`,
      profile: `சுயவிவரத்தை புதுப்பிக்கவும்`,
      emergency: `அவசர SOS`,
      reportIssue: `சிக்கலைப் புகாரளிக்கவும்`,
      safe: `பாதுகாப்பானது`,
      risk: `ஆபத்தில்`,
      temperature: `வெப்பநிலை`,
      humidity: `ஈரப்பதம்`,
    },
    ml: {
      chooseLanguage: `നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക`,
      languageDescription: `തുടരുന്നതിന് നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക.`,
      continue: `തുടരുക`,
      back: `തിരികെ`,
      welcome: `SulfiSafe-ലേക്ക് സ്വാഗതം`,
      welcomeText: `വ്യാവസായിക സുരക്ഷയും H₂S എക്സ്പോഷർ മാനേജ്മെന്റും.`,
      employeePortal: `ജീവനക്കാരുടെ പോർട്ടൽ`,
      adminPortal: `അഡ്മിൻ പോർട്ടൽ`,
      employeeLogin: `ജീവനക്കാരുടെ ലോഗിൻ`,
      adminLogin: `അഡ്മിൻ ലോഗിൻ`,
      employeeId: `ജീവനക്കാരുടെ ഐഡി`,
      adminId: `അഡ്മിൻ ഐഡി`,
      password: `പാസ്‌വേഡ്`,
      login: `ലോഗിൻ`,
      logout: `ലോഗ് ഔട്ട്`,
      forgotPassword: `പാസ്‌വേഡ് മറന്നോ?`,
      signUp: `സൈൻ അപ്പ്`,
      employeeDashboard: `ജീവനക്കാരുടെ ഡാഷ്ബോർഡ്`,
      adminDashboard: `അഡ്മിൻ ഡാഷ്ബോർഡ്`,
      notifications: `അറിയിപ്പുകൾ`,
      digitalId: `ഡിജിറ്റൽ സുരക്ഷാ ഐഡി`,
      historyLogs: `ചരിത്രവും രേഖകളും`,
      exposure: `എക്സ്പോഷർ വിശകലനം`,
      profile: `പ്രൊഫൈൽ അപ്ഡേറ്റ് ചെയ്യുക`,
      emergency: `അടിയന്തര SOS`,
      reportIssue: `പ്രശ്നം റിപ്പോർട്ട് ചെയ്യുക`,
      safe: `സുരക്ഷിതം`,
      risk: `അപകടസാധ്യത`,
      temperature: `താപനില`,
      humidity: `ഈർപ്പം`,
    },
    tcy: {
      chooseLanguage: `ನಿಕ್ಕ್ ಭಾಷೆ ಆಯ್ಕೆ ಮಲ್ಪುಲೆ`,
      languageDescription: `ಮುಂದೆ ಪೊವೊಡ್ಗೆ ಭಾಷೆ ಆಯ್ಕೆ ಮಲ್ಪುಲೆ.`,
      continue: `ಮುಂದೆ ಪೊಲೆ`,
      back: `ಪಿರತ`,
      welcome: `SulfiSafe ಗೆ ಸ್ವಾಗತ`,
      welcomeText: `ಕೈಗಾರಿಕಾ ಸುರಕ್ಷತೆ ಮತ್ H₂S ಎಕ್ಸ್‌ಪೋಸರ್ ನಿರ್ವಹಣೆ.`,
      employeePortal: `ಕೆಲಸಗಾರ ಪೋರ್ಟಲ್`,
      adminPortal: `ಅಡ್ಮಿನ್ ಪೋರ್ಟಲ್`,
      employeeLogin: `ಕೆಲಸಗಾರ ಲಾಗಿನ್`,
      adminLogin: `ಅಡ್ಮಿನ್ ಲಾಗಿನ್`,
      employeeId: `ಕೆಲಸಗಾರ ಐಡಿ`,
      adminId: `ಅಡ್ಮಿನ್ ಐಡಿ`,
      password: `ಪಾಸ್‌ವರ್ಡ್`,
      login: `ಲಾಗಿನ್`,
      logout: `ಲಾಗ್ ಔಟ್`,
      forgotPassword: `ಪಾಸ್‌ವರ್ಡ್ ಮರೆತೆರಾ?`,
      signUp: `ಸೈನ್ ಅಪ್`,
      employeeDashboard: `ಕೆಲಸಗಾರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್`,
      adminDashboard: `ಅಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್`,
      notifications: `ಅಧಿಸೂಚನೆ`,
      digitalId: `ಡಿಜಿಟಲ್ ಸುರಕ್ಷತಾ ಐಡಿ`,
      historyLogs: `ಇತಿಹಾಸ`,
      exposure: `ಎಕ್ಸ್‌ಪೋಸರ್`,
      profile: `ಪ್ರೊಫೈಲ್`,
      emergency: `ತುರ್ತು SOS`,
      reportIssue: `ಸಮಸ್ಯೆ ವರದಿ`,
      safe: `ಸುರಕ್ಷಿತ`,
      risk: `ಅಪಾಯ`,
      temperature: `ತಾಪಮಾನ`,
      humidity: `ಆರ್ದ್ರತೆ`,
    },
  },
  Ba = [
    { code: `en`, native: `English`, name: `English` },
    { code: `hi`, native: `हिंदी`, name: `Hindi` },
    { code: `kn`, native: `ಕನ್ನಡ`, name: `Kannada` },
    { code: `ta`, native: `தமிழ்`, name: `Tamil` },
    { code: `ml`, native: `മലയാളം`, name: `Malayalam` },
    { code: `tcy`, native: `ತುಳು`, name: `Tulu` },
  ],
  Va = [
    {
      id: `neon_yellow`,
      label: `Neon Yellow`,
      hex: `#f8ff6a`,
      deltaE: 3.1,
      ppm: 0.8,
      status: `NORMAL`,
      riskStatus: `Safe`,
    },
    {
      id: `light_tan`,
      label: `Light Tan`,
      hex: `#f4cc8f`,
      deltaE: 8.2,
      ppm: 2.4,
      status: `NORMAL`,
      riskStatus: `Safe`,
    },
    {
      id: `dark_tan`,
      label: `Dark Tan`,
      hex: `#f0b87f`,
      deltaE: 14.5,
      ppm: 4.8,
      status: `ACTION_REQUIRED`,
      riskStatus: `At Risk`,
    },
    {
      id: `red_brown`,
      label: `Red Brown`,
      hex: `#bf5f3a`,
      deltaE: 19.3,
      ppm: 6.5,
      status: `ACTION_REQUIRED`,
      riskStatus: `At Risk`,
    },
    {
      id: `dark_orange`,
      label: `Dark Orange`,
      hex: `#d06e1f`,
      deltaE: 25.1,
      ppm: 8.5,
      status: `DANGER_EXCEEDED`,
      riskStatus: `At Risk`,
    },
  ],
  Ha = (e = Va[0]) => ({
    badgeId: `SFS-EMP001-07`,
    observedColor: e.id,
    colorLabel: e.label,
    colorHex: e.hex,
    deltaE: e.deltaE,
    ppm: e.ppm,
    cumulativeDose: `${(e.ppm * 8).toFixed(1)} ppm·h`,
    complianceStatus: e.status,
    scannedAt: `09 Sep 2026, 10:42 AM`,
    source: `SulfScan colorimetry`,
  }),
  Ua = {
    id: `demo-employee`,
    fullName: `Demo Employee`,
    employeeId: `EMP001`,
    organisation: `SulfiSafe Industries`,
    branch: `Main Plant`,
    sector: `Industrial Operations`,
    bloodGroup: `O+`,
    phone: `9876543210`,
    // SECURITY: no hardcoded demo password. Use Supabase Auth; seed password must come from env if needed.
    password: import.meta.env.VITE_DEMO_EMPLOYEE_PASSWORD || null,
    profilePicture: ``,
    riskStatus: `Safe`,
    cumulativeDose: `28.8 ppm·h`,
    temperature: 29,
    humidity: 63,
    bandExpiry: `30 September 2026`,
    scanData: Ha(),
  },
  Wa = (e) => ({ ...e, scanData: e.scanData || Ua.scanData });
function Ga() {
  let [e, t] = (0, l.useState)(
      () => localStorage.getItem(`sulfisafe_page`) || `language`,
    ),
    [n, r] = (0, l.useState)(
      () => localStorage.getItem(`sulfisafe_lang`) || `en`,
    ),
    [i, a] = (0, l.useState)([]),
    [o, s] = (0, l.useState)(() => {
      // SECURITY: safe JSON.parse with fallback; never trust raw localStorage.
      try {
        let e = localStorage.getItem(`sulfisafe_currentEmployee`);
        return e ? JSON.parse(e) : null;
      } catch (err) {
        console.error(`Corrupt sulfisafe_currentEmployee in localStorage, resetting.`);
        try {
          localStorage.removeItem(`sulfisafe_currentEmployee`);
        } catch {}
        return null;
      }
    });
  ((0, l.useEffect)(() => {
    localStorage.setItem(`sulfisafe_page`, e);
  }, [e]),
    (0, l.useEffect)(() => {
      localStorage.setItem(`sulfisafe_lang`, n);
    }, [n]),
    (0, l.useEffect)(() => {
      // SECURITY: never persist password in localStorage.
      if (o) {
        const { password: _pw, ...safe } = o;
        try {
          localStorage.setItem(`sulfisafe_currentEmployee`, JSON.stringify(safe));
        } catch (err) {
          console.error(`Could not persist current employee safely.`);
        }
      } else {
        localStorage.removeItem(`sulfisafe_currentEmployee`);
      }
    }, [o]));

  let [c, u] = (0, l.useState)([]),
    [d, f] = (0, l.useState)([]),
    [p, m] = (0, l.useState)([]),
    [h, g] = (0, l.useState)([]),
    [_, v] = (0, l.useState)(!1),
    [y, b] = (0, l.useState)(``),
    [x, ee] = (0, l.useState)(null),
    [te, S] = (0, l.useState)(``),
    [ne, C] = (0, l.useState)(``),
    [re, ie] = (0, l.useState)(`employee`),
    [ae, oe] = (0, l.useState)(``),
    [se, ce] = (0, l.useState)(null),
    [le, ue] = (0, l.useState)(``),
    [de, w] = (0, l.useState)(`day`),
    [T, fe] = (0, l.useState)(``),
    [pe, me] = (0, l.useState)(``),
    [he, E] = (0, l.useState)(!1),
    [D, ge] = (0, l.useState)(``),
    _e = (0, l.useRef)(null),
    ve = (0, l.useRef)(null),
    ye = (0, l.useRef)(null),
    O = { ...za.en, ...(za[n] || {}) };

  // Route guard: safely fallback to language if unauthenticated or invalid
  (0, l.useEffect)(() => {
    const employeeRoutes = ['employeeDashboard', 'history', 'exposure', 'reportIssue', 'profile', 'digitalId'];
    if (employeeRoutes.includes(e) && !o) {
      t('language');
    }
    if (e === 'adminEmployee' && !x) {
      t('adminDashboard');
    }
  }, [e, o, x]);
  ((0, l.useEffect)(() => {
    let e = async () => {
      try {
        let { data: e } = await Pa.from(`sulfisafe_employees`).select(`*`);
        if (e && e.length > 0) {
          let t = e.map((e) => Wa(e.data));
          (a(t),
            s(
              (e) =>
                e &&
                (t.find(
                  (t) =>
                    String(t.id) === String(e.id) ||
                    t.employeeId === e.employeeId,
                ) ||
                  e),
            ));
        } else a([Ua]);
        let { data: t } = await Pa.from(`sulfisafe_issues`).select(`*`);
        t && u(t.map((e) => e.data));
        let { data: n } = await Pa.from(`sulfisafe_emergencies`).select(`*`);
        n && f(n.map((e) => e.data));
        let { data: r } = await Pa.from(`sulfisafe_alerts`).select(`*`);
        r && m(r.map((e) => e.data));
      } catch (e) {
        console.error(`Supabase load error:`, e);
      }
    };
    e();
    let t = Pa.channel(`sulfisafe_dashboard_live`)
        .on(
          `postgres_changes`,
          { event: `*`, schema: `public`, table: `sulfisafe_employees` },
          () => {
            e();
          },
        )
        .on(
          `postgres_changes`,
          { event: `*`, schema: `public`, table: `sulfisafe_alerts` },
          () => {
            e();
          },
        )
        .subscribe(),
      n = setInterval(e, 3e3);
    return () => {
      (Pa.removeChannel(t), clearInterval(n));
    };
  }, []),
    (0, l.useEffect)(() => {
      // SECURITY: strip passwords before caching employees locally.
      if (i.length > 0) {
        try {
          const safe = i.map(({ password: _pw, ...rest }) => rest);
          localStorage.setItem(`sulfisafeEmployees`, JSON.stringify(safe));
        } catch (err) {
          console.error(`Could not cache employees safely.`);
        }
      }
    }, [i]),
    (0, l.useEffect)(() => {
      ((async () => {
        c.length > 0 &&
          (await Pa.from(`sulfisafe_issues`).upsert(
            c.map((e) => ({ id: String(e.id), data: e })),
          ));
      })(),
        localStorage.setItem(`sulfisafeIssues`, JSON.stringify(c)));
    }, [c]),
    (0, l.useEffect)(() => {
      localStorage.setItem(`sulfisafeEmergencies`, JSON.stringify(d));
    }, [d]),
    (0, l.useEffect)(() => {
      ((async () => {
        p.length > 0 &&
          (await Pa.from(`sulfisafe_alerts`).upsert(
            p.map((e) => ({ id: String(e.id), data: e })),
          ));
      })(),
        localStorage.setItem(`sulfisafeAlerts`, JSON.stringify(p)));
    }, [p]),
    (0, l.useEffect)(
      () => () => {
        we();
      },
      [],
    ));
  let be = (e) => {
      (S(e),
        C(``),
        setTimeout(() => {
          S(``);
        }, 3500));
    },
    xe = () => {
      (C(``),
        S(``),
        t(
          {
            loginChoice: `language`,
            employeeLogin: `loginChoice`,
            adminLogin: `loginChoice`,
            signup: `employeeLogin`,
            forgotPassword: re === `admin` ? `adminLogin` : `employeeLogin`,
            verifyOtp: `forgotPassword`,
            newPassword: `verifyOtp`,
            employeeProfile: `employeeDashboard`,
            history: `employeeDashboard`,
            exposure: `employeeDashboard`,
            reportIssue: `employeeDashboard`,
            adminEmployee: `adminDashboard`,
          }[e] || `loginChoice`,
        ));
    },
    Se = () => {
      (we(), s(null), ee(null), v(!1), t(`loginChoice`));
    },
    Ce = (e, t) => {
      g((n) => [
        {
          id: Date.now(),
          title: e,
          body: t,
          time: new Date().toLocaleString(),
        },
        ...n,
      ]);
    },
    we = () => {
      ((ye.current &&=
        (ye.current.getTracks().forEach((e) => {
          e.stop();
        }),
        null)),
        _e.current && (_e.current.srcObject = null),
        E(!1));
    },
    Te = async (e) => {
      try {
        (we(), ge(e));
        let t = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: `user` },
          audio: !1,
        });
        ((ye.current = t),
          E(!0),
          setTimeout(() => {
            _e.current && ((_e.current.srcObject = t), _e.current.play());
          }, 100));
      } catch (e) {
        (console.error(e),
          C(`Camera access was denied or is not available on this device.`));
      }
    },
    Ee = () => {
      if (!_e.current || !ve.current) return;
      let e = _e.current,
        t = ve.current;
      ((t.width = e.videoWidth),
        (t.height = e.videoHeight),
        t.getContext(`2d`).drawImage(e, 0, 0, t.width, t.height));
      let n = t.toDataURL(`image/jpeg`, 0.85);
      (D === `signup` && fe(n),
        D === `profile` && me(n),
        we(),
        be(`Profile photo captured successfully.`));
    },
    k = (e, t) => {
      let n = e.target.files?.[0];
      if (!n) return;
      let r = new FileReader();
      ((r.onloadend = () => {
        (t === `signup` && fe(r.result),
          t === `profile` && me(r.result),
          be(`Profile photo selected successfully.`));
      }),
        r.readAsDataURL(n),
        (e.target.value = ``));
    },
    De = (e) => {
      (e === `signup` && fe(``),
        e === `profile` && me(``),
        be(`Profile photo removed.`));
    },
    Oe = (e) => {
      e.preventDefault();
      let n = new FormData(e.target),
        r = n.get(`employeeId`).trim(),
        a = n.get(`password`),
        o = i.find(
          (e) =>
            e.employeeId.toLowerCase() === r.toLowerCase() && e.password === a,
        );
      if (!o) {
        C(`Invalid Employee ID or password.`);
        return;
      }
      (s(o),
        C(``),
        Ce(`Welcome to SulfiSafe`, `Your employee safety dashboard is ready.`),
        t(`employeeDashboard`));
    },
    ke = (e) => {
      e.preventDefault();
      let n = new FormData(e.target),
        r = n.get(`adminId`),
        i = n.get(`password`);
      if (r !== Ia || i !== La) {
        C(`Invalid Admin ID or password.`);
        return;
      }
      (C(``), t(`adminDashboard`));
    },
    Ae = (e) => {
      e.preventDefault();
      let n = new FormData(e.target),
        r = n.get(`password`);
      if (r !== n.get(`confirmPassword`)) {
        C(`Passwords do not match.`);
        return;
      }
      let o = n.get(`employeeId`).trim();
      if (i.some((e) => e.employeeId.toLowerCase() === o.toLowerCase())) {
        C(`This Employee ID is already registered.`);
        return;
      }
      let s = {
        id: Date.now().toString(),
        fullName: n.get(`fullName`),
        employeeId: o,
        organisation: n.get(`organisation`),
        branch: n.get(`branch`),
        sector: n.get(`sector`),
        bloodGroup: n.get(`bloodGroup`),
        phone: n.get(`phone`),
        password: r,
        profilePicture: T,
        riskStatus: `Safe`,
        cumulativeDose: `0.0 ppm·h`,
        temperature: 28,
        humidity: 60,
        bandExpiry: `30 September 2026`,
        scanData: Ha(),
      };
      (a((e) => [...e, s]),
        C(``),
        be(`Employee account created successfully.`),
        fe(``),
        e.target.reset(),
        setTimeout(() => {
          t(`employeeLogin`);
        }, 1200));
    },
    je = (e) => {
      (ie(e), oe(``), ce(null), ue(``), C(``), t(`forgotPassword`));
    },
    Me = (e) => {
      if ((e.preventDefault(), re === `admin`)) {
        (ce({ type: `admin` }),
          t(`verifyOtp`),
          be(`OTP sent successfully. Check your registered phone.`));
        return;
      }
      let n = i.find((e) => e.phone === ae);
      if (!n) {
        C(`No employee is registered with this phone number.`);
        return;
      }
      (ce(n), t(`verifyOtp`), be(`OTP sent successfully. Check your registered phone.`));
    },
    Ne = (e) => {
      if ((e.preventDefault(), le !== Ra)) {
        C(`Invalid OTP. Please try again.`);
        return;
      }
      (C(``), t(`newPassword`));
    },
    Pe = (e) => {
      e.preventDefault();
      let n = new FormData(e.target),
        r = n.get(`newPassword`);
      if (r !== n.get(`confirmPassword`)) {
        C(`Passwords do not match.`);
        return;
      }
      if (re === `admin`) {
        (be(
          `Password reset request received. Follow the administrator reset flow.`,
        ),
          setTimeout(() => t(`adminLogin`), 2e3));
        return;
      }
      (a((e) => e.map((e) => (e.id === se.id ? { ...e, password: r } : e))),
        be(`Password reset successfully.`),
        setTimeout(() => {
          t(`employeeLogin`);
        }, 1500));
    },
    Fe = (e) => {
      e.preventDefault();
      let t = new FormData(e.target),
        n = {
          ...o,
          fullName: t.get(`fullName`),
          organisation: t.get(`organisation`),
          branch: t.get(`branch`),
          sector: t.get(`sector`),
          bloodGroup: t.get(`bloodGroup`),
          phone: t.get(`phone`),
          profilePicture: pe,
        };
      (a((e) => e.map((e) => (e.id === o.id ? n : e))),
        s(n),
        be(`Profile updated successfully.`));
    },
    Ie = (e) => {
      if (!o) return;
      let t = Va.find((t) => t.id === e);
      if (!t) return;
      let n = {
        ...o,
        riskStatus: t.riskStatus,
        cumulativeDose: `${(t.ppm * 8).toFixed(1)} ppm·h`,
        scanData: Ha(t),
      };
      (a((e) => e.map((e) => (e.id === n.id ? n : e))),
        s(n),
        x?.id === n.id && ee(n),
        be(`SulfScan updated: ${t.ppm.toFixed(1)} ppm (${t.status}).`));
    },
    Le = () => {
      if (!o) return;
      let e = {
        id: Date.now(),
        employeeId: o.employeeId,
        employeeName: o.fullName,
        time: new Date().toLocaleString(),
        status: `Active`,
      };
      (f((t) => [e, ...t]),
        Ce(
          `Emergency SOS Activated`,
          `Your emergency alert has been recorded and sent to the administrator.`,
        ),
        be(`Emergency SOS alert sent successfully.`));
    },
    Re = (e) => {
      e.preventDefault();
      let t = new FormData(e.target),
        n = {
          id: Date.now(),
          employeeId: o.employeeId,
          employeeName: o.fullName,
          title: t.get(`title`),
          description: t.get(`description`),
          status: `Open`,
          time: new Date().toLocaleString(),
        };
      (u((e) => [n, ...e]),
        Ce(
          `Issue Report Submitted`,
          `Your issue report has been forwarded to the safety administrator.`,
        ),
        be(`Issue report submitted successfully.`),
        e.target.reset());
    },
    ze = (e) => {
      e.preventDefault();
      let t = new FormData(e.target).get(`alertMessage`).trim();
      if (!t) return;
      let n = {
        id: Date.now(),
        message: t,
        time: new Date().toLocaleString(),
        status: `Broadcast`,
      };
      (m((e) => [n, ...e]),
        be(`Safety alert broadcast successfully.`),
        e.target.reset());
    },
    Be = (0, l.useMemo)(
      () => ({
        total: i.length,
        safe: i.filter((e) => e.riskStatus !== `At Risk`).length,
        risk: i.filter((e) => e.riskStatus === `At Risk`).length,
        reports: c.length,
      }),
      [i, c],
    ),
    Ve = i.filter((e) => {
      let t = y.toLowerCase();
      return (
        e.fullName.toLowerCase().includes(t) ||
        e.employeeId.toLowerCase().includes(t)
      );
    }),
    He = i.length
      ? (i.reduce((e, t) => e + (t.scanData?.ppm || 0), 0) / i.length).toFixed(
          1,
        )
      : `0.0`,
    Ue = d.filter((e) => e.status === `Active`),
    We = [
      {
        area: `Main Plant`,
        level: Number(He) >= 10 ? `High` : `Safe`,
        employees: i.length,
        reading: `${He} ppm avg`,
      },
      {
        area: `Processing Unit B`,
        level: Number(He) >= 5 ? `Moderate` : `Safe`,
        employees: Math.max(1, Math.ceil(i.length * 0.35)),
        reading: `${Math.max(2, Number(He) - 1.2).toFixed(1)} ppm`,
      },
      {
        area: `Storage Zone 3`,
        level: Ue.length > 0 ? `High` : `Moderate`,
        employees: Math.max(1, Math.ceil(i.length * 0.2)),
        reading: Ue.length > 0 ? `Critical` : `4.2 ppm`,
      },
    ],
    Ge = [
      ...Ue.map((e) => ({
        icon: `🚨`,
        text: `${e.employeeName} activated Emergency SOS`,
        time: e.time,
        tone: `danger`,
      })),
      ...c
        .slice(0, 2)
        .map((e) => ({
          icon: `⚠️`,
          text: `${e.employeeName} submitted ${e.title}`,
          time: e.time,
          tone: `warning`,
        })),
      ...i
        .slice(0, 3)
        .map((e) => ({
          icon: e.riskStatus === `At Risk` ? `⚠️` : `🟢`,
          text: `${e.fullName} is ${e.riskStatus.toLowerCase()}`,
          time: e.scanData?.scannedAt || `Latest scan`,
          tone: e.riskStatus === `At Risk` ? `warning` : `safe`,
        })),
    ].slice(0, 6),
    A = {
      day: [10, 18, 25, 16, 32, 20, 12, 28],
      week: [22, 35, 18, 42, 28, 50, 31],
      month: [18, 25, 32, 28, 45, 38, 51, 29, 40, 33, 48, 36],
    },
    Ke = {
      day: [
        `08:00`,
        `10:00`,
        `12:00`,
        `14:00`,
        `16:00`,
        `18:00`,
        `20:00`,
        `22:00`,
      ],
      week: [`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`],
      month: [
        `1`,
        `3`,
        `6`,
        `8`,
        `11`,
        `14`,
        `16`,
        `19`,
        `22`,
        `25`,
        `28`,
        `30`,
      ],
    },
    qe = A[de],
    Je = Ke[de],
    Ye = () =>
      (0, z.jsxs)(z.Fragment, {
        children: [
          te &&
            (0, z.jsx)(`div`, {
              className: `global-message success`,
              children: te,
            }),
          ne &&
            (0, z.jsx)(`div`, {
              className: `global-message error`,
              children: ne,
            }),
        ],
      }),
    Xe = () =>
      he
        ? (0, z.jsx)(`div`, {
            className: `camera-modal-overlay`,
            children: (0, z.jsxs)(`div`, {
              className: `camera-modal`,
              children: [
                (0, z.jsxs)(`div`, {
                  className: `camera-modal-header`,
                  children: [
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`span`, {
                          className: `camera-modal-icon`,
                          children: `📷`,
                        }),
                        (0, z.jsx)(`h2`, { children: `Take Profile Photo` }),
                      ],
                    }),
                    (0, z.jsx)(`button`, {
                      className: `camera-close-button`,
                      onClick: we,
                      type: `button`,
                      children: `✕`,
                    }),
                  ],
                }),
                (0, z.jsx)(`div`, {
                  className: `camera-preview`,
                  children: (0, z.jsx)(`video`, {
                    ref: _e,
                    autoPlay: !0,
                    playsInline: !0,
                    muted: !0,
                  }),
                }),
                (0, z.jsx)(`canvas`, { ref: ve, className: `hidden-canvas` }),
                (0, z.jsxs)(`div`, {
                  className: `camera-modal-actions`,
                  children: [
                    (0, z.jsx)(`button`, {
                      type: `button`,
                      className: `secondary-button`,
                      onClick: we,
                      children: `Cancel`,
                    }),
                    (0, z.jsx)(`button`, {
                      type: `button`,
                      className: `capture-button`,
                      onClick: Ee,
                      children: `📸 Capture Photo`,
                    }),
                  ],
                }),
              ],
            }),
          })
        : null;
  if (e === `language`)
    return (0, z.jsx)(`div`, {
      className: `app language-${n}`,
      children: (0, z.jsx)(`section`, {
        className: `language-page`,
        children: (0, z.jsxs)(`div`, {
          className: `language-card page-animate`,
          children: [
            (0, z.jsx)(`div`, {
              className: `hero-logo animated-logo`,
              children: (0, z.jsx)(`img`, {
                src: `/sulfscan-logo.png`,
                alt: `SulfiSafe logo`,
              }),
            }),
            (0, z.jsx)(`h1`, { children: O.chooseLanguage }),
            (0, z.jsx)(`p`, { children: O.languageDescription }),
            (0, z.jsx)(`div`, {
              className: `language-grid`,
              children: Ba.map((e) =>
                (0, z.jsxs)(
                  `button`,
                  {
                    className: `language-option ${n === e.code ? `active` : ``}`,
                    onClick: () => r(e.code),
                    children: [
                      (0, z.jsx)(`strong`, { children: e.native }),
                      (0, z.jsx)(`span`, { children: e.name }),
                    ],
                  },
                  e.code,
                ),
              ),
            }),
            (0, z.jsxs)(`button`, {
              className: `primary-button large-button`,
              onClick: () => t(`loginChoice`),
              children: [O.continue, ` →`],
            }),
          ],
        }),
      }),
    });
  if (e === `loginChoice`)
    return (0, z.jsx)(`div`, {
      className: `app language-${n}`,
      children: (0, z.jsxs)(`section`, {
        className: `auth-page role-page`,
        children: [
          (0, z.jsxs)(`button`, {
            className: `back-floating`,
            onClick: xe,
            children: [`← `, O.back],
          }),
          (0, z.jsxs)(`div`, {
            className: `role-container page-animate`,
            children: [
              (0, z.jsx)(`div`, {
                className: `hero-logo animated-logo`,
                children: (0, z.jsx)(`img`, {
                  src: `/sulfscan-logo.png`,
                  alt: `SulfiSafe logo`,
                }),
              }),
              (0, z.jsx)(`h1`, { children: O.welcome }),
              (0, z.jsx)(`p`, { children: O.welcomeText }),
              (0, z.jsxs)(`div`, {
                className: `role-list`,
                children: [
                  (0, z.jsxs)(`button`, {
                    className: `role-card employee-role`,
                    onClick: () => t(`employeeLogin`),
                    children: [
                      (0, z.jsx)(`div`, {
                        className: `role-icon`,
                        children: `👷`,
                      }),
                      (0, z.jsxs)(`div`, {
                        children: [
                          (0, z.jsx)(`h2`, { children: O.employeePortal }),
                          (0, z.jsx)(`p`, { children: O.employeePortalText }),
                        ],
                      }),
                      (0, z.jsx)(`span`, { children: `→` }),
                    ],
                  }),
                  (0, z.jsxs)(`button`, {
                    className: `role-card admin-role`,
                    onClick: () => t(`adminLogin`),
                    children: [
                      (0, z.jsx)(`div`, {
                        className: `role-icon`,
                        children: `🛡️`,
                      }),
                      (0, z.jsxs)(`div`, {
                        children: [
                          (0, z.jsx)(`h2`, { children: O.adminPortal }),
                          (0, z.jsx)(`p`, { children: O.adminPortalText }),
                        ],
                      }),
                      (0, z.jsx)(`span`, { children: `→` }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    });
  if (e === `employeeLogin`)
    return (0, z.jsx)(`div`, {
      className: `app language-${n}`,
      children: (0, z.jsxs)(`section`, {
        className: `auth-page`,
        children: [
          (0, z.jsxs)(`button`, {
            className: `back-floating`,
            onClick: xe,
            children: [`← `, O.back],
          }),
          (0, z.jsxs)(`div`, {
            className: `auth-card page-animate`,
            children: [
              (0, z.jsx)(`div`, { className: `auth-icon`, children: `👷` }),
              (0, z.jsx)(`h1`, { children: O.employeeLogin }),
              (0, z.jsx)(`p`, {
                children: `Securely access your SulfiSafe safety account.`,
              }),
              Ye(),
              (0, z.jsxs)(`form`, {
                onSubmit: Oe,
                children: [
                  (0, z.jsx)(`label`, { children: O.employeeId }),
                  (0, z.jsx)(`input`, { name: `employeeId`, required: !0 }),
                  (0, z.jsx)(`label`, { children: O.password }),
                  (0, z.jsx)(`input`, {
                    name: `password`,
                    type: `password`,
                    required: !0,
                  }),
                  (0, z.jsx)(`button`, {
                    type: `button`,
                    className: `text-button`,
                    onClick: () => je(`employee`),
                    children: O.forgotPassword,
                  }),
                  (0, z.jsx)(`button`, {
                    className: `primary-button`,
                    type: `submit`,
                    children: O.login,
                  }),
                ],
              }),
              (0, z.jsxs)(`div`, {
                className: `auth-footer`,
                children: [
                  (0, z.jsx)(`span`, { children: O.noAccount }),
                  (0, z.jsx)(`button`, {
                    className: `text-button`,
                    onClick: () => {
                      (C(``), t(`signup`));
                    },
                    children: O.signUp,
                  }),
                ],
              }),
              // SECURITY: demo credentials hidden. Set VITE_SHOW_DEMO_HINT=true for local dev only.
              import.meta.env.VITE_SHOW_DEMO_HINT === `true`
                ? (0, z.jsxs)(`div`, {
                    className: `demo-box`,
                    children: [
                      (0, z.jsx)(`strong`, { children: `Demo Employee` }),
                      (0, z.jsx)(`span`, { children: `Use your registered Employee ID` }),
                    ],
                  })
                : null,
            ],
          }),
        ],
      }),
    });
  if (e === `adminLogin`)
    return (0, z.jsx)(`div`, {
      className: `app language-${n}`,
      children: (0, z.jsxs)(`section`, {
        className: `auth-page`,
        children: [
          (0, z.jsxs)(`button`, {
            className: `back-floating`,
            onClick: xe,
            children: [`← `, O.back],
          }),
          (0, z.jsxs)(`div`, {
            className: `auth-card page-animate`,
            children: [
              (0, z.jsx)(`div`, {
                className: `auth-icon admin-icon`,
                children: `🛡️`,
              }),
              (0, z.jsx)(`h1`, { children: O.adminLogin }),
              Ye(),
              (0, z.jsxs)(`form`, {
                onSubmit: ke,
                children: [
                  (0, z.jsx)(`label`, { children: O.adminId }),
                  (0, z.jsx)(`input`, { name: `adminId`, required: !0 }),
                  (0, z.jsx)(`label`, { children: O.password }),
                  (0, z.jsx)(`input`, {
                    name: `password`,
                    type: `password`,
                    required: !0,
                  }),
                  (0, z.jsx)(`button`, {
                    type: `button`,
                    className: `text-button`,
                    onClick: () => je(`admin`),
                    children: O.forgotPassword,
                  }),
                  (0, z.jsx)(`button`, {
                    className: `primary-button admin-button`,
                    children: O.login,
                  }),
                ],
              }),
              // SECURITY: demo credentials hidden. Set VITE_SHOW_DEMO_HINT=true for local dev only.
              import.meta.env.VITE_SHOW_DEMO_HINT === `true`
                ? (0, z.jsxs)(`div`, {
                    className: `demo-box`,
                    children: [
                      (0, z.jsx)(`strong`, { children: `Demo Administrator` }),
                      (0, z.jsx)(`span`, { children: `Use your administrator credentials` }),
                    ],
                  })
                : null,
            ],
          }),
        ],
      }),
    });
  if (e === `signup`)
    return (0, z.jsxs)(`div`, {
      className: `app language-${n}`,
      children: [
        (0, z.jsxs)(`section`, {
          className: `auth-page`,
          children: [
            (0, z.jsxs)(`button`, {
              className: `back-floating`,
              onClick: xe,
              children: [`← `, O.back],
            }),
            (0, z.jsxs)(`div`, {
              className: `auth-card wide-card page-animate`,
              children: [
                (0, z.jsx)(`div`, { className: `auth-icon`, children: `👷` }),
                (0, z.jsx)(`h1`, { children: O.createAccount }),
                Ye(),
                (0, z.jsxs)(`form`, {
                  className: `form-grid`,
                  onSubmit: Ae,
                  children: [
                    (0, z.jsxs)(`div`, {
                      className: `profile-photo-field full-width`,
                      children: [
                        (0, z.jsx)(`label`, { children: O.profilePicture }),
                        (0, z.jsx)(Xa, {
                          image: T,
                          onCamera: () => Te(`signup`),
                          onGallery: (e) => k(e, `signup`),
                          onDelete: () => De(`signup`),
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`label`, { children: O.fullName }),
                        (0, z.jsx)(`input`, { name: `fullName`, required: !0 }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`label`, { children: O.employeeId }),
                        (0, z.jsx)(`input`, {
                          name: `employeeId`,
                          required: !0,
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`label`, { children: O.organisation }),
                        (0, z.jsx)(`input`, {
                          name: `organisation`,
                          required: !0,
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`label`, { children: O.branch }),
                        (0, z.jsx)(`input`, { name: `branch`, required: !0 }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`label`, { children: O.sector }),
                        (0, z.jsx)(`input`, { name: `sector`, required: !0 }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`label`, { children: O.bloodGroup }),
                        (0, z.jsxs)(`select`, {
                          name: `bloodGroup`,
                          required: !0,
                          children: [
                            (0, z.jsx)(`option`, {
                              value: ``,
                              children: `Select`,
                            }),
                            (0, z.jsx)(`option`, { children: `A+` }),
                            (0, z.jsx)(`option`, { children: `A-` }),
                            (0, z.jsx)(`option`, { children: `B+` }),
                            (0, z.jsx)(`option`, { children: `B-` }),
                            (0, z.jsx)(`option`, { children: `AB+` }),
                            (0, z.jsx)(`option`, { children: `AB-` }),
                            (0, z.jsx)(`option`, { children: `O+` }),
                            (0, z.jsx)(`option`, { children: `O-` }),
                          ],
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`label`, { children: O.phone }),
                        (0, z.jsx)(`input`, {
                          name: `phone`,
                          type: `tel`,
                          required: !0,
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`label`, { children: O.setPassword }),
                        (0, z.jsx)(`input`, {
                          name: `password`,
                          type: `password`,
                          required: !0,
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`label`, { children: O.confirmPassword }),
                        (0, z.jsx)(`input`, {
                          name: `confirmPassword`,
                          type: `password`,
                          required: !0,
                        }),
                      ],
                    }),
                    (0, z.jsx)(`button`, {
                      className: `primary-button full-width`,
                      children: O.createAccount,
                    }),
                  ],
                }),
                (0, z.jsxs)(`div`, {
                  className: `auth-footer`,
                  children: [
                    (0, z.jsx)(`span`, { children: O.alreadyAccount }),
                    (0, z.jsx)(`button`, {
                      className: `text-button`,
                      type: `button`,
                      onClick: () => t(`employeeLogin`),
                      children: O.login,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        Xe(),
      ],
    });
  if (e === `forgotPassword`)
    return (0, z.jsx)(`div`, {
      className: `app language-${n}`,
      children: (0, z.jsxs)(`section`, {
        className: `auth-page`,
        children: [
          (0, z.jsxs)(`button`, {
            className: `back-floating`,
            onClick: xe,
            children: [`← `, O.back],
          }),
          (0, z.jsxs)(`div`, {
            className: `auth-card page-animate`,
            children: [
              (0, z.jsx)(`div`, { className: `auth-icon`, children: `📱` }),
              (0, z.jsx)(`h1`, {
                children: re === `admin` ? O.adminReset : O.employeeReset,
              }),
              (0, z.jsx)(`p`, { children: O.enterPhone }),
              Ye(),
              (0, z.jsxs)(`form`, {
                onSubmit: Me,
                children: [
                  (0, z.jsx)(`label`, { children: O.phone }),
                  (0, z.jsx)(`input`, {
                    value: ae,
                    onChange: (e) => oe(e.target.value),
                    type: `tel`,
                    required: re !== `admin`,
                  }),
                  (0, z.jsx)(`button`, {
                    className: `primary-button`,
                    children: O.continue,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    });
  if (e === `verifyOtp`)
    return (0, z.jsx)(`div`, {
      className: `app language-${n}`,
      children: (0, z.jsxs)(`section`, {
        className: `auth-page`,
        children: [
          (0, z.jsxs)(`button`, {
            className: `back-floating`,
            onClick: xe,
            children: [`← `, O.back],
          }),
          (0, z.jsxs)(`div`, {
            className: `auth-card page-animate`,
            children: [
              (0, z.jsx)(`div`, { className: `auth-icon`, children: `🔐` }),
              (0, z.jsx)(`h1`, { children: O.verifyOtp }),
              (0, z.jsx)(`p`, { children: O.enterOtp }),
              // SECURITY: generic OTP hint only; never display real OTP. Env-gated dev hint only.
              (0, z.jsx)(`div`, { className: `demo-box`, children: O.otpHint }),
              Ye(),
              (0, z.jsxs)(`form`, {
                onSubmit: Ne,
                children: [
                  (0, z.jsx)(`input`, {
                    value: le,
                    onChange: (e) =>
                      ue(e.target.value.replace(/\D/g, ``).slice(0, 6)),
                    className: `otp-field`,
                    placeholder: `••••••`,
                    maxLength: `6`,
                    required: !0,
                  }),
                  (0, z.jsx)(`button`, {
                    className: `primary-button`,
                    children: O.verifyOtp,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    });
  if (e === `newPassword`)
    return (0, z.jsx)(`div`, {
      className: `app language-${n}`,
      children: (0, z.jsxs)(`section`, {
        className: `auth-page`,
        children: [
          (0, z.jsxs)(`button`, {
            className: `back-floating`,
            onClick: xe,
            children: [`← `, O.back],
          }),
          (0, z.jsxs)(`div`, {
            className: `auth-card page-animate`,
            children: [
              (0, z.jsx)(`div`, { className: `auth-icon`, children: `🔑` }),
              (0, z.jsx)(`h1`, { children: O.resetPassword }),
              Ye(),
              (0, z.jsxs)(`form`, {
                onSubmit: Pe,
                children: [
                  (0, z.jsx)(`label`, { children: O.newPassword }),
                  (0, z.jsx)(`input`, {
                    name: `newPassword`,
                    type: `password`,
                    required: !0,
                  }),
                  (0, z.jsx)(`label`, { children: O.confirmNewPassword }),
                  (0, z.jsx)(`input`, {
                    name: `confirmPassword`,
                    type: `password`,
                    required: !0,
                  }),
                  (0, z.jsx)(`button`, {
                    className: `primary-button`,
                    children: O.updatePassword,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    });
  if (e === `employeeDashboard` && o) {
    let e = o.riskStatus === `At Risk`;
    return (0, z.jsxs)(`div`, {
      className: `app dashboard-page language-${n}`,
      children: [
        (0, z.jsx)(Ka, {
          title: `SulfiSafe`,
          subtitle: O.employeeDashboard,
          onLogout: Se,
          notifications: h,
          showNotifications: _,
          setShowNotifications: v,
          t: O,
        }),
        (0, z.jsxs)(`main`, {
          className: `dashboard-main page-animate`,
          children: [
            (0, z.jsxs)(`section`, {
              className: `welcome-banner`,
              children: [
                (0, z.jsxs)(`div`, {
                  children: [
                    (0, z.jsx)(`p`, { children: `Welcome back` }),
                    (0, z.jsx)(`h1`, { children: o.fullName }),
                    (0, z.jsxs)(`span`, {
                      children: [O.employeeId, `:`, ` `, o.employeeId],
                    }),
                  ],
                }),
                (0, z.jsxs)(`div`, {
                  className: `band-status ${e ? `expired` : ``}`,
                  children: [
                    (0, z.jsx)(`span`, { children: O.wristband }),
                    (0, z.jsxs)(`strong`, {
                      children: [e ? `🔴 ` : `🟢 `, e ? O.expired : O.valid],
                    }),
                    (0, z.jsxs)(`small`, {
                      children: [`Expires:`, ` `, o.bandExpiry],
                    }),
                  ],
                }),
              ],
            }),
            (0, z.jsxs)(`section`, {
              className: `metrics-grid`,
              children: [
                (0, z.jsx)(Ya, {
                  icon: `☣️`,
                  title: O.cumulativeDose,
                  value: o.cumulativeDose,
                  text: `Estimated exposure index`,
                }),
                (0, z.jsx)(Ya, {
                  icon: `🌡️`,
                  title: O.temperature,
                  value: `${o.temperature}°C`,
                  text: `Current environment`,
                }),
                (0, z.jsx)(Ya, {
                  icon: `💧`,
                  title: O.humidity,
                  value: `${o.humidity}%`,
                  text: `Environmental condition`,
                }),
                (0, z.jsx)(Ya, {
                  icon: `🛡️`,
                  title: O.currentStatus,
                  value: o.riskStatus === `At Risk` ? O.risk : O.safe,
                  text: `Based on latest monitoring`,
                  danger: o.riskStatus === `At Risk`,
                }),
              ],
            }),
            (0, z.jsx)(Ja, { employee: o, editable: !0, onColorChange: Ie }),
            (0, z.jsxs)(`section`, {
              className: `dashboard-grid-two`,
              children: [
                (0, z.jsxs)(`div`, {
                  className: `digital-id-card`,
                  children: [
                    (0, z.jsxs)(`div`, {
                      className: `id-card-top`,
                      children: [
                        (0, z.jsx)(`span`, { children: `🛡️ SULFISAFE` }),
                        (0, z.jsx)(`span`, { children: `SAFETY ID` }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      className: `id-card-body`,
                      children: [
                        (0, z.jsx)(`div`, {
                          className: `profile-avatar large-avatar`,
                          children: o.profilePicture
                            ? (0, z.jsx)(`img`, {
                                src: o.profilePicture,
                                alt: `Employee`,
                              })
                            : `👷`,
                        }),
                        (0, z.jsxs)(`div`, {
                          children: [
                            (0, z.jsx)(`h2`, { children: o.fullName }),
                            (0, z.jsx)(`p`, { children: o.employeeId }),
                            (0, z.jsx)(`span`, { children: o.organisation }),
                          ],
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      className: `id-details`,
                      children: [
                        (0, z.jsxs)(`span`, {
                          children: [
                            (0, z.jsxs)(`strong`, {
                              children: [O.branch, `:`],
                            }),
                            ` `,
                            o.branch,
                          ],
                        }),
                        (0, z.jsxs)(`span`, {
                          children: [
                            (0, z.jsxs)(`strong`, {
                              children: [O.sector, `:`],
                            }),
                            ` `,
                            o.sector,
                          ],
                        }),
                        (0, z.jsxs)(`span`, {
                          children: [
                            (0, z.jsxs)(`strong`, {
                              children: [O.bloodGroup, `:`],
                            }),
                            ` `,
                            o.bloodGroup,
                          ],
                        }),
                        (0, z.jsxs)(`span`, {
                          children: [
                            (0, z.jsxs)(`strong`, { children: [O.phone, `:`] }),
                            ` `,
                            o.phone,
                          ],
                        }),
                      ],
                    }),
                    (0, z.jsx)(`button`, {
                      className: `secondary-button`,
                      onClick: () => {
                        (me(o.profilePicture || ``), t(`employeeProfile`));
                      },
                      children: O.profile,
                    }),
                  ],
                }),
                (0, z.jsxs)(`div`, {
                  className: `quick-actions`,
                  children: [
                    (0, z.jsx)(`h2`, { children: `Safety Actions` }),
                    (0, z.jsxs)(`button`, {
                      className: `action-card`,
                      onClick: () => t(`history`),
                      children: [
                        (0, z.jsx)(`span`, { children: `📋` }),
                        (0, z.jsxs)(`div`, {
                          children: [
                            (0, z.jsx)(`h3`, { children: O.historyLogs }),
                            (0, z.jsx)(`p`, {
                              children: `View entry, exit and wristband history.`,
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`button`, {
                      className: `action-card`,
                      onClick: () => t(`exposure`),
                      children: [
                        (0, z.jsx)(`span`, { children: `📊` }),
                        (0, z.jsxs)(`div`, {
                          children: [
                            (0, z.jsx)(`h3`, { children: O.h2sMonitoring }),
                            (0, z.jsx)(`p`, {
                              children: `Track ppm readings and cumulative H₂S dose.`,
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`button`, {
                      className: `action-card`,
                      onClick: () => t(`reportIssue`),
                      children: [
                        (0, z.jsx)(`span`, { children: `📝` }),
                        (0, z.jsxs)(`div`, {
                          children: [
                            (0, z.jsx)(`h3`, { children: O.reportIssue }),
                            (0, z.jsx)(`p`, {
                              children: `Submit a workplace safety issue.`,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, z.jsxs)(`section`, {
              className: `exposure-preview`,
              children: [
                (0, z.jsx)(`div`, {
                  className: `section-heading`,
                  children: (0, z.jsxs)(`div`, {
                    children: [
                      (0, z.jsx)(`h2`, { children: O.h2sMonitoring }),
                      (0, z.jsx)(`p`, {
                        children: `Track your latest H₂S readings and shift exposure.`,
                      }),
                    ],
                  }),
                }),
                (0, z.jsxs)(`div`, {
                  className: `period-buttons`,
                  children: [
                    (0, z.jsx)(`button`, {
                      className: de === `day` ? `active-period` : ``,
                      onClick: () => w(`day`),
                      children: O.exposureDay,
                    }),
                    (0, z.jsx)(`button`, {
                      className: de === `week` ? `active-period` : ``,
                      onClick: () => w(`week`),
                      children: O.exposureWeek,
                    }),
                    (0, z.jsx)(`button`, {
                      className: de === `month` ? `active-period` : ``,
                      onClick: () => w(`month`),
                      children: O.exposureMonth,
                    }),
                  ],
                }),
                (0, z.jsx)(Za, { data: qe, labels: Je, period: de }),
              ],
            }),
            (0, z.jsxs)(`section`, {
              className: `emergency-section`,
              children: [
                (0, z.jsxs)(`div`, {
                  children: [
                    (0, z.jsx)(`span`, {
                      className: `emergency-icon`,
                      children: `🚨`,
                    }),
                    (0, z.jsx)(`h2`, { children: O.emergency }),
                    (0, z.jsx)(`p`, {
                      children: `Use this button only when immediate workplace assistance is required.`,
                    }),
                    (0, z.jsxs)(`strong`, {
                      children: [O.emergencyNumber, `: 112`],
                    }),
                  ],
                }),
                (0, z.jsx)(`button`, {
                  className: `emergency-button`,
                  onClick: Le,
                  children: `🚨 SOS`,
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }
  if (e === `history` && o) {
    let e = [
      { date: `Today`, type: O.entry, time: `08:42 AM`, band: O.valid },
      { date: `Yesterday`, type: O.exit, time: `06:12 PM`, band: O.valid },
      { date: `Yesterday`, type: O.entry, time: `08:35 AM`, band: O.valid },
    ];
    return (0, z.jsxs)(`div`, {
      className: `app dashboard-page language-${n}`,
      children: [
        (0, z.jsx)(qa, { title: O.historyLogs, onBack: xe }),
        (0, z.jsx)(`main`, {
          className: `dashboard-main page-animate`,
          children: (0, z.jsxs)(`div`, {
            className: `content-card`,
            children: [
              (0, z.jsx)(`h1`, { children: O.historyLogs }),
              (0, z.jsx)(`div`, {
                className: `log-list`,
                children: e.map((e, t) =>
                  (0, z.jsxs)(
                    `div`,
                    {
                      className: `log-item`,
                      children: [
                        (0, z.jsx)(`div`, {
                          className: `log-icon`,
                          children: e.type === O.entry ? `🟢` : `🔵`,
                        }),
                        (0, z.jsxs)(`div`, {
                          children: [
                            (0, z.jsx)(`h3`, { children: e.type }),
                            (0, z.jsxs)(`p`, {
                              children: [e.date, ` •`, ` `, e.time],
                            }),
                          ],
                        }),
                        (0, z.jsxs)(`span`, {
                          className: `status-pill safe-pill`,
                          children: [O.wristband, `:`, ` `, e.band],
                        }),
                      ],
                    },
                    t,
                  ),
                ),
              }),
            ],
          }),
        }),
      ],
    });
  }
  return e === `exposure`
    ? (0, z.jsxs)(`div`, {
        className: `app dashboard-page language-${n}`,
        children: [
          (0, z.jsx)(qa, { title: O.h2sMonitoring, onBack: xe }),
          (0, z.jsx)(`main`, {
            className: `dashboard-main page-animate`,
            children: (0, z.jsxs)(`div`, {
              className: `content-card`,
              children: [
                (0, z.jsx)(`h1`, { children: O.h2sMonitoring }),
                (0, z.jsx)(`p`, {
                  className: `information-note`,
                  children: `Monitor your H₂S exposure readings across each work period.`,
                }),
                (0, z.jsxs)(`div`, {
                  className: `exposure-live-strip`,
                  children: [
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`span`, { children: `Latest H₂S reading` }),
                        (0, z.jsxs)(`strong`, {
                          children: [o?.scanData?.ppm || 0, ` ppm`],
                        }),
                        (0, z.jsx)(`small`, {
                          children: o?.scanData?.scannedAt || `No scan yet`,
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`span`, { children: `Current shift dose` }),
                        (0, z.jsx)(`strong`, {
                          children: o?.cumulativeDose || `0 ppm·h`,
                        }),
                        (0, z.jsx)(`small`, {
                          children: `Estimated cumulative exposure`,
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`span`, { children: `Safety status` }),
                        (0, z.jsx)(`strong`, {
                          className:
                            o?.riskStatus === `At Risk`
                              ? `risk-text`
                              : `safe-text`,
                          children: o?.riskStatus || `Safe`,
                        }),
                        (0, z.jsx)(`small`, {
                          children: `Based on latest monitoring`,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, z.jsxs)(`div`, {
                  className: `period-buttons`,
                  children: [
                    (0, z.jsx)(`button`, {
                      className: de === `day` ? `active-period` : ``,
                      onClick: () => w(`day`),
                      children: O.exposureDay,
                    }),
                    (0, z.jsx)(`button`, {
                      className: de === `week` ? `active-period` : ``,
                      onClick: () => w(`week`),
                      children: O.exposureWeek,
                    }),
                    (0, z.jsx)(`button`, {
                      className: de === `month` ? `active-period` : ``,
                      onClick: () => w(`month`),
                      children: O.exposureMonth,
                    }),
                  ],
                }),
                (0, z.jsx)(Za, { data: qe, labels: Je, period: de }),
                (0, z.jsxs)(`div`, {
                  className: `exposure-summary`,
                  children: [
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`span`, { children: `Highest Reading` }),
                        (0, z.jsxs)(`strong`, {
                          children: [Math.max(...qe), ` `, `ppm`],
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`span`, { children: `Average Reading` }),
                        (0, z.jsxs)(`strong`, {
                          children: [
                            (qe.reduce((e, t) => e + t, 0) / qe.length).toFixed(
                              1,
                            ),
                            ` `,
                            `ppm`,
                          ],
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`div`, {
                      children: [
                        (0, z.jsx)(`span`, { children: `Safety Assessment` }),
                        (0, z.jsx)(`strong`, {
                          className: `safe-text`,
                          children: `Normal`,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      })
    : e === `employeeProfile` && o
      ? (0, z.jsxs)(`div`, {
          className: `app dashboard-page language-${n}`,
          children: [
            (0, z.jsx)(qa, { title: O.profile, onBack: xe }),
            (0, z.jsx)(`main`, {
              className: `dashboard-main page-animate`,
              children: (0, z.jsxs)(`div`, {
                className: `content-card profile-update-card`,
                children: [
                  (0, z.jsx)(`h1`, { children: O.profile }),
                  Ye(),
                  (0, z.jsxs)(`form`, {
                    className: `form-grid`,
                    onSubmit: Fe,
                    children: [
                      (0, z.jsxs)(`div`, {
                        children: [
                          (0, z.jsx)(`label`, { children: O.fullName }),
                          (0, z.jsx)(`input`, {
                            name: `fullName`,
                            defaultValue: o.fullName,
                            required: !0,
                          }),
                        ],
                      }),
                      (0, z.jsxs)(`div`, {
                        children: [
                          (0, z.jsx)(`label`, { children: O.organisation }),
                          (0, z.jsx)(`input`, {
                            name: `organisation`,
                            defaultValue: o.organisation,
                            required: !0,
                          }),
                        ],
                      }),
                      (0, z.jsxs)(`div`, {
                        children: [
                          (0, z.jsx)(`label`, { children: O.branch }),
                          (0, z.jsx)(`input`, {
                            name: `branch`,
                            defaultValue: o.branch,
                            required: !0,
                          }),
                        ],
                      }),
                      (0, z.jsxs)(`div`, {
                        children: [
                          (0, z.jsx)(`label`, { children: O.sector }),
                          (0, z.jsx)(`input`, {
                            name: `sector`,
                            defaultValue: o.sector,
                            required: !0,
                          }),
                        ],
                      }),
                      (0, z.jsxs)(`div`, {
                        children: [
                          (0, z.jsx)(`label`, { children: O.bloodGroup }),
                          (0, z.jsx)(`input`, {
                            name: `bloodGroup`,
                            defaultValue: o.bloodGroup,
                            required: !0,
                          }),
                        ],
                      }),
                      (0, z.jsxs)(`div`, {
                        children: [
                          (0, z.jsx)(`label`, { children: O.phone }),
                          (0, z.jsx)(`input`, {
                            name: `phone`,
                            defaultValue: o.phone,
                            required: !0,
                          }),
                        ],
                      }),
                      (0, z.jsxs)(`div`, {
                        className: `full-width profile-photo-field`,
                        children: [
                          (0, z.jsx)(`label`, { children: O.profilePicture }),
                          (0, z.jsx)(Xa, {
                            image: pe,
                            onCamera: () => Te(`profile`),
                            onGallery: (e) => k(e, `profile`),
                            onDelete: () => De(`profile`),
                          }),
                        ],
                      }),
                      (0, z.jsx)(`button`, {
                        className: `primary-button full-width`,
                        children: O.save,
                      }),
                    ],
                  }),
                ],
              }),
            }),
            Xe(),
          ],
        })
      : e === `reportIssue`
        ? (0, z.jsxs)(`div`, {
            className: `app dashboard-page language-${n}`,
            children: [
              (0, z.jsx)(qa, { title: O.reportIssue, onBack: xe }),
              (0, z.jsx)(`main`, {
                className: `dashboard-main page-animate`,
                children: (0, z.jsxs)(`div`, {
                  className: `content-card issue-card`,
                  children: [
                    (0, z.jsxs)(`div`, {
                      className: `issue-header`,
                      children: [
                        (0, z.jsx)(`span`, { children: `📝` }),
                        (0, z.jsxs)(`div`, {
                          children: [
                            (0, z.jsx)(`h1`, { children: O.reportIssue }),
                            (0, z.jsx)(`p`, {
                              children: `Report workplace safety concerns for administrator review.`,
                            }),
                          ],
                        }),
                      ],
                    }),
                    Ye(),
                    (0, z.jsxs)(`form`, {
                      onSubmit: Re,
                      children: [
                        (0, z.jsx)(`label`, { children: O.employeeId }),
                        (0, z.jsx)(`input`, {
                          value: o?.employeeId || ``,
                          disabled: !0,
                        }),
                        (0, z.jsx)(`label`, { children: O.issueTitle }),
                        (0, z.jsx)(`input`, { name: `title`, required: !0 }),
                        (0, z.jsx)(`label`, { children: O.issueDescription }),
                        (0, z.jsx)(`textarea`, {
                          name: `description`,
                          rows: `7`,
                          required: !0,
                        }),
                        (0, z.jsx)(`button`, {
                          className: `primary-button`,
                          children: O.submitReport,
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            ],
          })
        : e === `adminDashboard`
          ? (0, z.jsxs)(`div`, {
              className: `app dashboard-page language-${n}`,
              children: [
                (0, z.jsx)(Ka, {
                  title: `SulfiSafe`,
                  subtitle: O.adminDashboard,
                  adminName: `Safety Administrator`,
                  onLogout: Se,
                  notifications: [
                    ...c.map((e) => ({
                      id: `issue-${e.id}`,
                      title: `New Employee Report`,
                      body: `${e.employeeName}: ${e.title}`,
                      time: e.time,
                    })),
                    ...d.map((e) => ({
                      id: `emergency-${e.id}`,
                      title: `🚨 Emergency SOS`,
                      body: `${e.employeeName} has triggered an emergency alert.`,
                      time: e.time,
                    })),
                  ],
                  showNotifications: _,
                  setShowNotifications: v,
                  t: O,
                }),
                (0, z.jsxs)(`main`, {
                  className: `dashboard-main page-animate`,
                  children: [
                    (0, z.jsxs)(`section`, {
                      className: `admin-welcome`,
                      children: [
                        (0, z.jsxs)(`div`, {
                          children: [
                            (0, z.jsx)(`p`, {
                              children: `Welcome, Safety Administrator 👋`,
                            }),
                            (0, z.jsx)(`h1`, { children: O.adminDashboard }),
                            (0, z.jsx)(`span`, {
                              children: `Monitor workplace safety and respond to potential hazards in real time.`,
                            }),
                          ],
                        }),
                        (0, z.jsxs)(`div`, {
                          className: `admin-live`,
                          children: [
                            (0, z.jsx)(`span`, { className: `live-dot` }),
                            `System Monitoring Active`,
                          ],
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`section`, {
                      className: `admin-stat-grid`,
                      children: [
                        (0, z.jsx)(Qa, {
                          icon: `👷`,
                          value: Be.total,
                          label: O.totalEmployees,
                        }),
                        (0, z.jsx)(Qa, {
                          icon: `🟢`,
                          value: Be.safe,
                          label: O.safeEmployees,
                        }),
                        (0, z.jsx)(Qa, {
                          icon: `⚠️`,
                          value: Be.risk,
                          label: O.riskEmployees,
                          danger: !0,
                        }),
                        (0, z.jsx)(Qa, {
                          icon: `🚨`,
                          value: Ue.length,
                          label: `Emergency Alerts`,
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`section`, {
                      className: `admin-grid admin-command-grid`,
                      children: [
                        (0, z.jsxs)(`div`, {
                          className: `content-card live-alerts-card`,
                          children: [
                            (0, z.jsxs)(`div`, {
                              className: `section-heading`,
                              children: [
                                (0, z.jsxs)(`div`, {
                                  children: [
                                    (0, z.jsx)(`span`, {
                                      className: `eyebrow light-eyebrow`,
                                      children: `LIVE RESPONSE`,
                                    }),
                                    (0, z.jsx)(`h2`, {
                                      children: `🚨 Live Emergency Alerts`,
                                    }),
                                    (0, z.jsx)(`p`, {
                                      children: `Active SOS events requiring administrator attention.`,
                                    }),
                                  ],
                                }),
                                (0, z.jsxs)(`span`, {
                                  className: `live-count`,
                                  children: [Ue.length, ` active`],
                                }),
                              ],
                            }),
                            (0, z.jsx)(`div`, {
                              className: `live-alert-list`,
                              children:
                                Ue.length === 0
                                  ? (0, z.jsx)(`p`, {
                                      className: `empty-state`,
                                      children: `No active emergency alerts.`,
                                    })
                                  : Ue.map((e) =>
                                      (0, z.jsxs)(
                                        `div`,
                                        {
                                          className: `live-alert-item`,
                                          children: [
                                            (0, z.jsx)(`span`, {
                                              className: `alert-symbol`,
                                              children: `🚨`,
                                            }),
                                            (0, z.jsxs)(`div`, {
                                              children: [
                                                (0, z.jsx)(`strong`, {
                                                  children: e.employeeName,
                                                }),
                                                (0, z.jsxs)(`span`, {
                                                  children: [
                                                    e.employeeId,
                                                    ` · Main Plant`,
                                                  ],
                                                }),
                                                (0, z.jsxs)(`small`, {
                                                  children: [
                                                    `H₂S level: Critical · Alert received: `,
                                                    e.time,
                                                  ],
                                                }),
                                              ],
                                            }),
                                            (0, z.jsx)(`span`, {
                                              className: `status-pill danger-pill`,
                                              children: e.status,
                                            }),
                                          ],
                                        },
                                        e.id,
                                      ),
                                    ),
                            }),
                          ],
                        }),
                        (0, z.jsxs)(`div`, {
                          className: `content-card hazard-zones-card`,
                          children: [
                            (0, z.jsx)(`div`, {
                              className: `section-heading`,
                              children: (0, z.jsxs)(`div`, {
                                children: [
                                  (0, z.jsx)(`span`, {
                                    className: `eyebrow`,
                                    children: `FIELD OVERVIEW`,
                                  }),
                                  (0, z.jsx)(`h2`, {
                                    children: `🗺️ Workplace Hazard Zones`,
                                  }),
                                ],
                              }),
                            }),
                            (0, z.jsx)(`div`, {
                              className: `hazard-zone-list`,
                              children: We.map((e) =>
                                (0, z.jsxs)(
                                  `div`,
                                  {
                                    className: `hazard-zone-row`,
                                    children: [
                                      (0, z.jsx)(`span`, {
                                        className: `zone-dot ${e.level.toLowerCase()}`,
                                      }),
                                      (0, z.jsxs)(`div`, {
                                        children: [
                                          (0, z.jsx)(`strong`, {
                                            children: e.area,
                                          }),
                                          (0, z.jsxs)(`small`, {
                                            children: [
                                              e.employees,
                                              ` employees · `,
                                              e.reading,
                                            ],
                                          }),
                                        ],
                                      }),
                                      (0, z.jsx)(`span`, {
                                        className: `zone-level ${e.level.toLowerCase()}`,
                                        children: e.level,
                                      }),
                                    ],
                                  },
                                  e.area,
                                ),
                              ),
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`section`, {
                      className: `admin-grid admin-command-grid`,
                      children: [
                        (0, z.jsxs)(`div`, {
                          className: `content-card exposure-monitor-card`,
                          children: [
                            (0, z.jsxs)(`div`, {
                              className: `section-heading`,
                              children: [
                                (0, z.jsxs)(`div`, {
                                  children: [
                                    (0, z.jsx)(`span`, {
                                      className: `eyebrow`,
                                      children: `SULFSCAN TELEMETRY`,
                                    }),
                                    (0, z.jsx)(`h2`, {
                                      children: `📊 H₂S Exposure Monitoring`,
                                    }),
                                    (0, z.jsx)(`p`, {
                                      children: `Live readings from the latest colourimetric scans.`,
                                    }),
                                  ],
                                }),
                                (0, z.jsxs)(`strong`, {
                                  className: `big-reading`,
                                  children: [
                                    He,
                                    ` `,
                                    (0, z.jsx)(`small`, {
                                      children: `ppm avg`,
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            (0, z.jsx)(Za, {
                              data: [4, 7, 5, 8, 6, Number(He), 3],
                              labels: [
                                `Mon`,
                                `Tue`,
                                `Wed`,
                                `Thu`,
                                `Fri`,
                                `Sat`,
                                `Sun`,
                              ],
                              period: `week`,
                            }),
                            (0, z.jsxs)(`div`, {
                              className: `analytics-strip`,
                              children: [
                                (0, z.jsx)(`span`, {
                                  children: `🟢 Safe < 5 ppm`,
                                }),
                                (0, z.jsx)(`span`, {
                                  children: `🟡 Action 5–10 ppm`,
                                }),
                                (0, z.jsx)(`span`, {
                                  children: `🔴 Critical > 10 ppm`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        (0, z.jsxs)(`div`, {
                          className: `content-card analytics-card`,
                          children: [
                            (0, z.jsx)(`div`, {
                              className: `section-heading`,
                              children: (0, z.jsxs)(`div`, {
                                children: [
                                  (0, z.jsx)(`span`, {
                                    className: `eyebrow`,
                                    children: `SAFETY INTELLIGENCE`,
                                  }),
                                  (0, z.jsx)(`h2`, {
                                    children: `📈 Safety Analytics`,
                                  }),
                                ],
                              }),
                            }),
                            (0, z.jsxs)(`div`, {
                              className: `analytics-grid`,
                              children: [
                                (0, z.jsxs)(`div`, {
                                  children: [
                                    (0, z.jsx)(`strong`, { children: `92%` }),
                                    (0, z.jsx)(`span`, {
                                      children: `Safety Score`,
                                    }),
                                    (0, z.jsx)(`small`, {
                                      children: `🟢 Stable this month`,
                                    }),
                                  ],
                                }),
                                (0, z.jsxs)(`div`, {
                                  children: [
                                    (0, z.jsx)(`strong`, {
                                      children: c.length + d.length,
                                    }),
                                    (0, z.jsx)(`span`, {
                                      children: `Safety Incidents`,
                                    }),
                                    (0, z.jsx)(`small`, {
                                      children: `Latest reported events`,
                                    }),
                                  ],
                                }),
                                (0, z.jsxs)(`div`, {
                                  children: [
                                    (0, z.jsx)(`strong`, {
                                      children: We.filter(
                                        (e) => e.level === `High`,
                                      ).length,
                                    }),
                                    (0, z.jsx)(`span`, {
                                      children: `High-risk zones`,
                                    }),
                                    (0, z.jsx)(`small`, {
                                      children: `Requires attention`,
                                    }),
                                  ],
                                }),
                                (0, z.jsxs)(`div`, {
                                  children: [
                                    (0, z.jsx)(`strong`, {
                                      children: Be.reports,
                                    }),
                                    (0, z.jsx)(`span`, {
                                      children: `Open reports`,
                                    }),
                                    (0, z.jsx)(`small`, {
                                      children: `Employee submissions`,
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, z.jsxs)(`section`, {
                      className: `admin-grid admin-command-grid`,
                      children: [
                        (0, z.jsxs)(`div`, {
                          className: `content-card broadcast-card`,
                          children: [
                            (0, z.jsx)(`div`, {
                              className: `section-heading`,
                              children: (0, z.jsxs)(`div`, {
                                children: [
                                  (0, z.jsx)(`span`, {
                                    className: `eyebrow`,
                                    children: `ALL EMPLOYEES`,
                                  }),
                                  (0, z.jsx)(`h2`, {
                                    children: `📢 Broadcast Safety Alerts`,
                                  }),
                                  (0, z.jsx)(`p`, {
                                    children: `Send a clear safety message to every employee.`,
                                  }),
                                ],
                              }),
                            }),
                            (0, z.jsxs)(`form`, {
                              onSubmit: ze,
                              children: [
                                (0, z.jsx)(`textarea`, {
                                  name: `alertMessage`,
                                  rows: `4`,
                                  placeholder: `Example: Processing Area temporarily restricted until further notice.`,
                                  required: !0,
                                }),
                                (0, z.jsx)(`button`, {
                                  className: `primary-button`,
                                  type: `submit`,
                                  children: `📢 Send Alert`,
                                }),
                              ],
                            }),
                            p.length > 0 &&
                              (0, z.jsx)(`div`, {
                                className: `broadcast-history compact-history`,
                                children: p
                                  .slice(0, 2)
                                  .map((e) =>
                                    (0, z.jsxs)(
                                      `div`,
                                      {
                                        className: `broadcast-item`,
                                        children: [
                                          (0, z.jsx)(`span`, {
                                            children: `📢`,
                                          }),
                                          (0, z.jsxs)(`div`, {
                                            children: [
                                              (0, z.jsx)(`strong`, {
                                                children: e.message,
                                              }),
                                              (0, z.jsx)(`small`, {
                                                children: e.time,
                                              }),
                                            ],
                                          }),
                                        ],
                                      },
                                      e.id,
                                    ),
                                  ),
                              }),
                          ],
                        }),
                        (0, z.jsxs)(`div`, {
                          className: `content-card activity-card`,
                          children: [
                            (0, z.jsx)(`div`, {
                              className: `section-heading`,
                              children: (0, z.jsxs)(`div`, {
                                children: [
                                  (0, z.jsx)(`span`, {
                                    className: `eyebrow`,
                                    children: `SYSTEM FEED`,
                                  }),
                                  (0, z.jsx)(`h2`, {
                                    children: `🔔 Recent Activity`,
                                  }),
                                ],
                              }),
                            }),
                            (0, z.jsx)(`div`, {
                              className: `activity-timeline`,
                              children:
                                Ge.length === 0
                                  ? (0, z.jsx)(`p`, {
                                      className: `empty-state`,
                                      children: `Activity will appear after the first scan or report.`,
                                    })
                                  : Ge.map((e, t) =>
                                      (0, z.jsxs)(
                                        `div`,
                                        {
                                          className: `activity-item ${e.tone}`,
                                          children: [
                                            (0, z.jsx)(`span`, {
                                              children: e.icon,
                                            }),
                                            (0, z.jsxs)(`div`, {
                                              children: [
                                                (0, z.jsx)(`strong`, {
                                                  children: e.text,
                                                }),
                                                (0, z.jsx)(`small`, {
                                                  children: e.time,
                                                }),
                                              ],
                                            }),
                                          ],
                                        },
                                        `${e.text}-${t}`,
                                      ),
                                    ),
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, z.jsx)(`section`, {
                      className: `admin-grid employee-management-grid`,
                      children: (0, z.jsxs)(`div`, {
                        className: `content-card employee-search-card`,
                        children: [
                          (0, z.jsx)(`h2`, { children: `Employee Management` }),
                          (0, z.jsx)(`input`, {
                            className: `search-input`,
                            placeholder: O.searchEmployee,
                            value: y,
                            onChange: (e) => b(e.target.value),
                          }),
                          (0, z.jsx)(`div`, {
                            className: `employee-results`,
                            children: Ve.map((e) =>
                              (0, z.jsxs)(
                                `button`,
                                {
                                  className: `employee-row`,
                                  onClick: () => {
                                    (ee(e), t(`adminEmployee`));
                                  },
                                  children: [
                                    (0, z.jsx)(`div`, {
                                      className: `profile-avatar`,
                                      children: e.profilePicture
                                        ? (0, z.jsx)(`img`, {
                                            src: e.profilePicture,
                                            alt: e.fullName,
                                          })
                                        : `👷`,
                                    }),
                                    (0, z.jsxs)(`div`, {
                                      children: [
                                        (0, z.jsx)(`strong`, {
                                          children: e.fullName,
                                        }),
                                        (0, z.jsx)(`span`, {
                                          children: e.employeeId,
                                        }),
                                      ],
                                    }),
                                    (0, z.jsxs)(`div`, {
                                      className: `employee-scan-summary`,
                                      children: [
                                        (0, z.jsxs)(`strong`, {
                                          children: [
                                            e.scanData?.ppm?.toFixed(1) ||
                                              `0.0`,
                                            ` ppm`,
                                          ],
                                        }),
                                        (0, z.jsx)(`span`, {
                                          children:
                                            e.scanData?.complianceStatus?.replace(
                                              `_`,
                                              ` `,
                                            ) || `NO SCAN`,
                                        }),
                                      ],
                                    }),
                                    (0, z.jsx)(`span`, {
                                      className: `row-arrow`,
                                      children: `→`,
                                    }),
                                  ],
                                },
                                e.id,
                              ),
                            ),
                          }),
                        ],
                      }),
                    }),
                    (0, z.jsxs)(`section`, {
                      className: `admin-grid`,
                      children: [
                        (0, z.jsxs)(`div`, {
                          className: `content-card`,
                          children: [
                            (0, z.jsx)(`h2`, { children: O.employeeReports }),
                            (0, z.jsx)(`div`, {
                              className: `report-list`,
                              children:
                                c.length === 0
                                  ? (0, z.jsx)(`p`, {
                                      className: `empty-state`,
                                      children: `No employee reports yet.`,
                                    })
                                  : c.map((e) =>
                                      (0, z.jsxs)(
                                        `div`,
                                        {
                                          className: `report-item`,
                                          children: [
                                            (0, z.jsxs)(`div`, {
                                              children: [
                                                (0, z.jsx)(`strong`, {
                                                  children: e.title,
                                                }),
                                                (0, z.jsx)(`p`, {
                                                  children: e.description,
                                                }),
                                                (0, z.jsxs)(`small`, {
                                                  children: [
                                                    e.employeeName,
                                                    ` `,
                                                    `•`,
                                                    ` `,
                                                    e.employeeId,
                                                  ],
                                                }),
                                              ],
                                            }),
                                            (0, z.jsx)(`span`, {
                                              className: `status-pill warning-pill`,
                                              children: e.status,
                                            }),
                                          ],
                                        },
                                        e.id,
                                      ),
                                    ),
                            }),
                          ],
                        }),
                        (0, z.jsxs)(`div`, {
                          className: `content-card`,
                          children: [
                            (0, z.jsx)(`h2`, { children: O.emergencyAlerts }),
                            (0, z.jsx)(`div`, {
                              className: `report-list`,
                              children:
                                d.length === 0
                                  ? (0, z.jsx)(`p`, {
                                      className: `empty-state`,
                                      children: `No emergency alerts.`,
                                    })
                                  : d.map((e) =>
                                      (0, z.jsxs)(
                                        `div`,
                                        {
                                          className: `report-item emergency-report`,
                                          children: [
                                            (0, z.jsxs)(`div`, {
                                              children: [
                                                (0, z.jsx)(`strong`, {
                                                  children: `🚨 Emergency SOS`,
                                                }),
                                                (0, z.jsx)(`p`, {
                                                  children: e.employeeName,
                                                }),
                                                (0, z.jsxs)(`small`, {
                                                  children: [
                                                    e.employeeId,
                                                    ` `,
                                                    `•`,
                                                    ` `,
                                                    e.time,
                                                  ],
                                                }),
                                              ],
                                            }),
                                            (0, z.jsx)(`span`, {
                                              className: `status-pill danger-pill`,
                                              children: e.status,
                                            }),
                                          ],
                                        },
                                        e.id,
                                      ),
                                    ),
                            }),
                          ],
                        }),
                      ],
                    }),
                    p.length > 0 &&
                      (0, z.jsxs)(`section`, {
                        className: `content-card broadcast-history`,
                        children: [
                          (0, z.jsx)(`h2`, {
                            children: `Broadcast Safety Alerts`,
                          }),
                          p.map((e) =>
                            (0, z.jsxs)(
                              `div`,
                              {
                                className: `broadcast-item`,
                                children: [
                                  (0, z.jsx)(`span`, { children: `📢` }),
                                  (0, z.jsxs)(`div`, {
                                    children: [
                                      (0, z.jsx)(`strong`, {
                                        children: e.message,
                                      }),
                                      (0, z.jsx)(`small`, { children: e.time }),
                                    ],
                                  }),
                                ],
                              },
                              e.id,
                            ),
                          ),
                        ],
                      }),
                  ],
                }),
              ],
            })
          : e === `adminEmployee` && x
            ? (0, z.jsxs)(`div`, {
                className: `app dashboard-page language-${n}`,
                children: [
                  (0, z.jsx)(qa, {
                    title: `Employee Safety Profile`,
                    onBack: xe,
                  }),
                  (0, z.jsx)(`main`, {
                    className: `dashboard-main page-animate`,
                    children: (0, z.jsxs)(`section`, {
                      className: `employee-detail-page`,
                      children: [
                        (0, z.jsxs)(`div`, {
                          className: `employee-detail-profile`,
                          children: [
                            (0, z.jsx)(`div`, {
                              className: `profile-avatar employee-detail-avatar`,
                              children: x.profilePicture
                                ? (0, z.jsx)(`img`, {
                                    src: x.profilePicture,
                                    alt: x.fullName,
                                  })
                                : `👷`,
                            }),
                            (0, z.jsxs)(`div`, {
                              children: [
                                (0, z.jsx)(`h1`, { children: x.fullName }),
                                (0, z.jsx)(`p`, { children: x.employeeId }),
                                (0, z.jsx)(`span`, {
                                  children: x.organisation,
                                }),
                              ],
                            }),
                          ],
                        }),
                        (0, z.jsxs)(`section`, {
                          className: `metrics-grid`,
                          children: [
                            (0, z.jsx)(Ya, {
                              icon: `☣️`,
                              title: `Estimated H₂S Dose`,
                              value: x.cumulativeDose,
                              text: `Estimated monitoring value`,
                            }),
                            (0, z.jsx)(Ya, {
                              icon: `🌡️`,
                              title: `Temperature`,
                              value: `${x.temperature}°C`,
                              text: `Latest environment`,
                            }),
                            (0, z.jsx)(Ya, {
                              icon: `💧`,
                              title: `Humidity`,
                              value: `${x.humidity}%`,
                              text: `Latest environment`,
                            }),
                            (0, z.jsx)(Ya, {
                              icon: `🛡️`,
                              title: `Risk Status`,
                              value: x.riskStatus,
                              text: `Current assessment`,
                            }),
                          ],
                        }),
                        (0, z.jsx)(Ja, { employee: x }),
                        (0, z.jsxs)(`div`, {
                          className: `content-card`,
                          children: [
                            (0, z.jsx)(`h2`, {
                              children: `Employee Information`,
                            }),
                            (0, z.jsxs)(`div`, {
                              className: `detail-grid`,
                              children: [
                                (0, z.jsx)($a, {
                                  label: `Organisation`,
                                  value: x.organisation,
                                }),
                                (0, z.jsx)($a, {
                                  label: `Branch`,
                                  value: x.branch,
                                }),
                                (0, z.jsx)($a, {
                                  label: `Sector`,
                                  value: x.sector,
                                }),
                                (0, z.jsx)($a, {
                                  label: `Blood Group`,
                                  value: x.bloodGroup,
                                }),
                                (0, z.jsx)($a, {
                                  label: `Phone`,
                                  value: x.phone,
                                }),
                                (0, z.jsx)($a, {
                                  label: `Wristband Expiry`,
                                  value: x.bandExpiry,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  }),
                ],
              })
            : null;
}
function Ka({
  title: e,
  subtitle: t,
  adminName: n,
  onLogout: r,
  notifications: i,
  showNotifications: a,
  setShowNotifications: o,
  t: s,
}) {
  return (0, z.jsxs)(`header`, {
    className: `top-header`,
    children: [
      (0, z.jsxs)(`div`, {
        className: `brand`,
        children: [
          (0, z.jsx)(`div`, {
            className: `brand-logo`,
            children: (0, z.jsx)(`img`, {
              src: `/sulfscan-logo.png`,
              alt: `SulfiSafe logo`,
            }),
          }),
          (0, z.jsxs)(`div`, {
            children: [
              (0, z.jsx)(`h2`, { children: e }),
              (0, z.jsx)(`span`, { children: t }),
            ],
          }),
        ],
      }),
      (0, z.jsxs)(`div`, {
        className: `header-actions`,
        children: [
          n &&
            (0, z.jsxs)(`div`, {
              className: `admin-profile-chip`,
              children: [
                (0, z.jsx)(`span`, {
                  className: `admin-avatar`,
                  children: `SA`,
                }),
                (0, z.jsx)(`span`, { children: n }),
              ],
            }),
          (0, z.jsxs)(`div`, {
            className: `notification-wrapper`,
            children: [
              (0, z.jsxs)(`button`, {
                className: `notification-button`,
                onClick: () => o(!a),
                children: [
                  `🔔`,
                  i.length > 0 &&
                    (0, z.jsx)(`span`, {
                      className: `notification-count`,
                      children: i.length,
                    }),
                ],
              }),
              a &&
                (0, z.jsxs)(`div`, {
                  className: `notification-panel`,
                  children: [
                    (0, z.jsx)(`h3`, { children: s.notifications }),
                    i.length === 0
                      ? (0, z.jsx)(`p`, {
                          className: `empty-state`,
                          children: s.noNotifications,
                        })
                      : i
                          .slice(0, 8)
                          .map((e) =>
                            (0, z.jsxs)(
                              `div`,
                              {
                                className: `notification-item`,
                                children: [
                                  (0, z.jsx)(`strong`, { children: e.title }),
                                  (0, z.jsx)(`p`, { children: e.body }),
                                  (0, z.jsx)(`small`, { children: e.time }),
                                ],
                              },
                              e.id,
                            ),
                          ),
                  ],
                }),
            ],
          }),
          (0, z.jsx)(`button`, {
            className: `logout-button`,
            onClick: r,
            children: s.logout,
          }),
        ],
      }),
    ],
  });
}
function qa({ title: e, onBack: t }) {
  return (0, z.jsxs)(`header`, {
    className: `top-header simple-header`,
    children: [
      (0, z.jsx)(`button`, {
        className: `header-back-button`,
        onClick: t,
        children: `← Back`,
      }),
      (0, z.jsx)(`h2`, { children: e }),
      (0, z.jsx)(`div`, {}),
    ],
  });
}
function Ja({ employee: e, editable: t = !1, onColorChange: n }) {
  let r = e?.scanData || Ha(),
    i =
      r.complianceStatus === `NORMAL`
        ? `normal`
        : r.complianceStatus === `ACTION_REQUIRED`
          ? `action`
          : `danger`;
  return (0, z.jsxs)(`section`, {
    className: `colorimetry-card`,
    children: [
      (0, z.jsxs)(`div`, {
        className: `colorimetry-heading`,
        children: [
          (0, z.jsxs)(`div`, {
            children: [
              (0, z.jsx)(`span`, {
                className: `eyebrow`,
                children: `SULFSCAN / COLORIMETRY`,
              }),
              (0, z.jsx)(`h2`, { children: `pH paper colour to H₂S ppm` }),
              (0, z.jsx)(`p`, {
                children: `The observed strip colour is matched to the calibrated reference chart and converted into an estimated exposure value.`,
              }),
            ],
          }),
          (0, z.jsx)(`div`, {
            className: `scan-status-badge`,
            "data-status": i,
            children: r.complianceStatus.replace(`_`, ` `),
          }),
        ],
      }),
      (0, z.jsxs)(`div`, {
        className: `colorimetry-body`,
        children: [
          (0, z.jsxs)(`div`, {
            className: `colorimetry-reading`,
            children: [
              (0, z.jsx)(`div`, {
                className: `observed-swatch`,
                style: { backgroundColor: r.colorHex },
                title: r.colorLabel,
              }),
              (0, z.jsxs)(`div`, {
                children: [
                  (0, z.jsx)(`span`, { children: `Observed strip` }),
                  (0, z.jsx)(`strong`, { children: r.colorLabel }),
                  (0, z.jsxs)(`small`, {
                    children: [r.badgeId, ` · `, r.scannedAt],
                  }),
                ],
              }),
            ],
          }),
          (0, z.jsxs)(`div`, {
            className: `colorimetry-values`,
            children: [
              (0, z.jsxs)(`div`, {
                children: [
                  (0, z.jsx)(`span`, { children: `Estimated H₂S` }),
                  (0, z.jsxs)(`strong`, {
                    children: [
                      r.ppm.toFixed(1),
                      ` `,
                      (0, z.jsx)(`small`, { children: `ppm` }),
                    ],
                  }),
                ],
              }),
              (0, z.jsxs)(`div`, {
                children: [
                  (0, z.jsx)(`span`, { children: `CIE ΔE` }),
                  (0, z.jsxs)(`strong`, {
                    children: [
                      r.deltaE.toFixed(1),
                      ` `,
                      (0, z.jsx)(`small`, { children: `units` }),
                    ],
                  }),
                ],
              }),
              (0, z.jsxs)(`div`, {
                children: [
                  (0, z.jsx)(`span`, { children: `Shift dose` }),
                  (0, z.jsx)(`strong`, { children: r.cumulativeDose }),
                ],
              }),
            ],
          }),
        ],
      }),
      t &&
        (0, z.jsxs)(`div`, {
          className: `colorimetry-picker`,
          children: [
            (0, z.jsx)(`span`, { children: `Update observed colour` }),
            (0, z.jsx)(`div`, {
              className: `colorimetry-swatches`,
              children: Va.map((e) =>
                (0, z.jsxs)(
                  `button`,
                  {
                    type: `button`,
                    className:
                      r.observedColor === e.id
                        ? `color-swatch selected`
                        : `color-swatch`,
                    style: { backgroundColor: e.hex },
                    onClick: () => n(e.id),
                    title: `${e.label}: ${e.ppm.toFixed(1)} ppm`,
                    "aria-label": `${e.label}, ${e.ppm.toFixed(1)} ppm`,
                    children: [
                      (0, z.jsx)(`span`, { children: e.label }),
                      (0, z.jsxs)(`small`, {
                        children: [e.ppm.toFixed(1), ` ppm`],
                      }),
                    ],
                  },
                  e.id,
                ),
              ),
            }),
          ],
        }),
    ],
  });
}
function Ya({ icon: e, title: t, value: n, text: r, danger: i }) {
  return (0, z.jsxs)(`div`, {
    className: `metric-card ${i ? `danger-metric` : ``}`,
    children: [
      (0, z.jsx)(`div`, { className: `metric-icon`, children: e }),
      (0, z.jsxs)(`div`, {
        children: [
          (0, z.jsx)(`p`, { children: t }),
          (0, z.jsx)(`h2`, { className: i ? `risk-text` : ``, children: n }),
          (0, z.jsx)(`small`, { children: r }),
        ],
      }),
    ],
  });
}
function Xa({ image: e, onCamera: t, onGallery: n, onDelete: r }) {
  let [i, a] = (0, l.useState)(!1);
  return (0, z.jsxs)(`div`, {
    className: `profile-photo-controls`,
    children: [
      (0, z.jsxs)(`div`, {
        className: `profile-image-preview`,
        children: [
          e
            ? (0, z.jsx)(`img`, { src: e, alt: `Profile preview` })
            : (0, z.jsx)(`span`, { children: `👷` }),
          (0, z.jsx)(`button`, {
            type: `button`,
            className: `photo-menu-toggle`,
            "aria-label": `Profile picture options`,
            "aria-expanded": i,
            onClick: () => a((e) => !e),
            children: i ? `×` : `⌄`,
          }),
        ],
      }),
      i &&
        (0, z.jsxs)(`div`, {
          className: `photo-action-buttons`,
          children: [
            (0, z.jsx)(`button`, {
              type: `button`,
              className: `photo-action-button camera-action`,
              onClick: () => {
                (a(!1), t());
              },
              children: `📷 Open Camera`,
            }),
            (0, z.jsxs)(`label`, {
              className: `photo-action-button gallery-action`,
              children: [
                `🖼️ Choose from Gallery`,
                (0, z.jsx)(`input`, {
                  type: `file`,
                  accept: `image/*`,
                  onChange: n,
                  hidden: !0,
                }),
              ],
            }),
            (0, z.jsx)(`button`, {
              type: `button`,
              className: `photo-action-button delete-action`,
              onClick: () => {
                (a(!1), r());
              },
              disabled: !e,
              children: `🗑️ Delete`,
            }),
          ],
        }),
    ],
  });
}
function Za({ data: e, labels: t, period: n }) {
  let r = Math.max(...e);
  return (0, z.jsxs)(`div`, {
    className: `chart-container chart-${n}`,
    children: [
      (0, z.jsx)(`div`, {
        className: `chart-bars`,
        children: e.map((e, n) =>
          (0, z.jsxs)(
            `div`,
            {
              className: `bar-group`,
              children: [
                (0, z.jsx)(`div`, {
                  className: `chart-bar`,
                  style: {
                    height: `${(e / r) * 220}px`,
                    animationDelay: `${n * 0.08}s`,
                  },
                  title: `${e} ppm`,
                  children: (0, z.jsx)(`span`, { children: e }),
                }),
                (0, z.jsx)(`small`, {
                  className: `chart-label`,
                  title: t[n],
                  children: t[n],
                }),
              ],
            },
            n,
          ),
        ),
      }),
      (0, z.jsxs)(`div`, {
        className: `chart-period-note`,
        children: [
          n === `day` && `Time of day`,
          n === `week` && `Days of the week`,
          n === `month` && `Days of the month`,
        ],
      }),
    ],
  });
}
function Qa({ icon: e, value: t, label: n, danger: r }) {
  return (0, z.jsxs)(`div`, {
    className: `admin-stat ${r ? `danger-stat` : ``}`,
    children: [
      (0, z.jsx)(`span`, { children: e }),
      (0, z.jsxs)(`div`, {
        children: [
          (0, z.jsx)(`strong`, { children: t }),
          (0, z.jsx)(`p`, { children: n }),
        ],
      }),
    ],
  });
}
function $a({ label: e, value: t }) {
  return (0, z.jsxs)(`div`, {
    className: `detail-item`,
    children: [
      (0, z.jsx)(`span`, { children: e }),
      (0, z.jsx)(`strong`, { children: t }),
    ],
  });
}

export default Ga;
