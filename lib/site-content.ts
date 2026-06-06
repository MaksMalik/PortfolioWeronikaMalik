import type { SiteContent } from "@/lib/types";

export const SITE_CONTENT_SCHEMA_VERSION = 4;

export const siteContent: SiteContent = {
  schemaVersion: SITE_CONTENT_SCHEMA_VERSION,
  theme: "light",
  sections: {
    hero: { enabled: true, label: "Start" },
    about: { enabled: true, label: "O mnie" },
    portfolio: { enabled: true, eyebrow: "portfolio", title: "Wybrane role", label: "Role", actionLabel: "Czytaj więcej" },
    showreel: { enabled: true, label: "Showreel" },
    gallery: { enabled: true, eyebrow: "galeria", title: "Sesje zdjęciowe", description: "Editorialowe portrety, kadry i fragmenty pracy przed obiektywem.", label: "Galeria", actionLabel: "Otwórz sesję" },
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
    image: {
      id: "about-portrait",
      enabled: true,
      src: "",
      alt: "Czarno-biały portret studyjny Weroniki",
      aspect: "portrait"
    }
  },
  portfolio: [],
  showreel: {
    eyebrow: "showreel",
    title: "Krótki wgląd w mój świat",
    description: "Wybrane fragmenty z filmu, serialu i teatru zmontowane w spokojnym, kinowym rytmie.",
    buttonText: "Odtwórz showreel",
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
    email: "kontakt@weronikamalik.pl",
    phone: "+48 501 234 567",
    location: "Warszawa / Londyn",
    representation: "Northline Talent Agency",
    footerCopyrightName: "Weronika Malik",
    footerDesignerTag: "Projekt i realizacja",
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
