import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Steps } from "antd";
import { ClickUpList, Folders, Member, SelectedFields, Space } from "../../../../services/types/common";
import { apis, clickupTypes, routes, useLoader } from "../../../../services";
import { customNotification } from '../../../../components';
import CustomFieldsContacts from "./custom-fields-contacts";
import CustomFieldsDeals from "./custom-fields";
import Workspace from "./workspaces";
import Spaces from "./spaces";
import Folder from "./folder";
import List from "./list";
import Status from "./status";
import './index.scss';

interface ClickUpInterface {
  workspaces: Space[];
  space: Space[];
  folders: Folders[];
}

interface selectedData {
  subType: clickupTypes;
  workspaceId: string;
  workspaceName: string;
  isSharedHierarchy: boolean;
  spaceId: string;
  spaceName: string;
  isFolderlessList: boolean;
  folderId: string;
  folderName: string;
  listId: string;
  listName: string;
  status: string;
}

interface CustomFieldsState {
  show: boolean;
  listId: string;
  mappingDone: boolean;
  selectedFields: SelectedFields[]
  members?: Member[]
}

const ClickUp = ({ workspaces, space: initialSpace, folders: initialFolders }: ClickUpInterface) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0)
  const [stepSkip, setStepSkip] = useState<number | null>(null)
  const [space, setSpace] = useState<Space[]>(initialSpace);
  const [folders, setFolders] = useState<Folders[]>(initialFolders);
  const [selectedFolderIndex, setSelectedFolderIndex] = useState<number>(initialFolders?.length ? 0 : -1)
  const [selectedListIndex, setSelectedListIndex] = useState<number>(-1)
  const [isFolderlessList, setIsFolderlessList] = useState<boolean>(false);
  const [isSharedHierarchy, setIsSharedHierarchy] = useState<boolean>(false);
  const [sharedHierarchyLists, setSharedHierarchyLists] = useState<ClickUpList[]>([]);
  const { loading, on, off } = useLoader(true)

  const [selectedDataDeals, setSelectedDataDeals] = useState<selectedData>({
    subType: clickupTypes.DEALS,
    workspaceId: '',
    workspaceName: '',
    isSharedHierarchy: false,
    spaceId: '',
    spaceName: '',
    isFolderlessList: false,
    folderId: '',
    folderName: '',
    listId: '',
    listName: '',
    status: ''
  });

  const [selectedDataContacts, setSelectedDataContacts] = useState<selectedData>({
    subType: clickupTypes.CONTACTS,
    workspaceId: '',
    workspaceName: '',
    isSharedHierarchy: false,
    spaceId: '',
    spaceName: '',
    isFolderlessList: false,
    folderId: '',
    folderName: '',
    listId: '',
    listName: '',
    status: ''
  });

  const [customFieldsDeals, setCustomFieldsDeals] = useState<CustomFieldsState>({
    show: false,
    listId: '',
    mappingDone: false,
    selectedFields: [],
    members: []
  });
  const [customFieldsContacts, setCustomFieldsContacts] = useState<CustomFieldsState>({
    show: false,
    listId: '',
    mappingDone: false,
    selectedFields: [],
    members: []
  });

  const handleBackClick = () => {
    navigate(routes.settings);
  };

  const onWorkspaceChangeHandle = async ({ id, name, type }: { id: string, name: string, type: string }) => {
    setIsFolderlessList(false)
    setIsSharedHierarchy(false)
    if (type === clickupTypes.DEALS) {
      setSelectedDataDeals(prev => ({
        ...prev,
        workspaceId: id,
        workspaceName: name,
        isSharedHierarchy: false,
        spaceId: '',
        spaceName: '',
        isFolderlessList: false,
        folderId: '',
        folderName: '',
        listId: '',
        listName: '',
        status: ''
      }))
    } else {
      setSelectedDataContacts(prev => ({
        ...prev,
        workspaceId: id,
        workspaceName: name,
        isSharedHierarchy: false,
        spaceId: '',
        spaceName: '',
        isFolderlessList: false,
        folderId: '',
        folderName: '',
        listId: '',
        listName: '',
        status: ''
      }))
    }
    updateWorkspace(id, type)
  };

  const updateWorkspace = async (workspaceId: string, type: string) => {
    try {
      on()
      const response = await apis.getClickupSpaces(workspaceId);
      setSpace(response.data?.spaces);
      if (response.data?.spaces?.length) {
        if (type === clickupTypes.DEALS) {
          setSelectedDataDeals(prev => ({ ...prev, spaceId: response.data?.spaces[0]?.id, spaceName: response.data?.spaces[0]?.name }))
        } else {
          setSelectedDataContacts(prev => ({ ...prev, spaceId: response.data?.spaces[0]?.id, spaceName: response.data?.spaces[0]?.name }))
        }
      } else {
        if (type === clickupTypes.DEALS) {
          setSelectedDataDeals(prev => ({ ...prev, spaceId: '', spaceName: '' }))
        } else {
          setSelectedDataContacts(prev => ({ ...prev, spaceId: '', spaceName: '' }))
        }
      }

      setFolders(response.data?.folders)
      if (response.data?.folders?.length) {
        if (type === clickupTypes.DEALS) {
          setSelectedDataDeals(prev => ({ ...prev, folderId: response.data?.folders[0]?.id, folderName: response.data?.folders[0]?.name }))
        } else {
          setSelectedDataContacts(prev => ({ ...prev, folderId: response.data?.folders[0]?.id, folderName: response.data?.folders[0]?.name }))
        }

        if (response.data?.folders[0]?.lists?.length) {
          setSelectedFolderIndex(0)
          if (type === clickupTypes.DEALS) {
            setSelectedDataDeals(prev => ({ ...prev, listId: response.data?.folders[0]?.lists[0]?.id, listName: response.data?.folders[0]?.lists[0]?.name }))
          } else {
            setSelectedDataContacts(prev => ({ ...prev, listId: response.data?.folders[0]?.lists[0]?.id, listName: response.data?.folders[0]?.lists[0]?.name }))
          }

          if (response.data?.folders[0]?.lists[0]?.statuses?.length) {
            setSelectedListIndex(0)
            if (type === clickupTypes.DEALS) {
              setSelectedDataDeals(prev => ({ ...prev, status: response.data?.folders[0]?.lists[0]?.statuses[0]?.status }))
            } else {
              setSelectedDataContacts(prev => ({ ...prev, status: response.data?.folders[0]?.lists[0]?.statuses[0]?.status }))
            }
          } else {
            setSelectedListIndex(-1)
            if (type === clickupTypes.DEALS) {
              setSelectedDataDeals(prev => ({ ...prev, status: '' }))
            } else {
              setSelectedDataContacts(prev => ({ ...prev, status: '' }))
            }
          }
        } else {
          setSelectedFolderIndex(-1)
          if (type === clickupTypes.DEALS) {
            setSelectedDataDeals(prev => ({ ...prev, listId: '', listName: '', status: '' }))
          } else {
            setSelectedDataContacts(prev => ({ ...prev, listId: '', listName: '', status: '' }))
          }
        }
      } else {
        setSelectedFolderIndex(-1)
        if (type === clickupTypes.DEALS) {
          setSelectedDataDeals(prev => ({ ...prev, folderId: '', folderName: '', listId: '', listName: '', status: '' }))
        } else {
          setSelectedDataContacts(prev => ({ ...prev, folderId: '', folderName: '', listId: '', listName: '', status: '' }))
        }
      }
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'Error occurred in updating workspace!')
      console.error(error)
    } finally { off() }
  }

  const onSpaceChangeHandler = async ({ id, name, type }: { id: string, name: string, type: string }) => {
    setIsFolderlessList(false)
    if (type === clickupTypes.DEALS) {
      setSelectedDataDeals(prev => ({ ...prev, spaceId: id, spaceName: name }))
    } else {
      setSelectedDataContacts(prev => ({ ...prev, spaceId: id, spaceName: name }))
    }
    updateSpace(id, type)
  };

  const updateSpace = async (spaceId: string, type: string) => {
    try {
      on()
      const response = await apis.getClickupFolders(spaceId);
      setFolders(response.data)
      if (response.data?.length) {
        if (type === clickupTypes.DEALS) {
          setSelectedDataDeals(prev => ({ ...prev, folderId: response.data[0]?.id, folderName: response.data[0]?.name }))
        } else {
          setSelectedDataContacts(prev => ({ ...prev, folderId: response.data[0]?.id, folderName: response.data[0]?.name }))
        }
        if (response.data[0]?.lists?.length) {
          setSelectedFolderIndex(0)
          if (type === clickupTypes.DEALS) {
            setSelectedDataDeals(prev => ({ ...prev, listId: response.data[0]?.lists[0]?.id, listName: response.data[0]?.lists[0]?.name }))
          } else {
            setSelectedDataContacts(prev => ({ ...prev, listId: response.data[0]?.lists[0]?.id, listName: response.data[0]?.lists[0]?.name }))
          }
          if (response.data[0]?.lists[0]?.statuses?.length) {
            setSelectedListIndex(0)
            if (type === clickupTypes.DEALS) {
              setSelectedDataDeals(prev => ({ ...prev, status: response.data[0]?.lists[0]?.statuses[0]?.status }))
            } else {
              setSelectedDataContacts(prev => ({ ...prev, status: response.data[0]?.lists[0]?.statuses[0]?.status }))
            }
          } else {
            setSelectedListIndex(0)
            if (type === clickupTypes.DEALS) {
              setSelectedDataDeals(prev => ({ ...prev, status: '' }))
            } else {
              setSelectedDataContacts(prev => ({ ...prev, status: '' }))
            }
          }

        } else {
          setSelectedFolderIndex(-1)
          if (type === clickupTypes.DEALS) {
            setSelectedDataDeals(prev => ({ ...prev, listId: '', listName: '', status: '' }))
          } else {
            setSelectedDataContacts(prev => ({ ...prev, listId: '', listName: '', status: '' }))
          }
        }
      } else {
        setSelectedFolderIndex(-1)
        if (type === clickupTypes.DEALS) {
          setSelectedDataDeals(prev => ({ ...prev, folderId: '', folderName: '', listId: '', listName: '', status: '' }))
        } else {
          setSelectedDataContacts(prev => ({ ...prev, folderId: '', folderName: '', listId: '', listName: '', status: '' }))
        }
      }
    } catch (error: any) {
      console.error('Error occurred in updateSpace', error)
      customNotification.error(error?.response?.data?.message || 'Error occurred in updating space!')
    } finally { off() }
  }

  const onFolderChangeHandler = async (id: string, name: string, selectedIndex: number, type: string) => {
    if (type === clickupTypes.DEALS) {
      setSelectedDataDeals(prev => ({ ...prev, folderId: id, folderName: name }))
      setSelectedFolderIndex(selectedIndex)

      if (folders[selectedIndex].lists?.length) {
        setSelectedDataDeals(prev => ({ ...prev, listId: folders[selectedIndex].lists[0]?.id, listName: folders[selectedIndex].lists[0]?.name }))

        if (folders[selectedIndex].lists[0].statuses?.length) {
          setSelectedListIndex(0)
          setSelectedDataDeals(prev => ({ ...prev, status: folders[selectedIndex].lists[0].statuses[0].status }))
        } else {
          setSelectedListIndex(-1)
          setSelectedDataDeals(prev => ({ ...prev, status: '' }))
        }

      } else {
        setSelectedDataDeals(prev => ({ ...prev, listId: '', listName: '', status: '' }))
      }
    } else {
      setSelectedDataContacts(prev => ({ ...prev, folderId: id, folderName: name }))
      setSelectedFolderIndex(selectedIndex)

      if (folders[selectedIndex].lists?.length) {
        setSelectedDataContacts(prev => ({ ...prev, listId: folders[selectedIndex].lists[0]?.id, listName: folders[selectedIndex].lists[0]?.name }))

        if (folders[selectedIndex].lists[0].statuses?.length) {
          setSelectedListIndex(0)
          setSelectedDataContacts(prev => ({ ...prev, status: folders[selectedIndex].lists[0].statuses[0].status }))
        } else {
          setSelectedListIndex(-1)
          setSelectedDataContacts(prev => ({ ...prev, status: '' }))
        }

      } else {
        setSelectedDataContacts(prev => ({ ...prev, listId: '', listName: '', status: '' }))
      }
    }

  };

  const onFolderlessCheckboxChangeHandle = async (checked: boolean, type: string) => {
    try {
      setIsFolderlessList(checked)
      if (type === clickupTypes.DEALS) setSelectedDataDeals(prev => ({ ...prev, isFolderlessList: checked }))
      else if (type === clickupTypes.CONTACTS) setSelectedDataContacts(prev => ({ ...prev, isFolderlessList: checked }))
      if (checked) {

        if (!selectedDataDeals.spaceId && !selectedDataDeals.isSharedHierarchy) {
          return customNotification.error('No space is selected')
        }

        if (selectedDataDeals.isSharedHierarchy) {
          updateSharedHierarchyLists(type)
        } else {
          updateFolderlessList(type)
        }

      } else {
        if (selectedDataDeals.isSharedHierarchy) {
          updateSharedHierarchy(type)
        } else {
          updateSpace(selectedDataDeals.spaceId, clickupTypes.DEALS)
        }
      }
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'An error occurred in Clickup Api.')
      console.error('Error occurred in onFolderlessCheckboxChangeHandle', error);
    }
  }

  const updateSharedHierarchyLists = async (type: string) => {
    try {
      setFolders([
        {
          id: '-1',
          name: 'Folderless List',
          lists: sharedHierarchyLists
        }
      ])

      if (sharedHierarchyLists?.length) {
        setSelectedListIndex(0)
        setSelectedFolderIndex(0)
        type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({
          ...prev,
          folderId: '-1',
          folderName: 'Folderless List',
          listId: sharedHierarchyLists[0]?.id,
          listName: sharedHierarchyLists[0]?.name
        }))
        type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({
          ...prev,
          folderId: '-1',
          folderName: 'Folderless List',
          listId: sharedHierarchyLists[0]?.id,
          listName: sharedHierarchyLists[0]?.name
        }))

        if (sharedHierarchyLists[0]?.statuses?.length) {
          type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({ ...prev, status: sharedHierarchyLists[0]?.statuses[0]?.status }))
          type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({ ...prev, status: sharedHierarchyLists[0]?.statuses[0]?.status }))
        } else {
          type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({ ...prev, status: '' }))
          type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({ ...prev, status: '' }))
        }
      } else {
        setSelectedFolderIndex(-1)
        type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({ ...prev, folderId: '-1', folderName: 'Folderless List', listId: '', listName: '', status: '' }))
        type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({ ...prev, folderId: '-1', folderName: 'Folderless List', listId: '', listName: '', status: '' }))
      }
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'Error occurred in updating shared lists!')
      console.error('Error occurred in updateSharedHierarchyLists', error)
    }
  }

  const updateFolderlessList = async (type: string) => {
    try {
      on()
      const response = await apis.getClickupFolderlessLists(selectedDataDeals.spaceId)
      setFolders([
        {
          id: '-1',
          name: 'Folderless List',
          lists: response.data
        }
      ])

      if (response.data?.length) {
        setSelectedListIndex(0)
        setSelectedFolderIndex(0)
        type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({
          ...prev,
          folderId: '-1',
          folderName: 'Folderless List',
          listId: response.data[0]?.id,
          listName: response.data[0]?.name
        }))
        type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({
          ...prev,
          folderId: '-1',
          folderName: 'Folderless List',
          listId: response.data[0]?.id,
          listName: response.data[0]?.name
        }))

        if (response.data[0]?.statuses?.length) {
          type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({ ...prev, status: response.data[0]?.statuses[0]?.status }))
          type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({ ...prev, status: response.data[0]?.statuses[0]?.status }))
        } else {
          type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({ ...prev, status: '' }))
          type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({ ...prev, status: '' }))
        }
      } else {
        setSelectedFolderIndex(-1)
        type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({ ...prev, folderId: '-1', folderName: 'Folderless', listId: '', listName: '', status: '' }))
        type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({ ...prev, folderId: '-1', folderName: 'Folderless', listId: '', listName: '', status: '' }))
      }
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'Error occurred in folderless list!')
      console.error('Error occurred in updateFolderlessList', error)
    } finally { off() }
  }

  const onSharedHierarchyCheckboxChangeHandle = async (checked: boolean, type: string) => {
    try {
      setIsSharedHierarchy(checked)
      type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({ ...prev, isSharedHierarchy: checked }))
      type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({ ...prev, isSharedHierarchy: checked }))
      if (checked) {
        if (!selectedDataDeals.workspaceId) {
          return customNotification.error('No workspace is selected')
        }

        await updateSharedHierarchy(type)

        if (selectedDataDeals.isFolderlessList) {
          await updateSharedHierarchyLists(type)
        }
      } else {
        updateWorkspace(selectedDataDeals.workspaceId, clickupTypes.DEALS)
      }
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'An error occurred in Clickup Api.')
      console.error('Error occurred in onFolderlessCheckboxChangeHandle', error);
    }
  }

  const updateSharedHierarchy = async (type: string) => {
    try {
      on()
      const response = await apis.getClickupSharedHierarchy(selectedDataDeals.workspaceId)
      setSpace([{
        id: '-1',
        name: 'Shared Hierarchy'
      }])
      setSharedHierarchyLists(response.data?.lists)
      setFolders(response.data.folders)
      if (response.data?.folders?.length) {
        setSelectedFolderIndex(0)
        type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({
          ...prev,
          folderId: response.data?.folders[0]?.id,
          folderName: response.data?.folders[0]?.name,
        }))
        type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({
          ...prev,
          folderId: response.data?.folders[0]?.id,
          folderName: response.data?.folders[0]?.name,
        }))

        if (response.data?.folders[0]?.lists?.length) {
          setSelectedListIndex(0)
          type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({
            ...prev,
            listId: response.data?.folders[0]?.lists[0]?.id,
            listName: response.data?.folders[0]?.lists[0]?.name
          }))
          type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({
            ...prev,
            listId: response.data?.folders[0]?.lists[0]?.id,
            listName: response.data?.folders[0]?.lists[0]?.name
          }))

          if (response.data?.folders[0]?.lists[0]?.statuses?.length) {
            type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({ ...prev, status: response.data?.folders[0]?.lists[0]?.statuses[0]?.status }))
            type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({ ...prev, status: response.data?.folders[0]?.lists[0]?.statuses[0]?.status }))
          } else {
            type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({ ...prev, status: '' }))
            type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({ ...prev, status: '' }))
          }

        } else {
          setSelectedListIndex(-1)
          type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({
            ...prev,
            listId: '',
            listName: ''
          }))
          type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({
            ...prev,
            listId: '',
            listName: ''
          }))
        }
      } else {
        setSelectedFolderIndex(-1)
        setSelectedListIndex(-1)
        type === clickupTypes.DEALS && setSelectedDataDeals(prev => ({ ...prev, folderId: '', folderName: '', listId: '', listName: '', status: '' }))
        type === clickupTypes.CONTACTS && setSelectedDataContacts(prev => ({ ...prev, folderId: '', folderName: '', listId: '', listName: '', status: '' }))
      }
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'Error occurred in shared hierarchy!')
      console.error('Error occurred in updateSharedHierarchy', error)
    } finally { off() }
  }

  const onListChangeHandler = async (id: string, name: string, selectedIndex: number, type: string) => {
    if (type === clickupTypes.DEALS) {
      setSelectedDataDeals(prev => ({ ...prev, listId: id, listName: name }))
      setSelectedListIndex(selectedIndex)
      if (folders[selectedFolderIndex]?.lists[selectedIndex]?.statuses?.length) {
        setSelectedDataDeals(prev => ({ ...prev, status: folders[selectedFolderIndex]?.lists[selectedIndex]?.statuses[0].status }))
      }
    } else {
      setSelectedDataContacts(prev => ({ ...prev, listId: id, listName: name }))
      setSelectedListIndex(selectedIndex)
      if (folders[selectedFolderIndex]?.lists[selectedIndex]?.statuses?.length) {
        setSelectedDataContacts(prev => ({ ...prev, status: folders[selectedFolderIndex]?.lists[selectedIndex]?.statuses[0].status }))
      }
    }
  };

  const onStatusChangeHandler = async (_: string, name: string) => {
    if (selectedDataDeals.subType === clickupTypes.DEALS) {
      setSelectedDataDeals(prev => ({ ...prev, status: name }))
    } else {
      setSelectedDataContacts(prev => ({ ...prev, status: name }))
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      on()
      const profiles = customFieldsDeals.selectedFields
        .filter(field => field.type === 'upwork_profile')
        .map(field => ({ profileId: field.key, name: field.customFieldName, ...customFieldsDeals.members?.find(member => member.id === +field.value!) }))
        .filter(field => field.id)
      const customFieldsSelected = customFieldsDeals.selectedFields.filter(field => field.type !== 'upwork_profile')

      const profilesContacts = customFieldsContacts.selectedFields
        .filter(field => field.type === 'upwork_profile')
        .map(field => ({ profileId: field.key, name: field.customFieldName, ...customFieldsContacts.members?.find(member => member.id === +field.value!) }))
        .filter(field => field.id)
      const customFieldsSelectedContacts = customFieldsContacts.selectedFields.filter(field => field.type !== 'upwork_profile')

      profiles.length && await apis.saveUpworkClickupProfile({ profiles })
      await apis.saveClickupFieldsMapping({ customFields: customFieldsSelected, subType: clickupTypes.DEALS })

      profilesContacts.length && await apis.saveUpworkClickupProfile({ profiles: profilesContacts })

      await apis.saveClickupFieldsMapping({ customFields: customFieldsSelectedContacts, subType: clickupTypes.CONTACTS })

      let responseDeals, responseContacts;
      if (stepSkip === null) {
        responseDeals = await apis.saveClickupConfigurations(selectedDataDeals);
        responseContacts = await apis.saveClickupConfigurations(selectedDataContacts);
      } else if (stepSkip === 0) {
        responseContacts = await apis.saveClickupConfigurations(selectedDataContacts);
      } else if (stepSkip === 2) {
        responseDeals = await apis.saveClickupConfigurations(selectedDataDeals);
      }

      if (responseDeals?.status === 201 || responseContacts?.status === 201) {
        customNotification.success('Configurations saved for ClickUp')
        navigate(routes.settings)
      }

    } catch (error: any) {
      console.error('An Error Occurred.', error)
      customNotification.error(error?.response?.data?.message || 'An Error Occurred In ClickUp. Please try again later!')
    } finally { off() }
  }

  const handleSkip = () => {
    setStepSkip(step)
    setStep(step === 0 ? 2 : 4)

    if (stepSkip === 0) {
      setSelectedDataDeals({
        subType: clickupTypes.DEALS,
        workspaceId: '',
        workspaceName: '',
        isSharedHierarchy: false,
        spaceId: '',
        spaceName: '',
        isFolderlessList: false,
        folderId: '',
        folderName: '',
        listId: '',
        listName: '',
        status: ''
      })
      setCustomFieldsDeals({ show: false, listId: '', mappingDone: false, selectedFields: [] })
    } else if (stepSkip === 2) {
      setSelectedDataContacts({
        subType: clickupTypes.CONTACTS,
        workspaceId: '',
        workspaceName: '',
        isSharedHierarchy: false,
        spaceId: '',
        spaceName: '',
        isFolderlessList: false,
        folderId: '',
        folderName: '',
        listId: '',
        listName: '',
        status: ''
      })
      setCustomFieldsContacts({ show: false, listId: '', mappingDone: false, selectedFields: [] })
    }
  }

  useEffect(() => {
    if (workspaces.length) {
      setSelectedDataDeals(prev => ({ ...prev, workspaceId: workspaces[0].id, workspaceName: workspaces[0].name }))
      setSelectedDataContacts(prev => ({ ...prev, workspaceId: workspaces[0].id, workspaceName: workspaces[0].name }))
    }
    workspaces.length && off()
  }, [workspaces]);

  useEffect(() => {
    setSpace(initialSpace);
    if (initialSpace.length) {
      setSelectedDataDeals(prev => ({ ...prev, spaceId: initialSpace[0].id, spaceName: initialSpace[0].name }))
      setSelectedDataContacts(prev => ({ ...prev, spaceId: initialSpace[0].id, spaceName: initialSpace[0].name }))
    }
  }, [initialSpace]);

  useEffect(() => {
    setFolders(initialFolders);

    if (initialFolders.length) {
      setSelectedDataDeals(prev => ({ ...prev, folderId: initialFolders[0]?.id, folderName: initialFolders[0]?.name }))
      setSelectedDataContacts(prev => ({ ...prev, folderId: initialFolders[0]?.id, folderName: initialFolders[0]?.name }))

      if (initialFolders[0]?.lists?.length) {
        setSelectedFolderIndex(0)
        setSelectedDataDeals(prev => ({ ...prev, listId: initialFolders[0]?.lists[0]?.id, listName: initialFolders[0]?.lists[0]?.name }))
        setSelectedDataContacts(prev => ({ ...prev, listId: initialFolders[0]?.lists[0]?.id, listName: initialFolders[0]?.lists[0]?.name }))

        if (initialFolders[0]?.lists[0]?.statuses?.length) {
          setSelectedListIndex(0)
          setSelectedDataDeals(prev => ({ ...prev, status: initialFolders[0]?.lists[0]?.statuses[0]?.status }))
          setSelectedDataContacts(prev => ({ ...prev, status: initialFolders[0]?.lists[0]?.statuses[0]?.status }))
        } else {
          setSelectedListIndex(-1)
          setSelectedDataDeals(prev => ({ ...prev, status: '' }))
          setSelectedDataContacts(prev => ({ ...prev, status: '' }))
        }

      } else {
        setSelectedFolderIndex(-1)
        setSelectedDataDeals(prev => ({ ...prev, listId: '', listName: '', status: '' }))
        setSelectedDataContacts(prev => ({ ...prev, listId: '', listName: '', status: '' }))
      }
    } else {
      setSelectedFolderIndex(-1)
      setSelectedDataDeals(prev => ({ ...prev, folderId: '', folderName: '', listId: '', listName: '', status: '' }))
      setSelectedDataContacts(prev => ({ ...prev, folderId: '', folderName: '', listId: '', listName: '', status: '' }))
    }

    setSelectedFolderIndex(initialFolders?.length ? 0 : -1)
  }, [initialFolders]);

  useEffect(() => {
    if (step === 2) {
      onWorkspaceChangeHandle({ id: selectedDataDeals.workspaceId, name: selectedDataDeals.workspaceName, type: clickupTypes.CONTACTS })
    }
  }, [step]);

  return (
    <>
      {loading && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}
      <div className="clickup-container">
        <button className="back-button" onClick={handleBackClick}>
          &lt; &nbsp; back!
        </button>
        <Steps
          direction="horizontal"
          current={step}
          items={[
            {
              title: 'Configure for Deals',
            },
            {
              title: 'Map Deals Fields',
            },
            {
              title: 'Configure for Contacts',
            },
            {
              title: 'Map Contacts Fields',
            },
            {
              title: 'Finish',
            },
          ]}
        />
        {step === 0 &&
          <>
            <Workspace
              type={clickupTypes.DEALS}
              isDisabled={workspaces?.length === 1}
              workspaces={workspaces}
              onChangeHandler={onWorkspaceChangeHandle}
            />
            <Spaces
              type={clickupTypes.DEALS}
              isDisabled={!space?.length}
              spaces={space}
              onChangeHandler={onSpaceChangeHandler}
              isSharedHierarchy={isSharedHierarchy}
              onCheckboxChange={onSharedHierarchyCheckboxChangeHandle}
            />

            <Folder
              type={clickupTypes.DEALS}
              isDisabled={!folders?.length}
              isFolderless={isFolderlessList}
              folders={folders}
              onChangeHandler={onFolderChangeHandler}
              isFolderlessList={isFolderlessList}
              onCheckboxChange={onFolderlessCheckboxChangeHandle}
            />

            <List
              type={clickupTypes.DEALS}
              isDisabled={!folders[selectedFolderIndex]?.lists?.length}
              lists={folders[selectedFolderIndex]?.lists}
              onChangeHandler={onListChangeHandler}
            />
            <Status
              type={clickupTypes.DEALS}
              isDisabled={!folders[selectedFolderIndex]?.lists[selectedListIndex]?.statuses?.length}
              status={folders[selectedFolderIndex]?.lists[selectedListIndex]?.statuses}
              onChangeHandler={onStatusChangeHandler}
            />
          </>
        }

        {
          step === 1 && <>
            <CustomFieldsDeals
              on={on}
              off={off}
              loading={loading}
              listId={selectedDataDeals.listId}
              onContinue={({ selectedFields, members }: { selectedFields: SelectedFields[], members: Member[] }) => setCustomFieldsDeals({ show: false, listId: '', mappingDone: true, selectedFields, members })}
            />
          </>
        }
        {
          step === 2 && <>
            <>
              <Workspace
                type={clickupTypes.CONTACTS}
                isDisabled={workspaces?.length === 1}
                workspaces={workspaces}
                onChangeHandler={onWorkspaceChangeHandle}
              />
              <Spaces
                type={clickupTypes.CONTACTS}
                isDisabled={!space?.length}
                spaces={space}
                onChangeHandler={onSpaceChangeHandler}
                isSharedHierarchy={isSharedHierarchy}
                onCheckboxChange={onSharedHierarchyCheckboxChangeHandle}
              />

              <Folder
                type={clickupTypes.CONTACTS}
                isDisabled={!folders?.length}
                isFolderless={isFolderlessList}
                folders={folders}
                onChangeHandler={onFolderChangeHandler}
                isFolderlessList={isFolderlessList}
                onCheckboxChange={onFolderlessCheckboxChangeHandle}
              />

              <List
                type={clickupTypes.CONTACTS}
                isDisabled={!folders[selectedFolderIndex]?.lists?.length}
                lists={folders[selectedFolderIndex]?.lists}
                onChangeHandler={onListChangeHandler}
              />
              <Status
                type={clickupTypes.CONTACTS}
                isDisabled={!folders[selectedFolderIndex]?.lists[selectedListIndex]?.statuses?.length}
                status={folders[selectedFolderIndex]?.lists[selectedListIndex]?.statuses}
                onChangeHandler={onStatusChangeHandler}
              />
            </>
          </>
        }

        {
          step === 3 && <>
            <CustomFieldsContacts
              on={on}
              off={off}
              loading={loading}
              listId={selectedDataContacts.listId}
              onContinue={({ selectedFields, members }: { selectedFields: SelectedFields[], members: Member[] }) => setCustomFieldsContacts({ show: false, listId: '', mappingDone: true, selectedFields, members })}
            />
          </>
        }

        {
          step === 4 && <>
            <h4>Finish</h4>
            <button
              disabled={!folders[selectedFolderIndex]?.lists?.length}
              className="save-button mb-5"
              onClick={handleSaveConfiguration}
            >
              Save the configuration
            </button>
          </>
        }


        <div style={{ position: 'absolute', bottom: '4rem' }}>
          {step > 0 && (
            <Button type="default" size="large" style={{ margin: '0 8px' }} onClick={() => setStep(prev => prev - 1)}>
              Previous
            </Button>
          )}
          {step < 4 && (
            <Button className="hub-next-item" size="large" onClick={() => setStep(prev => prev + 1)}>
              Next
            </Button>
          )}
          {(step === 0 || step === 2) && (
            <Button
              size="large"
              style={{ margin: '0 8px' }}
              onClick={handleSkip}
            >
              Skip
            </Button>
          )}
        </div>

      </div>
    </>
  );
};

export default ClickUp;

