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
      src: "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=1200&q=85",
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
      src: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=900&q=85",
      alt: "Czarno-biały portret studyjny Weroniki",
      aspect: "portrait"
    }
  },
  portfolio: [
    {
      id: "ostatnia-zima",
      enabled: true,
      title: "Ostatnia zima",
      type: "Film fabularny",
      role: "Rola główna",
      year: "2026",
      description: "Kameralny dramat psychologiczny o pamięci, żałobie i podróży przez zimowe wybrzeże.",
      details: "Weronika prowadzi postać przez napięcie między siłą a kruchością. Rola opiera się na oszczędnym geście, bliskich planach i emocjach budowanych ciszą.",
      linkLabel: "Filmweb",
      linkUrl: "https://www.filmweb.pl",
      image: {
        id: "portfolio-1",
        enabled: true,
        src: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=85",
        alt: "Weronika w filmowym zbliżeniu",
        aspect: "portrait"
      },
      images: [
        {
          id: "portfolio-1-detail-1",
          enabled: true,
          src: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1000&q=85",
          alt: "Kadr z projektu Ostatnia zima",
          title: "Zbliżenie",
          aspect: "landscape"
        },
        {
          id: "portfolio-1-detail-2",
          enabled: true,
          src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85",
          alt: "Portret postaci z filmu",
          title: "Pamięć",
          aspect: "portrait"
        }
      ]
    },
    {
      id: "miasto-papierowych-swiatel",
      enabled: true,
      title: "Miasto papierowych świateł",
      type: "Serial TV",
      role: "Rola główna",
      year: "2025",
      description: "Limitowany serial noir o dziennikarce, która odkrywa miasto pełne nieoczywistych lojalności.",
      details: "Rola łączy precyzję obserwatorki z emocjonalnym ryzykiem osoby, która zaczyna tracić kontrolę nad śledztwem i własną historią.",
      linkLabel: "Filmweb",
      linkUrl: "https://www.filmweb.pl",
      image: {
        id: "portfolio-2",
        enabled: true,
        src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85",
        alt: "Weronika w dramatycznym portrecie miejskim",
        aspect: "portrait"
      },
      images: [
        {
          id: "portfolio-2-detail-1",
          enabled: true,
          src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85",
          alt: "Kadr noir z serialu",
          title: "Miasto",
          aspect: "wide"
        }
      ]
    },
    {
      id: "sen-letniej-nocy",
      enabled: true,
      title: "Sen letniej nocy",
      type: "Teatr",
      role: "Rola główna",
      year: "2024",
      description: "Współczesna adaptacja sceniczna o pragnieniu, czułości i subtelnym komizmie relacji.",
      details: "Interpretacja sceniczna oparta na rytmie, głosie i fizyczności. Postać porusza się między lekkością komedii a czułym, bardzo ludzkim pęknięciem.",
      linkLabel: "Strona teatru",
      linkUrl: "https://www.filmweb.pl",
      image: {
        id: "portfolio-3",
        enabled: true,
        src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85",
        alt: "Weronika w portrecie inspirowanym teatrem",
        aspect: "portrait"
      },
      images: [
        {
          id: "portfolio-3-detail-1",
          enabled: true,
          src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85",
          alt: "Kadr teatralny",
          title: "Scena",
          aspect: "square"
        }
      ]
    }
  ],
  showreel: {
    eyebrow: "showreel",
    title: "Krótki wgląd w mój świat",
    description: "Wybrane fragmenty z filmu, serialu i teatru zmontowane w spokojnym, kinowym rytmie.",
    buttonText: "Odtwórz showreel",
    thumbnail: {
      id: "showreel-thumb",
      enabled: true,
      src: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=1400&q=85",
      alt: "Kadr showreela Weroniki Malik",
      aspect: "wide"
    },
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    youtubeThumbnailEnabled: false,
    videos: []
  },
  gallery: [
    {
      id: "sesja-portretowa",
      enabled: true,
      title: "Portrety w miękkim świetle",
      subtitle: "Sesja studyjna / 2026",
      description: "Minimalistyczna sesja oparta na ciszy, spojrzeniu i detalach ruchu.",
      cover: {
        id: "session-1-cover",
        enabled: true,
        src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1100&q=85",
        alt: "Okładka sesji portretowej Weroniki",
        title: "Miękkie światło",
        aspect: "portrait"
      },
      images: [
        {
          id: "session-1-1",
          enabled: true,
          src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85",
          alt: "Portret w miękkim świetle",
          title: "Cisza",
          aspect: "portrait"
        },
        {
          id: "session-1-2",
          enabled: true,
          src: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1000&q=85",
          alt: "Minimalny portret studyjny",
          title: "Studio",
          aspect: "landscape"
        },
        {
          id: "session-1-3",
          enabled: true,
          src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85",
          alt: "Naturalny portret filmowy",
          title: "Spojrzenie",
          aspect: "square"
        },
        {
          id: "session-1-4",
          enabled: true,
          src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=85",
          alt: "Portret editorialowy",
          title: "Kadr",
          aspect: "portrait"
        }
      ]
    },
    {
      id: "sesja-filmowa",
      enabled: true,
      title: "Cinematic stills",
      subtitle: "Kadr / światło / ruch",
      description: "Kadry inspirowane planem filmowym, ruchem kamery i światłem późnego popołudnia.",
      cover: {
        id: "session-2-cover",
        enabled: true,
        src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1100&q=85",
        alt: "Okładka sesji filmowej",
        title: "Cinematic stills",
        aspect: "landscape"
      },
      images: [
        {
          id: "session-2-1",
          enabled: true,
          src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
          alt: "Filmowy portret Weroniki",
          title: "Magnetyzm",
          aspect: "portrait"
        },
        {
          id: "session-2-2",
          enabled: true,
          src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1100&q=85",
          alt: "Elegancki portret plenerowy",
          title: "Popołudnie",
          aspect: "landscape"
        },
        {
          id: "session-2-3",
          enabled: true,
          src: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=1200&q=85",
          alt: "Kadr o filmowym klimacie",
          title: "Ruch",
          aspect: "wide"
        }
      ]
    },
    {
      id: "sesja-editorial",
      enabled: true,
      title: "Editorial noir",
      subtitle: "Moda / teatr / portret",
      description: "",
      cover: {
        id: "session-3-cover",
        enabled: true,
        src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1100&q=85",
        alt: "Okładka sesji editorial noir",
        title: "Editorial noir",
        aspect: "portrait"
      },
      images: [
        {
          id: "session-3-1",
          enabled: true,
          src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85",
          alt: "Portret w estetyce noir",
          title: "Noir",
          aspect: "portrait"
        },
        {
          id: "session-3-2",
          enabled: true,
          src: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1000&q=85",
          alt: "Kadr editorialowy",
          title: "Scena",
          aspect: "landscape"
        },
        {
          id: "session-3-3",
          enabled: true,
          src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85",
          alt: "Portret teatralny",
          title: "Teatr",
          aspect: "square"
        }
      ]
    }
  ],
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
  },
  introLoader: {
    enabled: true,
    title: "Weronika Malik",
    subtitle: "Portfolio Aktorskie"
  }
};
