// Campos de destino no HighLevel para o mapeamento de campos.
export const GHL_FIELDS = [
  { value: "", label: "— não mapear —" },
  { value: "companyName", label: "Nome da empresa" },
  { value: "firstName", label: "Primeiro nome" },
  { value: "lastName", label: "Sobrenome" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telefone" },
  { value: "address1", label: "Endereço" },
  { value: "city", label: "Cidade" },
  { value: "state", label: "Estado" },
  { value: "website", label: "Site (custom)" },
  { value: "gbp_url", label: "GBP (custom)" },
  { value: "instagram", label: "Instagram (custom)" },
  { value: "facebook", label: "Facebook (custom)" },
  { value: "niche", label: "Nicho (custom)" },
];

// Campos de lead da prospecção (fonte).
export const SOURCE_FIELDS = [
  { key: "businessName", label: "Nome da empresa" },
  { key: "niche", label: "Nicho" },
  { key: "contactName", label: "Nome do contato" },
  { key: "contactEmail", label: "Email de contato" },
  { key: "contactPhone", label: "Telefone de contato" },
  { key: "websiteUrl", label: "URL do site" },
  { key: "gbpUrl", label: "URL do Google Business" },
  { key: "instagramUrl", label: "URL Instagram" },
  { key: "facebookUrl", label: "URL Facebook" },
  { key: "address", label: "Endereço" },
  { key: "city", label: "Cidade" },
  { key: "state", label: "Estado/UF" },
] as const;
