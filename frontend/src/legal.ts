export type LegalBlock =
  | { t: "h1"; text: string }
  | { t: "h2"; text: string }
  | { t: "p"; text: string }
  | { t: "bullet"; text: string }
  | { t: "strong"; text: string };

export type LegalDoc = {
  title: string;
  updated: string;
  entity: string;
  intro?: string;
  blocks: LegalBlock[];
};

export const LEGAL: Record<string, LegalDoc> = {
  privacidad: {
    title: "Política de Privacidad y Seguridad",
    updated: "Última actualización: 27 de agosto de 2026",
    entity: "VitrinaAutomotriz.cl — Grupo Moller SpA",
    blocks: [
      { t: "h1", text: "Introducción" },
      { t: "p", text: "En VitrinaAutomotriz.cl nos comprometemos a proteger tu privacidad. Esta política describe cómo Grupo Moller SpA (RUT 78.174.425-5), responsable del tratamiento, recopila, usa, protege y —solo cuando corresponde— comparte la información personal que nos proporcionas, conforme a las Leyes N° 19.628 y N° 21.719 sobre protección de datos personales. Al usar nuestros servicios, entregas tu consentimiento libre, informado, específico e inequívoco para el tratamiento descrito en esta política." },

      { t: "h1", text: "1. Qué información recopilamos" },
      { t: "h2", text: "1.1. Registro de talleres y prestadores de servicios" },
      { t: "p", text: "Al registrarte recopilamos el nombre de tu taller, tipo de servicios, tu nombre, dirección comercial (con georreferencia), correo, dirección de facturación, teléfono o WhatsApp, y fotografías del establecimiento." },
      { t: "h2", text: "1.2. Información de pago" },
      { t: "p", text: "Si pagas una suscripción o plan, procesamos la información necesaria a través de pasarelas de pago externas cifradas; no almacenamos los datos de tu tarjeta o cuenta bancaria en nuestros servidores." },
      { t: "h2", text: "1.3. Información de uso del sitio" },
      { t: "p", text: "Podemos recopilar tu dirección IP, tipo de navegador, páginas visitadas y tiempo de permanencia, para optimizar el sitio y, cuando corresponda, informar a un taller cuántas visitas recibió su ficha." },

      { t: "h1", text: "2. Para qué usamos tu información — por finalidad, con tu autorización" },
      { t: "p", text: "A diferencia de un aviso general, tratamos tus datos según finalidades específicas, cada una con su propia autorización:" },
      { t: "bullet", text: "Publicación de tu ficha en el portal: nombre, servicios, ubicación y contacto comercial (con georreferencia) se publican en tu ficha para que los clientes te encuentren. Esta finalidad es necesaria para prestar el servicio de directorio que solicitaste al registrarte." },
      { t: "bullet", text: "Derivación de clientes interesados: solo si lo autorizas expresamente, compartimos tu contacto con personas que buscan servicios como el tuyo a través del portal." },
      { t: "bullet", text: "Presentación a empresas y flotas: solo si lo autorizas expresamente, incluimos tu taller, con tu nivel de verificación si existe, en propuestas dirigidas a empresas que requieren servicios automotrices para su flota." },
      { t: "bullet", text: "Ofertas de proveedores del rubro: solo si lo autorizas expresamente, te enviamos ofertas comerciales de proveedores y distribuidores, siempre a través de nuestros propios canales — tus datos de contacto no se entregan directamente a esos proveedores." },
      { t: "h2", text: "2.1. Comunicaciones" },
      { t: "p", text: "Te enviamos actualizaciones y novedades relevantes sobre tu cuenta y, si lo autorizaste, ofertas y promociones." },
      { t: "h2", text: "2.2. Mejora del servicio y personalización" },
      { t: "p", text: "Usamos información de uso para mantener, mejorar y personalizar tu experiencia en el sitio." },
      { t: "h2", text: "2.3. Procesamiento de tu suscripción" },
      { t: "p", text: "Usamos tu información de pago para procesar tu suscripción a VitrinaAutomotriz.cl (no el pago de servicios automotrices, que ocurre directamente entre tú y el taller — ver punto 6 de los Términos de Uso)." },
      { t: "h2", text: "2.4. Cumplimiento legal" },
      { t: "p", text: "Tratamos tus datos cumpliendo las Leyes N° 19.628 y N° 21.719." },

      { t: "h1", text: "3. Uso de nuestro Asistente Virtual (Inteligencia Artificial)" },
      { t: "p", text: "VitrinaAutomotriz.cl pone a disposición un asistente virtual para ayudarte a encontrar un taller, grúa u otro servicio automotriz cercano. Este asistente es una herramienta operada por Grupo Moller SpA, quien es responsable de su funcionamiento — las mismas limitaciones de responsabilidad señaladas en los puntos 2 y 8 de nuestros Términos de Uso aplican a las sugerencias que este asistente te entregue: el asistente orienta hacia un taller de la red, pero no presta el servicio automotriz, no lo garantiza, y no reemplaza el acuerdo directo entre el cliente y el taller." },
      { t: "p", text: "El asistente solo te pide el tipo de servicio que buscas y tu comuna, para derivarte al taller o prestador de servicios automotrices más cercano dentro de nuestra red. No te solicita tu nombre, tu RUT, tu dirección exacta, tu patente ni ningún otro dato personal para completar esta función." },
      { t: "p", text: "Te recomendamos no compartir información personal en la conversación con el asistente, más allá del tipo de servicio y la comuna que te pedimos. El asistente no la necesita para ayudarte, y minimizar lo que compartes es la forma más segura de proteger tu privacidad." },
      { t: "p", text: "El proveedor tecnológico que hace posible este asistente puede conservar temporalmente el contenido de la conversación por motivos de seguridad y prevención de abuso, conforme a sus propias políticas técnicas, sin asociarlo a tu identidad ni usarlo para fines distintos a ese ni compartirlo con otros terceros." },

      { t: "h1", text: "4. Cuánto tiempo conservamos tus datos" },
      { t: "p", text: "Tus datos se conservan mientras tu negocio permanezca activo en la red, y hasta dos (2) años después de tu salida, salvo que ejerzas tu derecho de eliminación antes de ese plazo." },

      { t: "h1", text: "5. Tus derechos" },
      { t: "p", text: "Puedes solicitar acceso, rectificación, eliminación, oposición y portabilidad de tus datos, así como revocar cualquiera de las autorizaciones específicas del punto 2 o dejar de recibir comunicaciones, escribiendo a contacto@vitrinaautomotriz.cl. Revocar una autorización no afecta el tratamiento que ya hayas realizado conforme a ella, y no afecta las demás finalidades que sí hayas autorizado." },

      { t: "h1", text: "6. A quién entregamos tu información" },
      { t: "p", text: "No entregamos tu información personal a terceros sin tu autorización expresa para la finalidad correspondiente (ver punto 2), salvo cuando sea necesario para cumplir una obligación legal o responder a un requerimiento de autoridad competente. En particular, nunca entregamos tu base de datos completa a proveedores o distribuidores — solo derivamos contactos puntuales, taller por taller, cuando existe interés concreto y tu autorización vigente." },

      { t: "h1", text: "7. Cookies y tecnologías similares" },
      { t: "p", text: "Usamos cookies y tecnologías de seguimiento para mejorar la funcionalidad del sitio. Puedes gestionarlas desde la configuración de tu navegador." },

      { t: "h1", text: "8. Seguridad de la información" },
      { t: "p", text: "Aplicamos protocolos de cifrado, respaldos regulares y otras medidas para proteger la integridad y confidencialidad de tus datos. Nuestro proveedor de alojamiento realiza respaldos cada 7 días y garantiza un 99% de tiempo de actividad para prestadores de servicios al día con su suscripción. No se consideran caídas de servicio los eventos ajenos a nuestro control razonable (actos del Gobierno, sabotaje, catástrofes naturales), el mantenimiento programado, ni el incumplimiento de estos Términos por parte del usuario." },

      { t: "h1", text: "9. Enlaces a sitios de terceros" },
      { t: "p", text: "El sitio puede enlazar a sitios de terceros, incluidos los de los propios talleres o sus redes sociales. No controlamos su contenido ni sus políticas de privacidad y no asumimos responsabilidad por ellos." },
      { t: "strong", text: "NO COMPRE NI ADQUIERA PRODUCTOS O SERVICIOS SIN ACORDAR PREVIAMENTE CON EL TALLER O PRESTADOR DE SERVICIOS." },
      { t: "strong", text: "ASEGURARSE DE QUE EL TALLER O PRESTADOR DE SERVICIOS EXISTE ES RESPONSABILIDAD DEL CLIENTE. No asumimos responsabilidad por inscripciones fraudulentas o inexistentes, ni por servicios no proporcionados por los talleres." },

      { t: "h1", text: "10. Fuerza mayor" },
      { t: "p", text: "No seremos responsables por incumplimientos causados por eventos fuera de nuestro control razonable (desastres naturales, disturbios civiles, actos de terrorismo, fallos técnicos, virus informáticos u otra causa de fuerza mayor). Ante estos eventos, haremos esfuerzos razonables por mitigar sus efectos y proteger tu información." },

      { t: "h1", text: "11. Política de \"No Molestar\"" },
      { t: "p", text: "Enviamos información de promociones y ofertas —solo si autorizaste esa finalidad— exclusivamente los días viernes de cada semana, una vez por semana. Puedes solicitar tu baja de estas comunicaciones en cualquier momento por WhatsApp; procesaremos tu solicitud de inmediato." },

      { t: "h1", text: "12. Cambios en esta política" },
      { t: "p", text: "Nos reservamos el derecho de actualizar esta Política de Privacidad. Te notificaremos cambios significativos mediante aviso destacado en el sitio o por correo. Te recomendamos revisarla periódicamente." },

      { t: "h1", text: "13. Consentimiento y contacto" },
      { t: "p", text: "Al utilizar VitrinaAutomotriz.cl, otorgas tu consentimiento a esta Política de Privacidad. Para consultas, escríbenos a contacto@vitrinaautomotriz.cl, indicando en el asunto \"Consulta Política de Privacidad\"." },
    ],
  },

  terminos: {
    title: "Términos de Uso Obligatorio",
    updated: "Última actualización: 27 de agosto de 2026",
    entity: "VitrinaAutomotriz.cl — Grupo Moller SpA",
    blocks: [
      { t: "h1", text: "1. Aceptación de estos Términos" },
      { t: "p", text: "Al acceder y utilizar VitrinaAutomotriz.cl, aceptas cumplir con estos Términos de Uso Obligatorio y con todas las leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, te pedimos no utilizar la app ni el sitio web. El incumplimiento de estos Términos puede resultar en la suspensión del servicio y/o la terminación de tu suscripción a VitrinaAutomotriz.cl." },

      { t: "h1", text: "2. Qué es VitrinaAutomotriz.cl (naturaleza del servicio)" },
      { t: "p", text: "VitrinaAutomotriz.cl es un directorio y canal de intermediación operado por Grupo Moller SpA, RUT 78.174.425-5, que conecta a personas que buscan servicios para sus vehículos, motos, buses o camiones con talleres y prestadores de servicios independientes registrados en la red." },
      { t: "p", text: "VitrinaAutomotriz.cl no presta servicios de mantención, reparación, mecánica, vulcanización, lubricación, pintura ni ningún otro servicio automotriz. Nuestro rol se limita a publicar la información del taller o prestador de servicios, facilitar el contacto entre las partes y, cuando corresponda, derivar solicitudes de clientes interesados. El contrato de prestación de servicios se celebra directa y exclusivamente entre el cliente y el taller o prestador de servicios, quienes acuerdan entre sí el precio, el plazo, el alcance del trabajo y las condiciones de garantía." },
      { t: "p", text: "Grupo Moller SpA no interviene en la ejecución del servicio, no supervisa su calidad, no garantiza resultados y no es parte del acuerdo comercial entre cliente y taller." },

      { t: "h1", text: "3. Uso de la app y sitio web" },
      { t: "h2", text: "3.1. Contenido del sitio" },
      { t: "p", text: "Todo el contenido de VitrinaAutomotriz.cl es de carácter informativo general. Nos reservamos el derecho de cambiar, modificar o eliminar cualquier contenido sin previo aviso." },
      { t: "h2", text: "3.2. Registro de cuenta" },
      { t: "p", text: "Al registrarte eres responsable de proporcionar información precisa y de mantener la confidencialidad de tus credenciales de acceso. Eres responsable de toda actividad que ocurra bajo tu cuenta y no debes compartirla con vendedores ni publicistas; si lo haces, respondes por sus actividades." },
      { t: "h2", text: "3.3. Asistente Virtual (Inteligencia Artificial)" },
      { t: "p", text: "VitrinaAutomotriz.cl cuenta con un asistente de inteligencia artificial que te ayuda a encontrar un taller o servicio cercano, solicitándote únicamente el tipo de servicio y tu comuna. El uso del asistente se sujeta a nuestra Política de Privacidad. Las sugerencias del asistente no constituyen una recomendación garantizada ni reemplazan tu acuerdo directo con el taller, conforme al punto 2 de estos Términos." },

      { t: "h1", text: "4. Conducta del usuario (cliente que busca un servicio)" },
      { t: "p", text: "Al utilizar VitrinaAutomotriz.cl te comprometes a no violar leyes nacionales e internacionales; no publicar contenido pornográfico, difamatorio, obsceno, ofensivo o ilegal; no publicar contenido violento o que incite al odio; y no realizar actividades que dañen, sobrecarguen o afecten negativamente el sitio, a los talleres o a otros usuarios." },

      { t: "h1", text: "5. Conducta de talleres y prestadores de servicios" },
      { t: "p", text: "Además de las obligaciones del punto anterior, al registrarte como taller o prestador de servicios te comprometes a: no intentar obtener las claves de otros usuarios; no infringir derechos de marca, patente u otra propiedad intelectual de terceros; y no cobrar montos a clientes derivados por VitrinaAutomotriz.cl sin haber acordado previamente, de forma directa y transparente con ese cliente, el presupuesto o las condiciones del servicio." },
      { t: "p", text: "No está permitido publicar en ningún plan contenido que constituya pornografía, ataques de denegación de servicio, intentos de phishing, bots maliciosos, malware, escaneo no autorizado de puertos, spam masivo, ni contenido que infrinja la legislación nacional. El incumplimiento de este punto arriesga la terminación inmediata de la suscripción." },

      { t: "h1", text: "6. Pagos y suscripciones" },
      { t: "h2", text: "6.1. Suscripción del taller a VitrinaAutomotriz.cl" },
      { t: "p", text: "Si contratas un plan pagado con nosotros (publicación destacada, verificación u otros servicios propios de la plataforma), aceptas proporcionar información de pago precisa y completa. Nos reservamos el derecho de rechazar o cancelar suscripciones conforme a un criterio razonable." },
      { t: "h2", text: "6.2. El servicio automotriz no se paga a través de la plataforma" },
      { t: "p", text: "VitrinaAutomotriz.cl no procesa, intermedia ni recibe pagos por los servicios automotrices que el cliente contrata con el taller. Cualquier pago por mantención, reparación u otro servicio se realiza directamente entre el cliente y el taller, bajo su exclusiva responsabilidad." },
      { t: "h2", text: "6.3. Precios y disponibilidad" },
      { t: "p", text: "Los precios y la disponibilidad publicados por los talleres están sujetos a cambios por parte de sus propios dueños. Nos esforzamos por mostrar información precisa, pero no la garantizamos en todo momento. Te recomendamos confirmar directamente con el taller antes de reservar o contratar. Siempre puedes dejar un comentario sobre tu experiencia, buena o mala, con el taller específico." },

      { t: "h1", text: "7. Propiedad intelectual" },
      { t: "p", text: "Todo el contenido de VitrinaAutomotriz.cl —textos, gráficos, logotipos, imágenes y software— está protegido por derecho de autor y demás normativa de propiedad intelectual aplicable. No está permitido duplicar, reproducir, distribuir o modificar este contenido sin autorización expresa." },

      { t: "h1", text: "8. Limitación de responsabilidad" },
      { t: "p", text: "VitrinaAutomotriz.cl se proporciona \"tal cual\", sin garantías de ningún tipo, expresas o implícitas. Reforzando lo señalado en el punto 2:" },
      { t: "strong", text: "NO PRESTAMOS SERVICIOS AUTOMOTRICES DE NINGÚN TIPO — SOLO CONECTAMOS AL CLIENTE CON EL TALLER." },
      { t: "strong", text: "NO ASUMIMOS RESPONSABILIDAD POR LA EJECUCIÓN, CALIDAD, PLAZO, PRECIO NI RESULTADO DE LOS SERVICIOS PRESTADOS POR LOS TALLERES." },
      { t: "strong", text: "NO COMPRE NI ADQUIERA PRODUCTOS O SERVICIOS SIN ACORDAR PREVIAMENTE, DIRECTAMENTE Y POR ESCRITO CON EL TALLER O PRESTADOR DE SERVICIOS." },
      { t: "strong", text: "ASEGURARSE DE QUE EL TALLER O PRESTADOR DE SERVICIOS EXISTE Y ES IDÓNEO ES RESPONSABILIDAD DEL CLIENTE. No asumimos responsabilidad por inscripciones fraudulentas o no existentes, ni por servicios no proporcionados o mal ejecutados por los talleres." },

      { t: "h1", text: "9. Enlaces a terceros" },
      { t: "p", text: "El sitio puede contener enlaces a sitios de terceros, incluidos los propios talleres. No tenemos control sobre su contenido, políticas de privacidad ni prácticas, y no asumimos responsabilidad por ellos. Estos enlaces existen únicamente para darte más referencias sobre el taller o prestador de servicios." },

      { t: "h1", text: "10. Tratamiento de datos personales" },
      { t: "p", text: "Grupo Moller SpA trata los datos personales de los talleres, prestadores de servicios y usuarios registrados en la red conforme a las Leyes N° 19.628 y N° 21.719 sobre protección de datos personales. El detalle completo de qué datos recopilamos, para qué los usamos y cómo puedes ejercer tus derechos está en nuestra Política de Privacidad, parte integrante de estos Términos." },

      { t: "h1", text: "11. Cambios en estos Términos" },
      { t: "p", text: "Nos reservamos el derecho de actualizar estos Términos en cualquier momento. Te notificaremos cambios significativos mediante aviso destacado en el sitio o por correo electrónico. Te recomendamos revisar esta página periódicamente." },

      { t: "h1", text: "12. Contacto" },
      { t: "p", text: "Para preguntas sobre estos Términos, escríbenos a contacto@vitrinaautomotriz.cl, indicando en el asunto \"Consulta Términos de Uso\"." },
    ],
  },
};
