import AsyncStorage from "@react-native-async-storage/async-storage";

const ORGANIZATION_ID_KEY = "organization_key";

export async function setOrganizationIdInStorage(orgId: number) {
  await AsyncStorage.setItem(ORGANIZATION_ID_KEY, orgId.toString());
}

export async function getOrganizationIdInStorage() {
  const orgId = await AsyncStorage.getItem(ORGANIZATION_ID_KEY);
  return orgId !== null ? parseInt(orgId) : null;
}
