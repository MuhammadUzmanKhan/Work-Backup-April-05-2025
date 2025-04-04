import { useEffect, useState } from "react";
import { CameraBasedDataSource } from "../../types";

export const useEditedDataSource = <T extends CameraBasedDataSource>(
  dataSources: T[]
) => {
  const [editedDataSource, setEditedDataSource] = useState<T>();

  useEffect(() => {
    const dataSourceDoesntExist = !dataSources.some(
      (ds) => ds.mac_address === editedDataSource?.mac_address
    );
    if (dataSourceDoesntExist) {
      setEditedDataSource(dataSources.length > 0 ? dataSources[0] : undefined);
    }
  }, [dataSources, editedDataSource]);

  return { editedDataSource, setEditedDataSource };
};
