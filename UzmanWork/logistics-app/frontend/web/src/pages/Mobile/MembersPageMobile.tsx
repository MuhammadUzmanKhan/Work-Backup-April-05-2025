import { Box, Stack } from "@mui/material";
import { MemberAddMobile } from "../../components/settings/mobile/MembersAddMobile";
import { MemberListMobile } from "../../components/settings/mobile/MemberListMobile";
import { useMembersMutate, useOrgMembers } from "hooks/members";

export function MembersPageMobile() {
  const {
    data: allMembersList,
    refetch: refetchMembers,
    isLoading: isLoadingMembers,
  } = useOrgMembers();

  const {
    filteredMembers: membersList,
    handleMemberRemove,
    handleMemberAdd,
    handleMemberRoleEdit,
    isSubmitLoading,
  } = useMembersMutate(allMembersList, refetchMembers);

  return (
    <Box width="100vw">
      <Stack px={2.5} spacing={4}>
        <MemberAddMobile
          isSubmitLoading={isSubmitLoading}
          handleMemberAdd={handleMemberAdd}
        />
        <MemberListMobile
          members={membersList}
          handleMemberRemove={handleMemberRemove}
          handleMemberRoleEdit={handleMemberRoleEdit}
          refetchMembers={refetchMembers}
          isLoadingMembers={isLoadingMembers}
        />
      </Stack>
    </Box>
  );
}
