import {
  MembersService,
  SubscriberAlertType,
  useOrganizationContext,
} from "coram-common-utils";
import { useAlertSubscribers } from "utils/globals";

export function useNotificationsSubscriptionHandle() {
  const { organization } = useOrganizationContext();
  const { data: alertSubscribers, refetch: refetchSubscribers } =
    useAlertSubscribers(organization?.tenant);

  const isTargetSubscribed = (target?: string) =>
    target !== undefined &&
    alertSubscribers
      .map((subscriber) => subscriber.alert_target)
      .includes(target);

  async function addSubscriptionTarget(
    targetType: SubscriberAlertType,
    target?: string
  ) {
    if (!target) return;
    try {
      await MembersService.addOrganizationAlertSubscriber({
        alert_target: target,
        alert_type: targetType,
      });
    } catch (error) {
      console.error(error);
    } finally {
      refetchSubscribers();
    }
  }

  async function removeSubscriptionTarget(
    targetType: SubscriberAlertType,
    target?: string
  ) {
    if (!target) return;
    try {
      await MembersService.removeOrganizationAlertSubscriber({
        alert_target: target,
        alert_type: targetType,
      });
    } catch (error) {
      console.error(error);
    } finally {
      refetchSubscribers();
    }
  }

  return {
    isTargetSubscribed,
    addSubscriptionTarget,
    removeSubscriptionTarget,
  };
}
