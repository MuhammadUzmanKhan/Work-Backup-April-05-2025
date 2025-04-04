import { EditReportConfigurationProps } from "./types";
import {
  EditDataSource,
  EditDataSourceRoiPolygonSelection,
  ObjectCategoriesSelector,
  ReportCamerasSelector,
  useEditedDataSource,
} from "./components";
import {
  CameraDataSourceWithROI,
  DetectionObjectTypeCategory,
  ObjectCountReportConfiguration,
  isDefined,
  MountIf,
} from "coram-common-utils";

export function EditObjectCountReportConfiguration({
  configuration,
  onConfigurationChange,
}: EditReportConfigurationProps<ObjectCountReportConfiguration>) {
  const { editedDataSource, setEditedDataSource } = useEditedDataSource(
    configuration.camera_data_sources
  );

  async function handleCamerasChange(cameras: string[]) {
    const currentDataSources = configuration.camera_data_sources;
    const updatedDataSources = cameras.map((mac_address) => ({
      mac_address,
      roi_polygon:
        currentDataSources.find((ds) => ds.mac_address === mac_address)
          ?.roi_polygon ?? [],
    }));

    onConfigurationChange({
      ...configuration,
      camera_data_sources: updatedDataSources,
    });
  }

  function handleDataSourceUpdate(dataSource: CameraDataSourceWithROI) {
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
          title="Set each camera's region of interest"
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
            <EditDataSourceRoiPolygonSelection
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
