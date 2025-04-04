import React, { useEffect, useMemo, useState } from 'react';
import { Folders } from '../../../../services/types/common';
import './Spaces.scss';
import { Checkbox, CheckboxProps, Select, Typography } from 'antd';

interface FolderProps {
  type: string;
  isDisabled: boolean;
  isFolderless: boolean;
  folders?: Folders[];
  onChangeHandler?: (selectedFolderId: string, selectedFolderName: string, selectedIndex: number, type: string) => void;
  isFolderlessList: boolean;
  onCheckboxChange: (changedValue: boolean, type: string) => void;
}

const Folder: React.FC<FolderProps> = ({ type, isDisabled, isFolderless, folders, onChangeHandler, isFolderlessList, onCheckboxChange }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);

  const { Title } = Typography

  const handleFolderChange = (selectedFolderIdVaue: string) => {
    const selectedFolder = folders?.find(folder => folder.id === selectedFolderIdVaue);
    const selectedIndex = folders?.findIndex(folder => folder.id === selectedFolderIdVaue) || 0;
    const selectedFolderName = selectedFolder?.name || ''
    if (onChangeHandler) {
      setSelectedFolderId(selectedFolderIdVaue);
      onChangeHandler(selectedFolderIdVaue, selectedFolderName, selectedIndex, type);
    }
  };

  const handleCheckboxChange: CheckboxProps['onChange'] = (e) => {
    onCheckboxChange(e.target.checked, type);
  };


  useEffect(() => {
    if (folders && folders.length > 0) {
      const firstFolder = folders[0];
      setSelectedFolderId(firstFolder.id);
    } else {
      setSelectedFolderId('-1')
    }
  }, [folders]);

  const options = useMemo(() => folders?.length ?
    folders.map(folder => ({ label: folder?.name, value: folder?.id }))
    : [{ label: 'No Folder Found', value: '-1' }], [folders]);


  return (
    <>
      <div className="folder-container">
        <Title style={{ color: '#0056b3' }} level={3}>Select the Folder </Title>

        <div className='folder-box'>
          <Select
            showSearch
            placeholder="Select a folder"
            optionFilterProp="label"
            value={selectedFolderId}
            onChange={handleFolderChange}
            options={options}
            disabled={isDisabled || isFolderless}
            size='large'
            style={{ minWidth: '280px' }}
          />
          <Checkbox onChange={handleCheckboxChange} checked={isFolderlessList} value={isFolderlessList}>Go with folderless list</Checkbox>
        </div>
      </div>
    </>
  );
}

export default Folder;
