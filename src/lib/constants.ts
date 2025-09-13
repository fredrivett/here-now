// Activity threshold - used for both heartbeat interval and "now" window
export const ACTIVITY_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Domain whitelist - configurable via environment variable
function getAllowedDomains(): string[] {
  const envDomains = process.env.ALLOWED_DOMAINS;
  if (envDomains) {
    return envDomains.split(',').map(d => d.trim());
  }
  
  // Default domains for development
  return ["localhost"];
}

export const ALLOWED_DOMAINS = getAllowedDomains();

export function isDomainAllowed(domain: string): boolean {
  // Check exact match first
  if (ALLOWED_DOMAINS.includes(domain)) {
    return true;
  }

  // Check if domain starts with 'www.' and the non-www version is allowed
  if (domain.startsWith("www.")) {
    const nonWwwDomain = domain.substring(4);
    return ALLOWED_DOMAINS.includes(nonWwwDomain);
  }

  return false;
}

// JavaScript version for the widget (same logic, no TypeScript)
export function getDomainCheckJS(): string {
  return `
  function isDomainAllowed(domain) {
    const ALLOWED_DOMAINS = [${ALLOWED_DOMAINS.map((d) => `'${d}'`).join(", ")}];
    
    // Check exact match first
    if (ALLOWED_DOMAINS.includes(domain)) {
      return true;
    }
    
    // Check if domain starts with 'www.' and the non-www version is allowed
    if (domain.startsWith('www.')) {
      const nonWwwDomain = domain.substring(4);
      return ALLOWED_DOMAINS.includes(nonWwwDomain);
    }
    
    return false;
  }`;
}
