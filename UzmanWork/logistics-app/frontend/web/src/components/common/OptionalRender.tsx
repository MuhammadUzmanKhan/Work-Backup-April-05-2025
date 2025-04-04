import { FeatureFlags, MountIf } from "coram-common-utils";
import { useFeatureEnabled } from "utils/globals";

export function MountIfFeatureEnabled({
  feature,
  children,
}: {
  feature: FeatureFlags;
  children: React.ReactNode;
}) {
  const isEnabled = useFeatureEnabled(feature);
  return <MountIf condition={isEnabled}>{children}</MountIf>;
}
