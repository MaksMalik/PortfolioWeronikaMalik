import type { SiteContent } from "@/lib/types";

export const SITE_CONTENT_SCHEMA_VERSION = 9;

export const siteContent: SiteContent = {
  schemaVersion: SITE_CONTENT_SCHEMA_VERSION,
  theme: "light",
  accentColorsEnabled: false,
  accentColor: "#c5a880",
  customCursorEnabled: true,
  portalCursorEnabled: false,
  adminCursorPreviewEnabled: false,
  mouseMagnetismEnabled: true,
  mouseMagnetismStrength: 100,
  mouseFollowLagEnabled: true,
  mouseFollowLagStrength: 100,
  seo: {
    title: "Weronika Malik | Portfolio aktorskie",
    description: "Portfolio aktorskie Weroniki Malik: role, showreel, galeria, prasa i kontakt.",
    image: {
      id: "seo-image",
      enabled: true,
      src: "",
      alt: "Zdjęcie SEO portfolio Weroniki Malik",
      aspect: "wide"
    }
  },
  sections: {
    hero: { enabled: true, label: "Start" },
    about: { enabled: true, label: "O mnie" },
    portfolio: { enabled: true, eyebrow: "portfolio", title: "Wybrane role", label: "Role", actionLabel: "Czytaj więcej" },
    showreel: { enabled: true, label: "Showreel" },
    gallery: { enabled: true, eyebrow: "galeria", title: "Sesje zdjęciowe", description: "Editorialowe portrety, kadry i fragmenty pracy przed obiektywem.", label: "Galeria", actionLabel: "Otwórz sesję", imageCounterTemplate: "Zdjęcie {current} z {total}" },
    press: { enabled: true, eyebrow: "prasa", title: "W mediach", label: "Prasa" },
    contact: { enabled: true, label: "Kontakt" }
  },
  sectionsOrder: ["hero", "about", "portfolio", "showreel", "gallery", "press", "contact"],
  hero: {
    monogram: "WM",
    monogramTagline: "film / teatr / głos",
    name: "WERONIKA MALIK",
    tagline: "Aktorka / Performerka / Opowiadaczka",
    quote: "Nie gram postaci. Wchodzę w ich pamięć, gest i oddech.",
    buttonText: "Zobacz portfolio",
    image: {
      id: "hero-portrait",
      enabled: true,
      src: "",
      alt: "Editorialowy portret Weroniki Malik",
      aspect: "portrait"
    }
  },
  about: {
    eyebrow: "o mnie",
    title: "Opowieść zaczyna się w ciszy",
    body: "Jestem aktorką przyciąganą przez role z wewnętrznym napięciem, delikatnością i prawdą emocjonalną. W kinie, teatrze i pracy przed kamerą szukam momentów, które zostają z widzem dłużej niż ostatnie ujęcie.",
    buttonText: "Porozmawiajmy",
    timelineEyebrow: "Oś Czasu",
    timelineTitle: "Droga twórcza",
    timelineStepTemplate: "Krok {current} / {total}",
    image: {
      id: "about-portrait",
      enabled: true,
      src: "",
      alt: "Czarno-biały portret studyjny Weroniki",
      aspect: "portrait"
    },
    timeline: [
      {
        id: "timeline-1",
        enabled: true,
        year: "2019",
        title: "Teatralny debiut sceniczny",
        description: "Pierwsza ważna rola na deskach teatru zawodowego po ukończeniu studiów, nagrodzona za debiut roku.",
        image: {
          id: "t1-img",
          enabled: true,
          src: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
          alt: "Kurtyna i deski teatru oświetlone snopem światła",
          aspect: "landscape"
        }
      },
      {
        id: "timeline-2",
        enabled: true,
        year: "2021",
        title: "Pierwsze kroki przed kamerą",
        description: "Debiut w pełnometrażowym kinie niezależnym oraz rola epizodyczna w uznanym serialu dramatycznym.",
        image: {
          id: "t2-img",
          enabled: true,
          src: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
          alt: "Klapka filmowa na planie filmowym w półmroku",
          aspect: "landscape"
        }
      },
      {
        id: "timeline-3",
        enabled: true,
        year: "2023",
        title: "Główne role i współprace",
        description: "Kreacja głównej bohaterki w nagradzanym filmie krótkometrażowym na międzynarodowych festiwalach.",
        image: {
          id: "t3-img",
          enabled: true,
          src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
          alt: "Portret studyjny w świetle neonów",
          aspect: "landscape"
        }
      },
      {
        id: "timeline-4",
        enabled: true,
        year: "2026",
        title: "Horyzonty artystyczne",
        description: "Obecne projekty teatralne oraz rozwój warsztatu aktorskiego na rynkach międzynarodowych.",
        image: {
          id: "t4-img",
          enabled: true,
          src: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
          alt: "Reflektory kinowe i pusta widownia",
          aspect: "landscape"
        }
      }
    ]
  },
  portfolio: [],
  showreel: {
    eyebrow: "showreel",
    title: "Krótki wgląd w mój świat",
    description: "Wybrane fragmenty z filmu, serialu i teatru zmontowane w spokojnym, kinowym rytmie.",
    buttonText: "Odtwórz showreel",
    modalLabel: "Showreel",
    loadingLabel: "Ładowanie wideo...",
    playCursorLabel: "Play",
    thumbnail: {
      id: "showreel-thumb",
      enabled: true,
      src: "",
      alt: "Kadr showreela Weroniki Malik",
      aspect: "wide"
    },
    videoUrl: "",
    youtubeThumbnailEnabled: false,
    videos: []
  },
  gallery: [],
  press: [
    {
      id: "magazyn-filmowy",
      enabled: true,
      quote: "Obecność, która zostaje z widzem jeszcze długo po ostatniej scenie.",
      outlet: "Magazyn Filmowy",
      author: "Notatnik krytyka"
    },
    {
      id: "scena",
      enabled: true,
      quote: "Subtelna, magnetyczna i emocjonalnie precyzyjna.",
      outlet: "Scena",
      author: "Recenzja festiwalowa"
    },
    {
      id: "ekran",
      enabled: true,
      quote: "Talent, który warto uważnie obserwować.",
      outlet: "Ekran",
      author: "Dział kultury"
    }
  ],
  contact: {
    eyebrow: "kontakt",
    heading: "Stwórzmy coś pięknego.",
    intro: "W sprawie projektów filmowych, serialowych, teatralnych i editorialowych skontaktuj się bezpośrednio lub przez reprezentację.",
    emailLabel: "Napisz bezpośrednio",
    phoneLabel: "Zadzwoń",
    phoneRevealLabel: "Pokaż numer telefonu",
    locationLabel: "Baza / Lokalizacja",
    representationLabel: "Reprezentacja / Agent",
    email: "kontakt@weronikamalik.pl",
    phone: "+48 501 234 567",
    location: "Warszawa / Londyn",
    representation: "Northline Talent Agency",
    footerCopyrightName: "Weronika Malik",
    footerDesignerTag: "Projekt i realizacja",
    floatingSocialsEnabled: true,
    socials: [
      {
        id: "instagram",
        enabled: true,
        label: "Instagram",
        url: "https://instagram.com"
      },
      {
        id: "imdb",
        enabled: true,
        label: "Filmweb",
        url: "https://www.filmweb.pl"
      },
      {
        id: "facebook",
        enabled: true,
        label: "Facebook",
        url: "https://facebook.com"
      }
    ]
  }
};
