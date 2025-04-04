import { EditReportConfigurationProps } from "../types";
import {
  DetectionObjectTypeCategory,
  LineCrossingCameraDataSource,
  LineCrossingDirection,
  LineCrossingReportConfiguration,
  isDefined,
  MountIf,
} from "coram-common-utils";
import {
  EditDataSource,
  ObjectCategoriesSelector,
  ReportCamerasSelector,
  useEditedDataSource,
} from "../components";
import { CameraDatasourceLineDrawer } from "./components";

export function EditLineCrossingReportConfiguration({
  configuration,
  onConfigurationChange,
}: EditReportConfigurationProps<LineCrossingReportConfiguration>) {
  const { editedDataSource, setEditedDataSource } = useEditedDataSource(
    configuration.camera_data_sources
  );

  async function handleCamerasChange(cameras: string[]) {
    const currentDataSources = configuration.camera_data_sources;
    const updatedDataSources = cameras.map((mac_address) => ({
      mac_address,
      line: currentDataSources.find((ds) => ds.mac_address === mac_address)
        ?.line,
      direction:
        currentDataSources.find((ds) => ds.mac_address === mac_address)
          ?.direction ?? LineCrossingDirection.BOTH,
    }));

    onConfigurationChange({
      ...configuration,
      camera_data_sources: updatedDataSources,
    });
  }

  function handleDataSourceUpdate(dataSource: LineCrossingCameraDataSource) {
    setEditedDataSource(dataSource);
    onConfigurationChange({
      ...configuration,
      camera_data_sources: configuration.camera_data_sources.map((ds) =>
        ds.mac_address === dataSource.mac_address ? dataSource : ds
      ),
    });
  }

  return (
    <>
      <ObjectCategoriesSelector
        selectedObjectCategories={configuration.object_categories}
        setSelectedObjectCategories={(objectCategories) =>
          onConfigurationChange({
            ...configuration,
            object_categories: objectCategories,
          })
        }
        objectCategories={[
          DetectionObjectTypeCategory.VEHICLE,
          DetectionObjectTypeCategory.PERSON,
        ]}
      />
      <ReportCamerasSelector
        selectedCamerasMacAddresses={configuration.camera_data_sources.map(
          (ds) => ds.mac_address
        )}
        setSelectedCamerasMacAddresses={handleCamerasChange}
      />
      <MountIf condition={configuration.camera_data_sources.length > 0}>
        <EditDataSource
          title="Draw line for each camera"
          datasourceCameraMacAddresses={configuration.camera_data_sources.map(
            (ds) => ds.mac_address
          )}
          selectedDataSourceCameraMacAddress={editedDataSource?.mac_address}
          onSelectedCameraMacAddressChange={(macAddress) =>
            setEditedDataSource(
              configuration.camera_data_sources.find(
                (ds) => ds.mac_address === macAddress
              )
            )
          }
        >
          {isDefined(editedDataSource) && (
            <CameraDatasourceLineDrawer
              key={editedDataSource.mac_address}
              dataSource={editedDataSource}
              onDataSourceUpdate={handleDataSourceUpdate}
            />
          )}
        </EditDataSource>
      </MountIf>
    </>
  );
}
