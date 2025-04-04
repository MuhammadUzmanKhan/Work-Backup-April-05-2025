import { defineFixture } from 'efate';
import { DotMapVendor } from '../models';

export const dotMapVendorFixture = defineFixture<DotMapVendor>((t) => ({
  id: t.id.asNumber(),
  name: t.name.asString(),
  cell: t.cell.asString(),
  email: t.email.asString(),
  country_code: t.country_code.asString(),
  country_iso_code: t.country_iso_code.asString(),
  color: t.color.asString(),

  company_id: t.company_id.asNumber(),
  company: undefined,

  dots: [],
}));
