import { EditReportConfigurationProps } from "../types";
import {
  DurationSelector,
  EditDataSource,
  EditDataSourceRoiPolygonSelection,
  ObjectCategoriesSelector,
  ReportCamerasSelector,
  useEditedDataSource,
} from "../components";
import { ActivityInRegionReportConfiguration } from "features/dashboard/types";
import {
  INTERVAL_DURATION_OPTIONS,
  MIN_EVENT_DURATION_OPTIONS,
} from "./consts";
import {
  CameraDataSourceWithROI,
  isDefined,
  MountIf,
} from "coram-common-utils";

export function EditActivityInRegionReportConfiguration({
  configuration,
  onConfigurationChange,
}: EditReportConfigurationProps<ActivityInRegionReportConfiguration>) {
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
      />
      <DurationSelector
        name="Minimum event duration"
        duration={configuration.min_event_duration}
        setDuration={(duration) =>
          onConfigurationChange({
            ...configuration,
            min_event_duration: duration,
          })
        }
        durationOptions={MIN_EVENT_DURATION_OPTIONS}
      />
      <DurationSelector
        name="Minimum time gap between two independent events"
        duration={configuration.max_event_time_gap}
        setDuration={(duration) =>
          onConfigurationChange({
            ...configuration,
            max_event_time_gap: duration,
          })
        }
        durationOptions={INTERVAL_DURATION_OPTIONS}
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
