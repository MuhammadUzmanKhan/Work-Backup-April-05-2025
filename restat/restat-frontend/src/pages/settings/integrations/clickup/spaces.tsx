import React, { useEffect, useMemo, useState } from 'react';
import { Space } from '../../../../services/types/common';
import './Spaces.scss';
import { Checkbox, CheckboxProps, Select, Typography } from 'antd';

interface SpacesProps {
  type: string;
  isDisabled: boolean;
  spaces?: Space[];
  onChangeHandler?: (spaceData: { id: string; name: string, type: string }) => void;
  isSharedHierarchy: boolean;
  onCheckboxChange: (changedValue: boolean, type: string) => void;
}

const Spaces: React.FC<SpacesProps> = ({
  type,
  spaces,
  isDisabled,
  onChangeHandler,
  onCheckboxChange,
  isSharedHierarchy,
}) => {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | undefined>(undefined);

  const { Title } = Typography

  const handleSpaceChange = (selectedSpaceId: string) => {
    const selectedSpace = spaces?.find(space => space.id === selectedSpaceId);
    if (selectedSpace && onChangeHandler) {
      setSelectedSpaceId(selectedSpace.id);
      onChangeHandler({ id: selectedSpace.id, name: selectedSpace.name, type });
    }
  };

  const handleCheckboxChange: CheckboxProps['onChange'] = (e) => {
    onCheckboxChange(e.target.checked, type);
  };

  useEffect(() => {
    if (spaces && spaces.length > 0) {
      const firstSpace = spaces[0];
      setSelectedSpaceId(firstSpace.id);
    } else {
      setSelectedSpaceId('-1')
    }
  }, [spaces]);

  const options = useMemo(() => spaces?.length ?
    spaces.map(spaces => ({ label: spaces?.name, value: spaces?.id }))
    : [{ label: 'No Space Found', value: '-1' }], [spaces]);


  return (
    <div className="spaces-container">
      <Title style={{ color: '#0056b3' }} level={3}>Select the Space </Title>

      <div className='folder-box'>
        <Select
          showSearch
          placeholder="Select a space"
          optionFilterProp="label"
          value={selectedSpaceId}
          onChange={handleSpaceChange}
          options={options}
          disabled={isDisabled || isSharedHierarchy}
          size='large'
          style={{ minWidth: '280px' }}
        />
        <Checkbox onChange={handleCheckboxChange} checked={isSharedHierarchy}>Go with shared hierarchy</Checkbox>
      </div>
    </div>
  );
}

export default Spaces;
