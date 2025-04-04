import React, { useEffect, useMemo, useState } from 'react';
import './Spaces.scss';
import { ClickUpStatus } from '../../../../services/types/common';
import { Select, Typography } from 'antd';

interface StatusProps {
  type: string;
  isDisabled: boolean;
  status?: ClickUpStatus[];
  onChangeHandler?: (selectedStatusId: string, selectedStatus: string, type: string) => void;
}

const Status: React.FC<StatusProps> = ({ isDisabled, status, onChangeHandler, type }) => {
  const [selectedStatusId, setSelectedStatusId] = useState<string | undefined>(undefined);

  const { Title } = Typography

  const handleChangeStatus = (selectedStatusId: string) => {

    const selectedStatus = status?.find(status => status.id === selectedStatusId)?.status || ''
    if (onChangeHandler) {
      setSelectedStatusId(selectedStatusId)
      onChangeHandler(selectedStatusId, selectedStatus, type);
    }
  };

  useEffect(() => {
    if (status && status.length > 0) {
      const firstStatus = status[0];
      setSelectedStatusId(firstStatus.id);
    } else {
      setSelectedStatusId('-1')
    }
  }, [status]);

  const options = useMemo(() => status?.length ?
    status.map(list => ({ label: list?.status, value: list?.id }))
    : [{ label: 'No Status Found', value: '-1' }], [status]);

  return (
    <div className="list-container">
      <Title style={{ color: '#0056b3' }} level={3}>Select the Status </Title>
      <Select
        showSearch
        placeholder="Select a workspace"
        optionFilterProp="label"
        value={selectedStatusId}
        onChange={handleChangeStatus}
        options={options}
        disabled={isDisabled}
        size='large'
        style={{ minWidth: '280px' }}
      />
    </div>
  );
}

export default Status;
