import type { Product } from "../types/catalog";
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

function quotedParts(value: string) {
  const matches = Array.from(value.matchAll(/"([^"]{3,})"/g)).map((match) => match[1].trim());
  return Array.from(new Set(matches));
}

export function cleanSupplierText(value?: string | null) {
  if (!value) return "";
  const parts = quotedParts(value);
  if (parts.length) return parts[0];
  return value
    .replace(/^\[|\]$/g, "")
    .replace(/"/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function productDisplayName(product: Product, language: Language) {
  const source = `${product.name} ${product.short_description ?? ""}`.toLowerCase();
  if (source.includes("notched v-neck") || source.includes("loose midi tunic")) return clothingTitle[language];
  return cleanSupplierText(product.name) || product.name;
}

export function productDisplayDescription(product: Product, language: Language) {
  const source = `${product.name} ${product.short_description ?? ""} ${product.description ?? ""}`.toLowerCase();
  if (source.includes("notched v-neck") || source.includes("loose midi tunic")) return clothingDescription[language];
  const cleaned = cleanSupplierText(product.short_description || product.description);
  if (!cleaned || cleaned.toLowerCase().includes("imported from cj")) return genericDescription[language];
  return cleaned;
}

export function variantDisplayName(index: number, language: Language) {
  if (language === "pt") return `Opcao ${index + 1}`;
  if (language === "es") return `Opcion ${index + 1}`;
  return `Option ${index + 1}`;
}
