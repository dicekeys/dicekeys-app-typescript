// import {readFileSync} from 'fs'

import publicSuffixListDataContents from "./public_suffix_list.dat.txt";

const domainRegexp = new RegExp("(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]");
const isValidDomain = (candidate: string): boolean => domainRegexp.test(candidate);

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
publicSuffixListDataContents.split("\n").forEach( rawLine => {
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
const getDepthOfPublicSuffix = (domain: string): number => {
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
export const getDomainFromDomainOrUrlString = (domainOrUrl: string): string => {
  try {
    const {protocol, host} = new URL(domainOrUrl);
    if (protocol === "http:" || protocol === "https:") {
      return host;
    }
  } catch {
  }
  return isValidDomain(domainOrUrl) ? domainOrUrl : "";
}

/**
 * Given a HTTP(s) URL or domain name, find the shortest domain suffix
 * that should be registered a registry. This is expected to be the domain
 * registered by the owner of the URL/domain with a registry, and therefore
 * one that represents the scope of the domain space that belongs to the
 * business which registered the domain.
 * 
 * For example, vault.bitwarden.com is a subdomain of bitwarden.com,
 * which Bitwarden registered with the .com registry.  Therefore,
 * it's registered domain is "bitwarden.com", the shortest suffix
 * registered with the registrar.
 * 
 * @param domainOrUrl A domain name or an HTTP(s) URL.
 */
export const getRegisteredDomain = (domainOrUrl: string): string => {
  const domain = getDomainFromDomainOrUrlString(domainOrUrl);
  const labels = domain.split(".");
  const depthOfPublicSuffix = getDepthOfPublicSuffix(domain);
  // The registered domain will have one label in addition to the public suffix
  // of the registry.  Hence, for the public suffix of "com" with 1 label,
  // "dicekeys.com", the registered domain, will ha ve 2 labels.
  const depthOfRegisteredSuffix = Math.min(depthOfPublicSuffix + 1, labels.length);
  return labels.slice(labels.length - depthOfRegisteredSuffix, labels.length).join(".");
}