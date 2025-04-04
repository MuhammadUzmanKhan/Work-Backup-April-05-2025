import React, { useEffect, useMemo, useState } from 'react';
import './Spaces.scss';
import { Space } from '../../../../services/types/common';
import { Select, Typography } from 'antd';

interface ListProps {
  type: string;
  isDisabled: boolean;
  lists?: Space[];
  onChangeHandler?: (selectedListId: string, selectedListName: string, selectedIndex: number, type: string) => void;
}

const List: React.FC<ListProps> = ({ type, isDisabled, lists, onChangeHandler }) => {
  const [selectedListIdState, setSelectedListIdState] = useState<string | undefined>(undefined);

  const { Title } = Typography

  const handleListChange = (selectedListIdValue: string) => {
    const selectedList = lists?.find(list => list.id === selectedListIdValue);
    const selectedIndex = lists?.findIndex(list => list.id === selectedListIdValue) || 1;
    const selectedListName = selectedList?.name || ''
    if (onChangeHandler) {
      setSelectedListIdState(selectedListIdValue);
      onChangeHandler(selectedListIdValue, selectedListName, selectedIndex, type);
    }
  };

  useEffect(() => {
    if (lists && lists.length > 0) {
      const firstList = lists[0];
      setSelectedListIdState(firstList.id);
    } else {
      setSelectedListIdState('-1')
    }
  }, [lists]);

  const options = useMemo(() => lists?.length ?
    lists.map(list => ({ label: list?.name, value: list?.id }))
    : [{ label: 'No List Found', value: '-1' }], [lists]);

  return (
    <div className="list-container">
      <Title style={{ color: '#0056b3' }} level={3}>Select the List </Title>
      <Select
        showSearch
        placeholder="Select a workspace"
        optionFilterProp="label"
        value={selectedListIdState}
        onChange={handleListChange}
        options={options}
        disabled={isDisabled}
        size='large'
        style={{ minWidth: '280px' }}
      />
    </div>
  );
}

export default List;
