/**
 * Diccionario de textos de la interfaz (es-PE).
 * - {variable} se sustituye con t(key, { variable }). {brand} y {tagline} siempre están disponibles.
 * - *palabra* se pinta con el acento serif cursivo (componente <Rich />).
 * Para añadir un idioma: copia este archivo, tradúcelo y regístralo en ./index.ts.
 */
export const esPE = {
  common: {
    createCard: "Crea tu tarjeta",
    login: "Entrar",
    howItWorks: "Cómo funciona",
    privacy: "Privacidad",
    terms: "Términos",
    contact: "Contacto",
    theme: "Cambiar tema",
    toggleMenu: "Abrir menú",
    skipToContent: "Saltar al contenido",
    backHome: "Volver al inicio",
  },
  nav: {
    how: "Cómo funciona",
    privacy: "Privacidad",
    faq: "Preguntas",
  },
  landing: {
    hero: {
      eyebrow: "Tarjetas de fidelidad en el celular",
      title: "Tu cliente *vuelve*. Tú solo pones el sello.",
      subtitle:
        "Crea la tarjeta de sellos de tu negocio en minutos. Vive en el Wallet del celular de tu cliente y le avisa cuando pasa cerca. Sin app, sin plástico, sin líos.",
      note: "Apple Wallet hoy. Google Wallet muy pronto.",
      mockup: {
        time: "9:41",
        date: "martes 14 de octubre",
        business: "Panadería Alba",
        notification: "Estás al lado 🥐 Te falta 1 sello para tu café gratis. ¡Pasa por él!",
        now: "ahora",
        cardLabel: "Tarjeta de sellos",
        cardReward: "Café gratis",
        cardProgress: "5 de 6 sellos",
        ariaLabel:
          "Celular con la pantalla de bloqueo mostrando un aviso de la Panadería Alba y su tarjeta de sellos con 5 de 6 sellos.",
      },
    },
    kinds: {
      title: "Hecho para negocios de barrio",
      items: ["Cafeterías", "Panaderías", "Pollerías", "Barberías", "Bodegas", "Heladerías"],
    },
    how: {
      eyebrow: "Cómo funciona",
      title: "Tres pasos y *listo*",
      steps: [
        {
          title: "Diseña tu tarjeta",
          body: "Pon tu logo, tus colores y el premio. Eliges cuántos sellos hacen falta. Ves cómo queda mientras escribes.",
        },
        {
          title: "Pega tu QR en el mostrador",
          body: "Tu cliente lo escanea con el celular y guarda la tarjeta en su Wallet. Tarda diez segundos.",
        },
        {
          title: "Sella y que vuelvan",
          body: "En caja escaneas su tarjeta y tocas “Sumar sello”. Su celular se actualiza solo. Al llegar al máximo, el premio queda listo para canjear.",
        },
      ],
    },
    privacy: {
      eyebrow: "Privacidad",
      title: "No te rastreamos: *tu iPhone* decide cuándo avisarte",
      body: "El aviso en la pantalla de bloqueo no pasa por nuestros servidores. El teléfono guarda la ubicación de tu negocio y es él quien compara. Nosotros nunca sabemos dónde está tu cliente.",
      points: [
        "No recibimos ni guardamos la ubicación de tus clientes.",
        "Guardamos solo lo mínimo: un código de tarjeta y, si quiere, su nombre.",
        "Tu cliente puede apagar los avisos cuando quiera desde los detalles del pase.",
      ],
      cta: "Leer la política completa",
    },
    faq: {
      eyebrow: "Preguntas frecuentes",
      title: "Lo que todos preguntan",
      items: [
        {
          q: "¿Mis clientes necesitan descargar una app?",
          a: "No. La tarjeta se guarda en el Wallet que ya viene en su celular. Escanean el QR, tocan un botón y listo.",
        },
        {
          q: "¿Funciona en Android?",
          a: "Hoy funciona con Apple Wallet. Google Wallet viene en la siguiente fase. Hasta entonces, la tarjeta se guarda solo en iPhone.",
        },
        {
          q: "¿Cuánto cuesta?",
          a: "Durante la beta es gratis. Más adelante habrá un plan gratuito para empezar y otro para negocios con varios locales.",
        },
        {
          q: "¿Saben dónde está mi cliente?",
          a: "No. El celular de tu cliente compara su posición con la de tu negocio sin avisarnos. Nosotros no recibimos esa información.",
        },
        {
          q: "¿Y si tengo más de un local?",
          a: "Puedes añadir varias ubicaciones a la misma tarjeta, cada una con su propio aviso.",
        },
        {
          q: "¿Qué pasa si mi cliente cambia de celular?",
          a: "Si usa iCloud, su tarjeta y sus sellos viajan con él al celular nuevo.",
        },
      ],
    },
    cta: {
      title: "Tu barrio ya te conoce. Que ahora *te recuerde*.",
      body: "Crea tu tarjeta hoy y estrena sellos mañana.",
    },
    footer: {
      rights: "© {year} {brand}. Hecho con cariño en el barrio.",
    },
  },
  legal: {
    updated: "Última actualización: {date}",
    draftNotice:
      "Este texto es una base para el desarrollo. Antes de lanzar, que lo revise una persona con formación legal.",
    privacy: {
      title: "Privacidad, sin letra chica",
      intro:
        "{brand} existe para que tu barrio vuelva a verte, no para vigilar a nadie. Esto es lo que pasa con tus datos.",
      sections: [
        {
          title: "Tu ubicación se queda en tu celular",
          body: [
            "Cuando guardas una tarjeta en tu Wallet, el pase incluye la dirección del negocio. Tu celular compara tu posición con ese lugar por su cuenta y, si estás cerca, muestra el aviso en la pantalla de bloqueo.",
            "Esa comparación ocurre solo en tu dispositivo. {brand} nunca recibe, guarda ni procesa tu ubicación.",
          ],
        },
        {
          title: "Cómo apagar los avisos",
          body: [
            "Abre la tarjeta en Wallet, toca el botón de más opciones (•••) y desactiva “Sugerir en pantalla bloqueada”. La tarjeta seguirá funcionando igual, solo dejará de avisarte.",
          ],
        },
        {
          title: "Qué datos guardamos",
          body: [
            "Solo lo mínimo para que tu tarjeta funcione: un código único de tarjeta, cuántos sellos tienes, cuándo se dieron y, si tú quieres, tu nombre.",
            "No pedimos tu correo, tu teléfono ni tu documento para darte una tarjeta.",
          ],
        },
        {
          title: "Para qué usamos esos datos",
          body: [
            "Para sumar sellos, avisar al negocio de que tu premio está listo y mantener tu tarjeta al día en tu celular. No vendemos datos ni los usamos para publicidad.",
          ],
        },
        {
          title: "Cuánto tiempo los guardamos",
          body: [
            "Mientras tu tarjeta exista. Si quieres que borremos la tuya, escríbenos a {email} y lo hacemos.",
          ],
        },
        {
          title: "Dueños y personal de caja",
          body: [
            "Para entrar al panel guardamos tu correo y una contraseña cifrada. Registramos quién sumó cada sello para que el negocio pueda revisar su historial.",
          ],
        },
      ],
    },
    terms: {
      title: "Términos de uso",
      intro: "Reglas simples para usar {brand}. Al crear una cuenta aceptas lo siguiente.",
      sections: [
        {
          title: "Qué es {brand}",
          body: [
            "Una herramienta para que los negocios emitan tarjetas de fidelidad digitales y las gestionen desde caja.",
          ],
        },
        {
          title: "Tu cuenta",
          body: [
            "Eres responsable de lo que se haga con tu cuenta y de dar acceso solo a tu equipo. Cuida tu contraseña.",
          ],
        },
        {
          title: "Tus premios, tus reglas",
          body: [
            "Cada negocio define sus sellos, su premio y sus condiciones. {brand} solo da la herramienta: cumplir el premio es responsabilidad del negocio.",
          ],
        },
        {
          title: "Uso aceptable",
          body: ["No uses {brand} para engañar a clientes, enviar spam ni para nada que la ley no permita."],
        },
        {
          title: "Cambios y contacto",
          body: ["Podemos actualizar estos términos y te avisaremos. Dudas: {email}."],
        },
      ],
    },
  },
} as const;

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : T extends object
      ? { -readonly [K in keyof T]: Widen<T[K]> }
      : T;

export type Dictionary = Widen<typeof esPE>;
