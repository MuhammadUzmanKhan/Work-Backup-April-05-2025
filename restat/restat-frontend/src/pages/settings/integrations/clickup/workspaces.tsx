import React, { useState, useEffect, useMemo } from 'react';
import { Space } from '../../../../services/types/common';
import './Spaces.scss';
import { Select, Typography } from 'antd';

interface WorkspaceProps {
  type: string;
  workspaces: Space[];
  isDisabled: boolean;
  onChangeHandler: (workspaceData: { id: any; name: string, type: string }) => void;
}

const Workspace: React.FC<WorkspaceProps> = ({ type, workspaces, isDisabled, onChangeHandler }) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>(undefined);

  const { Title } = Typography

  const handleWorkspaceChange = (selectedWorkspaceId: string) => {
    const selectedWorkspace = workspaces.find(workspace => workspace.id === selectedWorkspaceId);
    if (selectedWorkspace) {
      setSelectedWorkspaceId(selectedWorkspace.id);
      onChangeHandler({ id: selectedWorkspace.id, name: selectedWorkspace.name, type });
    }
  };

  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      const firstWorkspace = workspaces[0];
      setSelectedWorkspaceId(firstWorkspace.id);
    }
  }, [workspaces]);

  const options = useMemo(() => workspaces?.length ?
    workspaces.map(workspace => ({ label: workspace?.name, value: workspace?.id }))
    : undefined, [workspaces]);

  return (
    <div className="spaces-container">
      <Title style={{ color: '#0056b3' }} level={3}>Select the Workspace </Title>
      <Select
        showSearch
        placeholder="Select a workspace"
        optionFilterProp="label"
        value={selectedWorkspaceId}
        onChange={handleWorkspaceChange}
        options={options}
        disabled={isDisabled}
        size='large'
        style={{ minWidth: '280px' }}
      />
    </div>
  );
}

export default Workspace;
