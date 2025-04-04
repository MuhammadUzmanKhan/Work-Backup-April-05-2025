import type { MuiTelInputProps } from "mui-tel-input";
import { MuiTelInput } from "mui-tel-input";
import { isDefined } from "coram-common-utils";
import isMobilePhone from "validator/lib/isMobilePhone";

export function phoneIsInvalid(phoneNumber: string | undefined) {
  return (
    isDefined(phoneNumber) &&
    phoneNumber.length > 0 &&
    !isMobilePhone(phoneNumber.replace(/\s/g, ""), "any", {
      strictMode: true,
    })
  );
}

export function PhoneNumberTextField(props: MuiTelInputProps) {
  return (
    <MuiTelInput
      {...props}
      error={phoneIsInvalid(props.value)}
      helperText={
        phoneIsInvalid(props.value) ? "Enter a valid phone number." : ""
      }
      preferredCountries={["US", "CA"]}
      defaultCountry="US"
    />
  );
}
