// import {readFileSync} from 'fs'

import {PublicSuffixDataList} from "./public_suffix_list";

const domainRegexp = new RegExp("^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$");

export const isValidDomainSyntax = (candidate: string): boolean => domainRegexp.test(candidate);

export const isValidDomainOrWildcardDomain = (candidate: string): boolean =>
  // Is valid wildcard domain
  ( candidate.startsWith("*.") && isValidDomainSyntax(candidate.substr(2)) ) ||
  // Is valid non-wildcard domain
  ( isValidDomainSyntax(candidate) );

export const removeWildcardPrefixIfPresent = (s: string): string => {
  return s.startsWith("*.") ? s.substr(2) : s;
}

export const extractDomainIfWebUrl = (candidateUrl: string): string | undefined => {
  try {
    const {protocol, host} = new URL(candidateUrl);
    if ((protocol === "http:" || protocol === "https:") &&
        isValidDomainOrWildcardDomain(host))
      return host;
  } catch {
    // Return undefined if not a valid URL
  }
  return;
}

export const isWebUrl = (candidate: string): boolean =>
  !!extractDomainIfWebUrl(candidate);


type LabelMap = {[domain: string]: LabelMap} & {isTerminalNode?: boolean};
/**
 * We will turn the public domain suffix list into a tree with the
 * root node containing the TLDs and each child node containing subdomains
 * of the node.
 * 
 * Thus, we can walk down the tree for api.dicekeys.com by walking
 * the tree topLevelDomainLabelMap["com"] to find a node with no child
 * "dicekeys" and conclude that "com" is the public domain suffix and
 * "dicekeys.com" is a registered domain.
 */
const topLevelDomainLabelMap: LabelMap = {};

/**
 * Build the tree from the public_suffix_list from
 * https://publicsuffix.org/list/public_suffix_list.dat
 * which we cache in the code base so that we don't have to perform online queries.
 */
// const publicSuffixListDataContents = readFileSync(__dirname + "/public_suffix_list.dat.txt", "utf-8");
PublicSuffixDataList.split("\n").forEach( rawLine => {
  // We may need to strip ine feeds
  const line = rawLine.trim();
  // Ignore empty lines or comments (which start //, but / is enough to be sure it's a comment)
  if (line.length == 0 || line[0] === "/") {
    return;
  }
  // Turn the domain name into an array of labels from top to bottom (e.g. ["com", "dicekeys", "api"])
  const labelsFromTopToBottom = line.split(".").reverse();
  // Populate the tree as necessary and walk down to the end of the public suffix
  var labelMap = topLevelDomainLabelMap;
  for (const label of labelsFromTopToBottom) {
    if (!(label in labelMap)) {{
      labelMap[label] = {};
    }}
    labelMap = labelMap[label];
  }
  // Mark the end of this suffix as a valid terminal node.
  // So, if we have a public suffix of e.d.c.b.a, we will know
  // that d.c.b.a itself is not a public suffix unless it has its
  // own entry.
  labelMap.isTerminalNode = true;
})

/**
 * Determine the maximum number of labels at the suffix of a domain
 * that match a public suffix.
 * 
 * @param domain A domain name
 */
export const getDepthOfPublicSuffix = (domain: string): number => {
  const labelsFromTopToBottom = domain.split(".").reverse();
  var depth = 0;
  var depthOfPublicSuffix = 0;
  var labelMap: LabelMap | undefined = topLevelDomainLabelMap;
  while (depth < labelsFromTopToBottom.length && labelMap != null) {
    if (labelMap.isTerminalNode) {
      depthOfPublicSuffix = depth;
    }
    labelMap = labelMap[labelsFromTopToBottom[depth++]];
  }
  return depthOfPublicSuffix;
}

/**
 * Given a string that may be an HTTP(s) URL or a domain name
 * extract the domain name if it is a URL or just return it if
 * it is not a URL.
 * 
 * @param domainOrUrl A domain name or an HTTP(s) URL.
 */
export const getDomainFromDomainOrUrlString = (domainOrUrl: string): string | undefined => {
  if (domainOrUrl.startsWith("*.")) {
    domainOrUrl = domainOrUrl.substr(2);
  }
  try {
    const {protocol, host} = new URL(domainOrUrl.indexOf(":") != -1 ? domainOrUrl : `https://${domainOrUrl}/`);
    if (
        (protocol === "http:" || protocol === "https:" || protocol === "mailto:") &&
        getDepthOfPublicSuffix(host) > 0  
      ) {
      return isValidDomainSyntax(host) ? host : undefined;

    }
  } catch {}
  return undefined;
}

export const getRegisteredDomainFromValidNonwildcardDomain = (domain: string): string => {
  const labels = domain.split(".");
  const depthOfPublicSuffix = getDepthOfPublicSuffix(domain);
  // The registered domain will have one label in addition to the public suffix
  // of the registry.  Hence, for the public suffix of "com" with 1 label,
  // "dicekeys.com", the registered domain, will ha ve 2 labels.
  const depthOfRegisteredSuffix = Math.min(depthOfPublicSuffix + 1, labels.length);
  // create the registered domain by joining the labels to the correct depth.
  return labels.slice(labels.length - depthOfRegisteredSuffix, labels.length).join(".");
}

/**
 * Given a string that may be an HTTP(s) URL, return a wildcard
 * of the registered hostname.  If the string is not a valid
 * web URL, return undefined.
 * 
 * For example, https://vault.bitwarden.com/stuff is a URL with a host
 * that is a subdomain of bitwarden.com, and Bitwarden is the domain
 * registered with the .com registry.  Therefore, this function
 * would return "*.bitwarden.com".
 * 
 * @param domainOrUrl A domain name or an HTTP(s) URL.
 */
export const getWildcardOfRegisteredDomainFromCandidateWebUrl = (candidateUrl: string): string | undefined => {
  const domain = extractDomainIfWebUrl(candidateUrl);
  return domain == null ?
    // This was not a web URL with a valid domain
    undefined :
    // Return the domain with prefixed with '*.' to indicate it's a wildcard
    `*.${getRegisteredDomainFromValidNonwildcardDomain(domain)}`
}

