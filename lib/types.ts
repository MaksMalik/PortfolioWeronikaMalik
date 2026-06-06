export type SiteImage = {
  id: string;
  enabled: boolean;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  aspect?: "portrait" | "landscape" | "square" | "wide";
};

export type SectionSettings = {
  enabled: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  label?: string;
  actionLabel?: string;
};

export type HeroContent = {
  monogram: string;
  monogramTagline?: string;
  name: string;
  tagline: string;
  quote: string;
  buttonText: string;
  image: SiteImage;
};

export type TimelineEvent = {
  id: string;
  enabled: boolean;
  year: string;
  title: string;
  description: string;
  image: SiteImage;
};

export type AboutContent = {
  eyebrow: string;
  title: string;
  body: string;
  buttonText: string;
  image: SiteImage;
  timeline?: TimelineEvent[];
};

export type PortfolioProject = {
  id: string;
  enabled: boolean;
  title: string;
  type: string;
  role: string;
  year: string;
  description: string;
  details?: string;
  linkLabel?: string;
  linkUrl?: string;
  image: SiteImage;
  images: SiteImage[];
};

export type ShowreelVideo = {
  id: string;
  enabled: boolean;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnail: SiteImage;
  youtubeThumbnailEnabled?: boolean;
};

export type ShowreelContent = {
  eyebrow: string;
  title: string;
  description: string;
  buttonText: string;
  thumbnail: SiteImage;
  videoUrl: string;
  youtubeThumbnailEnabled?: boolean;
  videos?: ShowreelVideo[];
};

export type PressMention = {
  id: string;
  enabled: boolean;
  quote: string;
  outlet: string;
  author: string;
};

export type GallerySession = {
  id: string;
  enabled: boolean;
  title: string;
  subtitle: string;
  description?: string;
  cover: SiteImage;
  images: SiteImage[];
};

export type SocialLink = {
  id: string;
  enabled: boolean;
  label: string;
  url: string;
};

export type ContactContent = {
  eyebrow: string;
  heading: string;
  intro: string;
  email: string;
  phone: string;
  location: string;
  representation: string;
  socials: SocialLink[];
  floatingSocialsEnabled?: boolean;
  footerCopyrightName?: string;
  footerDesignerTag?: string;
};


export type SiteContent = {
  schemaVersion: number;
  theme?: "light" | "dark";
  accentColorsEnabled?: boolean;
  accentColor?: string;
  portalCursorEnabled?: boolean;
  sections: {
    hero: SectionSettings;
    about: SectionSettings;
    portfolio: SectionSettings;
    showreel: SectionSettings;
    gallery: SectionSettings;
    press: SectionSettings;
    contact: SectionSettings;
  };
  hero: HeroContent;
  about: AboutContent;
  portfolio: PortfolioProject[];
  showreel: ShowreelContent;
  gallery: GallerySession[];
  press: PressMention[];
  contact: ContactContent;
  sectionsOrder?: string[];
};

export type ContentVersion = {
  id: string;
  timestamp: number;
  type: "autosave" | "draft" | "live" | "manual";
  label: string;
  content: SiteContent;
};
