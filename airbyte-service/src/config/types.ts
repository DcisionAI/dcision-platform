export interface WhiteLabelConfig {
  branding: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    customCSS?: string;
  };
  companyInfo: {
    name: string;
    supportEmail: string;
    documentationUrl: string;
    termsOfServiceUrl?: string;
    privacyPolicyUrl?: string;
  };
}

export const DEFAULT_WHITE_LABEL_CONFIG: WhiteLabelConfig = {
  branding: {
    logo: '/images/dcisionai-logo.png',
    primaryColor: '#0066FF',
    secondaryColor: '#00CCFF',
    fontFamily: 'Inter, sans-serif'
  },
  companyInfo: {
    name: 'DcisionAI',
    supportEmail: 'support@dcisionai.com',
    documentationUrl: 'https://docs.dcisionai.com'
  }
}; 