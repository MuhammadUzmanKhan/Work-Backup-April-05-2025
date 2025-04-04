const VENDOR_MAPPING = new Map([
  [new RegExp(".*(p|P)elco.*"), "CoramAI"],
  [new RegExp(".*(u|U)niview.*"), "CoramAI"],
]);

// If the vendor matches any of the regexes in VENDOR_MAPPING,
// return the mapped vendor.
export function mapVendor(vendor: string) {
  for (const [regex, mappedVendor] of VENDOR_MAPPING.entries()) {
    if (regex.test(vendor)) {
      return mappedVendor;
    }
  }
  return vendor;
}
