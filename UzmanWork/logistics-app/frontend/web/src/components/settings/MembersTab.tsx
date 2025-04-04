import { Link, Stack, Typography } from "@mui/material";
import { MemberAdd } from "./MemberAdd";
import { MemberList } from "./MemberList";
import { useMembersMutate, useOrgMembers } from "hooks/members";

export function MembersTab() {
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
    <Stack padding={3}>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography variant="h2">Members</Typography>
        <Link
          href="https://help.coram.ai/en/articles/8905108-role-based-access-control-rbac"
          target="_blank"
        >
          Access Control Documentation
        </Link>
      </Stack>
      <MemberAdd
        isSubmitLoading={isSubmitLoading}
        handleMemberAdd={handleMemberAdd}
      />
      <MemberList
        members={membersList}
        handleMemberRemove={handleMemberRemove}
        handleMemberRoleEdit={handleMemberRoleEdit}
        isLoadingMembers={isLoadingMembers}
        refetchMembers={refetchMembers}
      />
    </Stack>
  );
}
