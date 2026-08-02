import type { Product, ProductVariant } from "../types/catalog";
import type { Language } from "./i18n";

const clothingTitle: Record<Language, string> = {
  en: "Loose V-neck midi tunic dress with decorative buttons",
  pt: "Vestido midi solto com decote V e botoes decorativos",
  es: "Vestido tunica midi suelto con cuello V y botones decorativos",
};

const clothingDescription: Record<Language, string> = {
  en: "Lightweight midi tunic dress with a relaxed fit, V-neckline, front pleats and decorative wooden buttons. A practical resort-style piece for casual days, warm weather and travel looks.",
  pt: "Vestido midi leve em estilo tunica, com modelagem solta, decote V, pregas frontais e botoes decorativos de madeira. Uma peca versatil para dias quentes, viagens e looks casuais.",
  es: "Vestido tunica midi ligero, con corte suelto, cuello V, pliegues frontales y botones decorativos de madera. Una prenda versatil para dias calidos, viajes y looks casuales.",
};

const genericDescription: Record<Language, string> = {
  en: "Product imported from the supplier catalog and prepared for secure checkout with real delivery calculation by destination.",
  pt: "Produto importado do catalogo do fornecedor e preparado para compra segura com calculo real de entrega por destino.",
  es: "Producto importado del catalogo del proveedor y preparado para compra segura con calculo real de entrega por destino.",
};

const titleRules: Array<{ match: RegExp; title: Record<Language, string> }> = [
  {
    match: /solid color flat|walking shoes|comfortable all-match|casual lightweight|flat sneaker|单鞋|鞋/i,
    title: {
      en: "Lightweight casual flat shoes",
      pt: "Sapatilha casual leve",
      es: "Zapatos planos casuales ligeros",
    },
  },
  { match: /notched v-neck|loose midi tunic|decorative wooden buttons/i, title: clothingTitle },
  {
    match: /sleeveless mini skirt|black sleeveless|迷你裙|礼服|vestido/i,
    title: {
      en: "Black sleeveless mini dress",
      pt: "Vestido curto preto sem mangas",
      es: "Vestido corto negro sin mangas",
    },
  },
  {
    match: /连衣裙|吊带|度假风|印花|fabric name|skirt length|bust|cotton blended|summer.*dress|printed.*dress/i,
    title: {
      en: "Printed summer dress with thin straps",
      pt: "Vestido estampado de verao com alcas finas",
      es: "Vestido estampado de verano con tirantes finos",
    },
  },
  {
    match: /seat\s*belt|safety\s*belt|belt\s*adjuster/i,
    title: {
      en: "Seat belt comfort adjuster",
      pt: "Ajustador de conforto para cinto de seguranca",
      es: "Ajustador de comodidad para cinturon de seguridad",
    },
  },
  {
    match: /portable car vacuum|car vacuum|mini vacuum|handheld vacuum/i,
    title: {
      en: "Portable car vacuum cleaner",
      pt: "Aspirador portatil para carro",
      es: "Aspiradora portatil para auto",
    },
  },
  {
    match: /wireless charger|charging pad|magnetic charger/i,
    title: {
      en: "Wireless charging base",
      pt: "Base de carregamento sem fio",
      es: "Base de carga inalambrica",
    },
  },
  {
    match: /neck fan|leafless fan|usb fan/i,
    title: {
      en: "Portable neck fan",
      pt: "Ventilador portatil de pescoco",
      es: "Ventilador portatil de cuello",
    },
  },
  {
    match: /mosquito|repellent/i,
    title: {
      en: "Portable mosquito repellent bracelet",
      pt: "Pulseira repelente de mosquitos",
      es: "Pulsera repelente de mosquitos",
    },
  },
];

const descriptionRules: Array<{ match: RegExp; description: Record<Language, string> }> = [
  {
    match: /solid color flat|walking shoes|comfortable all-match|casual lightweight|flat sneaker|单鞋|鞋/i,
    description: {
      en: "Lightweight casual flat shoes for daily wear, with simple styling and comfortable slip-on design. Choose the correct color and size before adding to cart.",
      pt: "Sapatilha casual leve para uso diario, com visual simples e calce pratico. Escolha a cor e o tamanho correto antes de adicionar ao carrinho.",
      es: "Zapatos planos casuales ligeros para uso diario, con estilo sencillo y diseno practico. Elige el color y la talla correcta antes de agregar al carrito.",
    },
  },
  { match: /notched v-neck|loose midi tunic|decorative wooden buttons/i, description: clothingDescription },
  {
    match: /sleeveless mini skirt|black sleeveless|迷你裙|礼服|vestido/i,
    description: {
      en: "Elegant black sleeveless mini dress with a fitted silhouette for parties, dinners and evening looks. Check the size guide before ordering; Asian sizes can run smaller than US/EU sizes.",
      pt: "Vestido curto preto sem mangas, com modelagem ajustada para festas, jantares e looks noturnos. Confira o tamanho antes de comprar; tamanhos asiaticos podem vestir menor que os padroes BR/EUA/Europa.",
      es: "Vestido corto negro sin mangas, con silueta ajustada para fiestas, cenas y looks de noche. Revisa la talla antes de comprar; las tallas asiaticas pueden ser mas pequenas.",
    },
  },
  {
    match: /连衣裙|吊带|度假风|印花|fabric name|skirt length|bust|cotton blended|summer.*dress|printed.*dress/i,
    description: {
      en: "Light printed summer dress with thin straps and a relaxed vacation style. Check the measurements before ordering; Asian sizes can run smaller than US/EU sizes.",
      pt: "Vestido leve estampado para verao, com alcas finas e estilo casual de ferias. Confira as medidas antes de comprar; tamanhos asiaticos podem vestir menor que os padroes BR/EUA/Europa.",
      es: "Vestido ligero estampado de verano, con tirantes finos y estilo casual de vacaciones. Revisa las medidas antes de comprar; las tallas asiaticas pueden ser mas pequenas.",
    },
  },
  {
    match: /seat\s*belt|safety\s*belt|belt\s*adjuster/i,
    description: {
      en: "Compact accessory designed to reduce seat belt pressure around the neck and shoulder. Easy to attach, practical for daily driving and useful for improving comfort on longer trips.",
      pt: "Acessorio compacto para reduzir a pressao do cinto no pescoco e no ombro. Facil de encaixar, pratico para o dia a dia e util para deixar viagens mais confortaveis.",
      es: "Accesorio compacto para reducir la presion del cinturon en el cuello y el hombro. Facil de instalar, practico para uso diario y util para viajes mas comodos.",
    },
  },
  {
    match: /portable car vacuum|car vacuum|mini vacuum|handheld vacuum/i,
    description: {
      en: "Compact vacuum cleaner for keeping the car interior clean. Useful for dust, crumbs and small debris, with portable handling for quick everyday cleaning.",
      pt: "Aspirador compacto para manter o interior do carro limpo. Ideal para poeira, migalhas e pequenos residuos, com uso portatil para limpezas rapidas no dia a dia.",
      es: "Aspiradora compacta para mantener limpio el interior del auto. Util para polvo, migas y pequenos residuos, con manejo portatil para limpiezas rapidas.",
    },
  },
  {
    match: /wireless charger|charging pad|magnetic charger/i,
    description: {
      en: "Practical wireless charging accessory for compatible devices. Keeps your setup cleaner and makes everyday charging easier at home, work or travel.",
      pt: "Acessorio pratico de carregamento sem fio para dispositivos compativeis. Deixa o ambiente mais organizado e facilita a recarga em casa, no trabalho ou em viagens.",
      es: "Accesorio practico de carga inalambrica para dispositivos compatibles. Mantiene el espacio mas ordenado y facilita la carga diaria.",
    },
  },
  {
    match: /neck fan|leafless fan|usb fan/i,
    description: {
      en: "Portable neck fan with hands-free design for warm days, commuting and outdoor use. Lightweight, rechargeable and practical for personal cooling.",
      pt: "Ventilador portatil de pescoco com uso sem as maos para dias quentes, deslocamentos e areas externas. Leve, recarregavel e pratico para refrescar no dia a dia.",
      es: "Ventilador portatil de cuello con diseno manos libres para dias calidos, traslados y uso exterior. Ligero, recargable y practico.",
    },
  },
];

const phraseTranslations: Record<Language, Array<[RegExp, string]>> = {
  en: [],
  pt: [
    [/product highlights/gi, "Destaques do produto"],
    [/relieve neck (&amp;|&) shoulder chafing/gi, "Reduz atrito no pescoco e no ombro"],
    [/effectively adjusts the angle of the seat belt/gi, "Ajusta o angulo do cinto de seguranca"],
    [/prevent edges from cutting into the neck or rubbing against clothes/gi, "evitando contato incomodo no pescoco ou atrito com a roupa"],
    [/significantly enhancing long-distance driving comfort/gi, "melhorando o conforto em viagens longas"],
    [/control seat belt tension freely/gi, "Controle livre da tensao do cinto"],
    [/tool-free (&amp;|&) instant installation/gi, "Instalacao rapida sem ferramentas"],
    [/features a simple clip-on or slider design/gi, "possui encaixe simples por clipe ou ajuste deslizante"],
    [/fabric name/gi, "Tecido"],
    [/cotton blended/gi, "mistura de algodao"],
    [/main fabric composition/gi, "Composicao principal"],
    [/polyester fiber \(polyester\)/gi, "fibra de poliester"],
    [/the content of the main fabric ingredient/gi, "teor do ingrediente principal"],
    [/skirt length/gi, "Comprimento"],
    [/bust/gi, "Busto"],
    [/asian sizes are 1 to 2 sizes smaller than european and american people/gi, "Tamanhos asiaticos costumam vestir 1 a 2 tamanhos menores que padroes europeus e americanos"],
    [/choose the larger size if your size between two sizes/gi, "Escolha o tamanho maior se estiver entre dois tamanhos"],
    [/please allow 2-3cm differences due to manual measurement/gi, "Pode haver diferenca de 2 a 3 cm por medicao manual"],
    [/please check the size chart carefully before you buy the item/gi, "Confira a tabela de medidas antes da compra"],
    [/imported from cj.*$/gi, ""],
  ],
  es: [
    [/product highlights/gi, "Destacados del producto"],
    [/relieve neck (&amp;|&) shoulder chafing/gi, "Reduce el roce en cuello y hombro"],
    [/imported from cj.*$/gi, ""],
  ],
};

function quotedParts(value: string) {
  const matches = Array.from(value.matchAll(/"([^"]{3,})"/g)).map((match) => match[1].trim());
  return Array.from(new Set(matches));
}

export function cleanSupplierText(value?: string | null) {
  if (!value) return "";
  const parts = quotedParts(value);
  if (parts.length) return parts[0];
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/^\[|\]$/g, "")
    .replace(/"/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsCjk(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

export function presentSupplierName(name?: string | null, description?: string | null, language: Language = "pt") {
  const source = `${name ?? ""} ${description ?? ""}`;
  const rule = titleRules.find((item) => item.match.test(source));
  if (rule) return rule.title[language];
  const cleaned = cleanSupplierText(name);
  if (!cleaned || containsCjk(cleaned)) return genericDescription[language].replace(/^Produto importado do catalogo do fornecedor/i, "Produto importado").replace(/^Product imported from the supplier catalog/i, "Imported product").replace(/^Producto importado del catalogo del proveedor/i, "Producto importado");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function presentSupplierDescription(name?: string | null, description?: string | null, language: Language = "pt") {
  const source = `${name ?? ""} ${description ?? ""}`;
  const rule = descriptionRules.find((item) => item.match.test(source));
  if (rule) return rule.description[language];
  let cleaned = cleanSupplierText(description);
  for (const [pattern, replacement] of phraseTranslations[language]) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.toLowerCase().includes("imported from cj")) return genericDescription[language];
  return cleaned;
}

export function productDisplayName(product: Product, language: Language) {
  return presentSupplierName(product.name, product.short_description || product.description, language) || product.name;
}

export function productDisplayDescription(product: Product, language: Language) {
  return presentSupplierDescription(product.name, product.short_description || product.description, language);
}

export function variantDisplayName(index: number, language: Language) {
  if (language === "pt") return `Opcao ${index + 1}`;
  if (language === "es") return `Opcion ${index + 1}`;
  return `Option ${index + 1}`;
}

export function variantOptionSummary(product: Product, variant: ProductVariant, index: number, language: Language) {
  const options = variantDisplayOptions(product, variant, index, language);
  const entries = Object.entries(options).filter(([, value]) => value);
  if (entries.length) {
    return {
      title: entries.map(([, value]) => value).join(" / "),
      detail: entries.map(([name, value]) => `${name}: ${value}`).join(" - "),
    };
  }
  const imageGroups = Array.from(new Set(product.variants.map((item) => item.image_url).filter(Boolean)));
  const colorIndex = variant.image_url ? imageGroups.indexOf(variant.image_url) : -1;
  const sameImageBefore = product.variants.slice(0, index + 1).filter((item) => item.image_url && item.image_url === variant.image_url).length;
  const title =
    colorIndex >= 0
      ? `${language === "pt" ? "Cor/Imagem" : language === "es" ? "Color/Imagen" : "Color/Image"} ${colorIndex + 1}`
      : variantDisplayName(index, language);
  const detail =
    imageGroups.length > 1
      ? `${language === "pt" ? "Tamanho/variante" : language === "es" ? "Talla/variante" : "Size/variant"} ${sameImageBefore || index + 1}`
      : variant.sku;
  return { title, detail };
}

export function variantDisplayOptions(product: Product, variant: ProductVariant, index: number, language: Language) {
  const saved = variant.selected_options ?? {};
  if (Object.keys(saved).length) return saved;

  const source = `${product.name} ${product.short_description ?? ""} ${product.description ?? ""} ${variant.sku} ${variant.image_url ?? ""}`;
  const sourceLower = source.toLowerCase();
  const labels = {
    color: language === "pt" ? "Cor" : language === "es" ? "Color" : "Color",
    size: language === "pt" ? "Tamanho" : language === "es" ? "Talla" : "Size",
  };
  const options: Record<string, string> = {};
  const colorRules: Array<[RegExp, string]> = [
    [/black|preto|negro/i, language === "pt" ? "Preto" : language === "es" ? "Negro" : "Black"],
    [/white|branco|blanco/i, language === "pt" ? "Branco" : language === "es" ? "Blanco" : "White"],
    [/beige|cream|khaki|caqui/i, language === "pt" ? "Bege" : language === "es" ? "Beige" : "Beige"],
    [/red|wine|vermelho|vino/i, language === "pt" ? "Vermelho" : language === "es" ? "Rojo" : "Red"],
    [/blue|azul/i, language === "pt" ? "Azul" : language === "es" ? "Azul" : "Blue"],
    [/green|verde/i, language === "pt" ? "Verde" : language === "es" ? "Verde" : "Green"],
    [/pink|rosa/i, language === "pt" ? "Rosa" : language === "es" ? "Rosa" : "Pink"],
    [/yellow|amarelo|amarillo/i, language === "pt" ? "Amarelo" : language === "es" ? "Amarillo" : "Yellow"],
    [/orange|laranja|naranja/i, language === "pt" ? "Laranja" : language === "es" ? "Naranja" : "Orange"],
  ];
  const color = colorRules.find(([pattern]) => pattern.test(sourceLower))?.[1];
  if (color) options[labels.color] = color;

  const sizeMatch = source.match(/size(?:\s*information)?\s*:?\s*([XSML0-9,\s/-]{1,40})/i);
  let sizes = sizeMatch?.[1]
    ?.split(/[,/ ]+/)
    .map((item) => item.trim().toUpperCase())
    .filter((item) => /^(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL|\d{2,3})$/.test(item));
  const alphaSizes = sizes?.filter((item) => /[A-Z]/.test(item));
  if (alphaSizes?.length) sizes = alphaSizes;
  if (sizes?.length) options[labels.size] = sizes[index % sizes.length];
  return options;
}
